/* eslint-disable */
/**
 * Splunk custom visualization: KPI loaded line — vanilla AMD (full formatter options)
 *
 * Readable hand-maintained source — Webpack does NOT overwrite this file.
 * Feature parity with React fixed_loaded_line / LineChart.jsx.
 *
 * Debug logging (browser console on the Splunk dashboard):
 *   window.SPLUNKSTUFF_KPI_LINE_DEBUG = true;
 * then hard-refresh. Logs are prefixed with [splunkstuff_kpi_line].
 */
define([
    'api/SplunkVisualizationBase',
    './bgdhampTrendColors',
    './bgdhampVizHoverMath',
], function (SplunkVisualizationBase, trendColors, hoverMath) {
    var VIZ_ID = 'splunkstuff_kpi_line';
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_line.';

    /** Splunk loads AMD in a browser context; guard for odd embeds. */
    function debugEnabled() {
        try {
            return typeof window !== 'undefined' && window.SPLUNKSTUFF_KPI_LINE_DEBUG === true;
        } catch (e) {
            return false;
        }
    }

    function log() {
        if (!debugEnabled()) return;
        var args = ['[' + VIZ_ID + ']'].concat(Array.prototype.slice.call(arguments));
        // eslint-disable-next-line no-console
        console.log.apply(console, args);
    }

    function readConfig(config, prop, defaultVal) {
        if (config == null || typeof config !== 'object') return defaultVal;
        var v = config[NS + prop];
        if (v === undefined || v === null || v === '') return defaultVal;
        return v;
    }

    function readBool(config, prop, defaultVal) {
        var v = readConfig(config, prop, null);
        if (v === null || v === '') return defaultVal;
        if (v === true) return true;
        if (v === false) return false;
        var s = String(v).toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes') return true;
        if (s === 'false' || s === '0' || s === 'no') return false;
        return defaultVal;
    }

    function readFloat(config, prop, defaultVal) {
        var raw = readConfig(config, prop, null);
        if (raw === null || raw === '') return defaultVal;
        var n = parseFloat(raw, 10);
        return isFinite(n) ? n : defaultVal;
    }

    function readInt(config, prop, defaultVal) {
        var raw = readConfig(config, prop, null);
        if (raw === null || raw === '') return defaultVal;
        var n = parseInt(raw, 10);
        return isFinite(n) ? n : defaultVal;
    }

    function sanitizeHexColor(raw, fallback) {
        if (typeof raw !== 'string') return fallback;
        var s = raw.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
        return fallback;
    }

    /** Hex (#RRGGBB) or rgb/rgba(...) for threshold fills / strokes. */
    function sanitizeCssColor(raw, fallback) {
        if (typeof raw !== 'string') return fallback;
        var s = raw.trim();
        if (!s) return fallback;
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
        if (/^rgba?\(\s*[\d.]+\s*,/.test(s)) return s;
        return fallback;
    }

    /**
     * Older bgdhampTrendColors module may lack repaintTrendTile; mirror the
     * current implementation so panels still render until per-viz helper is refreshed.
     */
    function repaintTrendTileCompat(hostEl, rootEl, chartEl, majorEl, bg, textColor) {
        trendColors.applyTrendHostStyle(hostEl, bg, textColor);
        if (rootEl) trendColors.applyTrendSurfaceStyle(rootEl, bg);
        if (majorEl) trendColors.applyTrendSurfaceStyle(majorEl, bg);
        if (chartEl) trendColors.applyTrendSurfaceStyle(chartEl, bg);
        var p = hostEl ? hostEl.parentElement : null;
        var depth = 0;
        while (p && depth < 4) {
            trendColors.applyTrendSurfaceStyle(p, bg);
            p = p.parentElement;
            depth += 1;
        }
    }

    /** Splunk dashboard wrappers often set pointer-events:none on viz hosts; don't stop early. */
    function enableAncestorPointerEvents(el, maxDepth) {
        var node = el;
        var depth = 0;
        var limit = maxDepth == null ? 24 : maxDepth;
        while (node && depth < limit) {
            if (node.style) {
                node.style.pointerEvents = 'auto';
            }
            node = node.parentElement;
            depth += 1;
        }
    }

    function fieldName(fields, idx) {
        if (!fields || idx < 0 || idx >= fields.length) return '';
        var f = fields[idx];
        if (typeof f === 'string') return f;
        if (f != null && f.name != null) return String(f.name);
        return '';
    }

    function findTimeColumnIndex(rawData) {
        if (!rawData || !rawData.fields) return -1;
        var i;
        for (i = 0; i < rawData.fields.length; i += 1) {
            if (fieldName(rawData.fields, i) === '_time') return i;
        }
        return -1;
    }

    function timeSortKey(rawData, timeIdx, rowIdx) {
        var cell = rawData.columns[timeIdx][rowIdx];
        if (cell == null || cell === '') return 0;
        if (typeof cell === 'number' && isFinite(cell)) return cell;
        var s = String(cell).trim();
        if (/^-?\d+(\.\d+)?$/.test(s)) {
            var n = parseFloat(s, 10);
            return isFinite(n) ? n : 0;
        }
        var ms = Date.parse(s);
        if (isFinite(ms)) return ms / 1000;
        var fb = parseFloat(s, 10);
        return isFinite(fb) ? fb : 0;
    }

    function reorderValuesAndTimesByTime(rawData, valueIdx, timeIdx) {
        var valCol = rawData.columns[valueIdx];
        var n = valCol ? valCol.length : 0;
        if (!n) return { values: [], times: [] };
        if (timeIdx < 0 || !rawData.columns[timeIdx] || rawData.columns[timeIdx].length !== n) {
            return {
                values: valCol.map(function (v) {
                    return parseFloat(v, 10);
                }),
                times: [],
            };
        }
        var tcol = rawData.columns[timeIdx];
        var order = [];
        var r;
        for (r = 0; r < n; r += 1) order.push(r);
        order.sort(function (a, b) {
            var ka = timeSortKey(rawData, timeIdx, a);
            var kb = timeSortKey(rawData, timeIdx, b);
            if (ka !== kb) return ka - kb;
            return a - b;
        });
        return {
            values: order.map(function (ri) {
                return parseFloat(valCol[ri], 10);
            }),
            times: order.map(function (ri) {
                return tcol[ri];
            }),
        };
    }

    function pickNumericColumnIndex(rawData) {
        if (!rawData || !rawData.columns || !rawData.fields) return -1;
        var best = -1;
        var c;
        for (c = 0; c < rawData.columns.length; c += 1) {
            if (fieldName(rawData.fields, c) === '_time') continue;
            var col = rawData.columns[c];
            if (!col || col.length === 0) continue;
            var ok = true;
            var i;
            for (i = 0; i < col.length; i += 1) {
                if (!isFinite(parseFloat(col[i], 10))) {
                    ok = false;
                    break;
                }
            }
            if (ok) best = c;
        }
        return best;
    }

    function buildComparisonValues(values) {
        return values.map(function (v, i) {
            var base = parseFloat(v, 10);
            var wiggle = i % 2 === 0 ? -6 : 4;
            return isFinite(base) ? base + wiggle : base;
        });
    }

    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    function sma(values, windowSize) {
        var w = Math.max(1, Math.floor(Number(windowSize) || 1));
        if (w <= 1) return values.slice();
        var out = [];
        var sum = 0;
        var i;
        for (i = 0; i < values.length; i += 1) {
            sum += values[i];
            if (i >= w) sum -= values[i - w];
            out.push(sum / Math.min(i + 1, w));
        }
        return out;
    }

    function downsample(values, times, maxPoints) {
        var cap = Math.floor(Number(maxPoints) || 0);
        if (!cap || values.length <= cap) return { values: values, times: times };
        var stride = Math.ceil(values.length / cap);
        var vOut = [];
        var tOut = [];
        var i;
        for (i = 0; i < values.length; i += stride) {
            vOut.push(values[i]);
            tOut.push(times[i]);
        }
        if (vOut[vOut.length - 1] !== values[values.length - 1]) {
            vOut.push(values[values.length - 1]);
            tOut.push(times[times.length - 1]);
        }
        return { values: vOut, times: tOut };
    }

    function buildPath(values, width, height, padL, padR, padT, padB, vmin, vmax) {
        var iw = Math.max(1, width - padL - padR);
        var ih = Math.max(1, height - padT - padB);
        var n = values.length;
        if (n < 2) return '';
        var xStep = iw / (n - 1);
        var parts = [];
        var i;
        for (i = 0; i < n; i += 1) {
            var v = Number(values[i]);
            var ratio = (v - vmin) / (vmax - vmin);
            ratio = clamp(ratio, 0, 1);
            var x = padL + i * xStep;
            var y = padT + ih - ratio * ih;
            parts.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
        }
        return parts.join(' ');
    }

    function computeAnomalies(values, mode, sensitivity) {
        var m = mode || 'none';
        var s = isFinite(Number(sensitivity)) ? Number(sensitivity) : 3;
        var flags = [];
        var i;
        for (i = 0; i < values.length; i += 1) flags.push(false);
        if (m === 'none' || values.length < 3) return flags;

        if (m === 'pctChange') {
            for (i = 1; i < values.length; i += 1) {
                var prev = values[i - 1];
                var cur = values[i];
                if (!isFinite(prev) || !isFinite(cur) || prev === 0) continue;
                if (Math.abs((cur - prev) / prev) >= s / 10) flags[i] = true;
            }
            return flags;
        }

        var deltas = [];
        for (i = 1; i < values.length; i += 1) {
            var d = values[i] - values[i - 1];
            if (isFinite(d)) deltas.push(d);
        }
        if (deltas.length < 2) return flags;
        var mean = deltas.reduce(function (a, b) {
            return a + b;
        }, 0) / deltas.length;
        var varN =
            deltas.reduce(function (acc, d) {
                return acc + (d - mean) * (d - mean);
            }, 0) / deltas.length;
        var sd = Math.sqrt(varN) || 0;
        if (!sd) return flags;
        for (i = 1; i < values.length; i += 1) {
            d = values[i] - values[i - 1];
            if (!isFinite(d)) continue;
            if (Math.abs((d - mean) / sd) >= s) flags[i] = true;
        }
        return flags;
    }

    function isLikelyEpochSeconds(n) {
        return isFinite(n) && n > 31536000 && n < 4102444800;
    }

    function isLikelyEpochMs(n) {
        return isFinite(n) && n > 31536000000 && n < 4102444800000;
    }

    function normalizeTimes(rawTimes, len) {
        var times = Array.isArray(rawTimes) ? rawTimes.slice(0, len) : [];
        var ms = [];
        var ok = 0;
        var i;
        for (i = 0; i < len; i += 1) {
            var t = times[i];
            if (typeof t === 'string') {
                var parsed = Date.parse(t);
                if (isFinite(parsed)) {
                    ms.push(parsed);
                    ok += 1;
                    continue;
                }
            }
            if (typeof t === 'number' && isFinite(t)) {
                if (isLikelyEpochMs(t)) {
                    ms.push(t);
                    ok += 1;
                    continue;
                }
                if (isLikelyEpochSeconds(t)) {
                    ms.push(t * 1000);
                    ok += 1;
                    continue;
                }
            }
            ms.push(null);
        }
        return { ms: ms, timeLike: ok >= Math.max(2, Math.floor(len * 0.7)) };
    }

    function bounds(minIn, maxIn) {
        var lo = parseFloat(minIn, 10);
        var hi = parseFloat(maxIn, 10);
        if (!isFinite(lo)) lo = 0;
        if (!isFinite(hi)) hi = 100;
        if (lo > hi) {
            var t = lo;
            lo = hi;
            hi = t;
        }
        if (hi <= lo) hi = lo + 1;
        return { min: lo, max: hi };
    }

    function formatDelta(d) {
        if (!isFinite(d)) return '—';
        return (d >= 0 ? '\u25b2 ' : '\u25bc ') + d.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    function formatHoverTime(times, ms, idx, timeLike) {
        if (timeLike && isFinite(ms[idx])) {
            return new Date(ms[idx]).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        if (times[idx] == null) return '';
        return String(times[idx]);
    }

    function formatHoverValue(v, unit) {
        if (!isFinite(v)) return '—';
        return v.toLocaleString(undefined, { maximumFractionDigits: 2 }) + String(unit || '');
    }

    function clearHoverOverlay(svg, tooltip, hoverAnnEl) {
        if (!svg) return;
        var old = svg.querySelector('.bgdhamp-kpi-line-viz__hover');
        if (old) {
            old.parentNode.removeChild(old);
        }
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        if (hoverAnnEl) {
            hoverAnnEl.style.display = 'none';
            hoverAnnEl.textContent = '';
        }
    }

    function updateHoverOverlay(svg, tooltip, ownerDoc, opts) {
        var hx = opts.hx;
        var hy = opts.hy;
        var padT = opts.padT;
        var padB = opts.padB;
        var chartH = opts.chartH;
        var stroke = opts.stroke;
        var idx = opts.idx;
        var plotValues = opts.plotValues;
        var times = opts.times;
        var norm = opts.norm;
        var unit = opts.unit;
        var width = opts.width;

        var svgDoc = svg.ownerDocument || ownerDoc;

        clearHoverOverlay(svg, tooltip, opts.hoverAnnEl);

        var g = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'bgdhamp-kpi-line-viz__hover');
        g.setAttribute('pointer-events', 'none');

        var line = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', hx.toFixed(1));
        line.setAttribute('x2', hx.toFixed(1));
        line.setAttribute('y1', String(padT));
        line.setAttribute('y2', String(chartH - padB));
        line.setAttribute('stroke', 'rgba(255,255,255,0.22)');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);

        var dot = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', hx.toFixed(1));
        dot.setAttribute('cy', hy.toFixed(1));
        dot.setAttribute('r', '4');
        dot.setAttribute('fill', stroke);
        dot.setAttribute('stroke', 'rgba(0,0,0,0.35)');
        dot.setAttribute('stroke-width', '1');
        g.appendChild(dot);

        svg.appendChild(g);

        var v = plotValues[idx];
        var timeLabel = formatHoverTime(times, norm.ms, idx, norm.timeLike);
        var valueLabel = formatHoverValue(v, unit);

        tooltip.innerHTML = '';
        var valEl = ownerDoc.createElement('div');
        valEl.className = 'bgdhamp-kpi-line-viz__tooltipValue';
        valEl.textContent = valueLabel;
        tooltip.appendChild(valEl);
        if (timeLabel) {
            var timeEl = ownerDoc.createElement('div');
            timeEl.className = 'bgdhamp-kpi-line-viz__tooltipTime';
            timeEl.textContent = timeLabel;
            tooltip.appendChild(timeEl);
        }

        tooltip.style.display = 'block';
        tooltip.style.visibility = '';
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '2147483646';
        if (isFinite(opts.clientX) && isFinite(opts.clientY)) {
            tooltip.style.left = opts.clientX + 'px';
            tooltip.style.top = opts.clientY + 'px';
            tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
        } else if (opts.chartWrap) {
            var wrapRect = opts.chartWrap.getBoundingClientRect();
            var fx = clamp(opts.hx, 8, Math.max(8, opts.width - 8)) + wrapRect.left;
            var fy = opts.hy + wrapRect.top;
            tooltip.style.left = fx + 'px';
            tooltip.style.top = fy + 'px';
            tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
        } else {
            var leftPx = clamp(opts.hx, 8, Math.max(8, opts.width - 8));
            var topPx = Math.max(8, opts.hy - 8);
            tooltip.style.left = leftPx + 'px';
            tooltip.style.top = topPx + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
        }
        var bodyEl = ownerDoc.body || ownerDoc.documentElement;
        if (bodyEl && tooltip.parentNode !== bodyEl) {
            bodyEl.appendChild(tooltip);
        }

        if (opts.showHoverAnnotation && opts.hoverAnnEl) {
            var ann = opts.hoverAnnEl;
            var annParts = [valueLabel];
            if (timeLabel) annParts.push(timeLabel);
            ann.textContent = annParts.join(' \u2014 ');
            ann.style.display = 'block';
        }
    }

    log('module loaded');

    if (typeof console !== 'undefined' && typeof console.info === 'function') {
        // One-time signpost; detailed traces need window.SPLUNKSTUFF_KPI_LINE_DEBUG = true (see file header).
        // eslint-disable-next-line no-console
        console.info(
            '[' + VIZ_ID + '] visualization loaded. Verbose logs: window.SPLUNKSTUFF_KPI_LINE_DEBUG = true (then refresh).'
        );
    }

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        /**
         * Column-major input → { values, times } for updateView.
         * Picks the last all-numeric non-_time column; sorts by _time when present.
         */
        formatData: function (rawData) {
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                log('formatData: empty columns');
                return { values: [], times: [] };
            }
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                log('formatData: no numeric column — VisualizationError');
                throw new SplunkVisualizationBase.VisualizationError(
                    'KPI loaded line (BGDHamp) requires at least one all-numeric column (excluding _time).'
                );
            }
            var tIdx = findTimeColumnIndex(rawData);
            var out = reorderValuesAndTimesByTime(rawData, idx, tIdx);
            log('formatData: valueCol', idx, '_timeCol', tIdx, 'points', out.values ? out.values.length : 0);
            return out;
        },

        /**
         * Full DOM rebuild: subheader, optional major row, SVG strip, hover + optional drilldown.
         */
        updateView: function (data, config) {
            var t0 = debugEnabled() && typeof performance !== 'undefined' ? performance.now() : 0;
            try {
            if (config == null || typeof config !== 'object') {
                log('updateView: config missing or non-object — using {}');
                config = {};
            }
            log('updateView: start values.length', (data && data.values && data.values.length) || 0);
            this._lastData = data;
            this._lastConfig = config;
            if (typeof this._docHoverCleanup === 'function') {
                this._docHoverCleanup();
                this._docHoverCleanup = null;
            }
            if (this._hoverTooltipEl && this._hoverTooltipEl.parentNode) {
                this._hoverTooltipEl.parentNode.removeChild(this._hoverTooltipEl);
                this._hoverTooltipEl = null;
            }
            this.el.innerHTML = '';

            var ownerDoc = (this.el && this.el.ownerDocument) || document;

            var values = (data && data.values) || [];
            var times = (data && data.times) || [];
            var goodColor = sanitizeHexColor(readConfig(config, 'goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(readConfig(config, 'badColor', '#DFA611'), '#DFA611');
            var textColor = sanitizeHexColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');
            var background = sanitizeHexColor(readConfig(config, 'background', '#0B1F3B'), '#0B1F3B');
            var emptyText = String(readConfig(config, 'emptyText', '') || '');

            // --- Empty / insufficient points (emptyText when set) ---
            if (values.length < 2) {
                log('updateView: empty branch len=', values.length);
                trendColors.applyTrendHostStyle(this.el, background, textColor);
                var empty = ownerDoc.createElement('div');
                empty.className = 'bgdhamp-kpi-line-viz__err';
                var defaultEmptyMsg =
                    values.length === 0
                        ? 'No numeric results to display.'
                        : 'Need at least 2 numeric points for the line chart.';
                empty.textContent = emptyText || defaultEmptyMsg;
                this.el.appendChild(empty);
                return;
            }

            var smoothing = String(readConfig(config, 'smoothing', 'none')).toLowerCase();
            var smaWindow = readInt(config, 'smaWindow', 3);
            var maxPoints = readInt(config, 'maxPoints', 0);
            var plotValues = values.slice();
            if (smoothing === 'sma') plotValues = sma(plotValues, smaWindow);
            var ds = downsample(plotValues, times, maxPoints);
            plotValues = ds.values;
            times = ds.times;

            var comparison = readBool(config, 'comparison', false);
            var cmpValues = null;
            if (comparison) {
                cmpValues = buildComparisonValues(plotValues);
                if (smoothing === 'sma') cmpValues = sma(cmpValues, smaWindow);
            }

            var scale = bounds(readConfig(config, 'min', 0), readConfig(config, 'max', 100));
            var stroke = sanitizeHexColor(readConfig(config, 'stroke', '#FFFFFF'), '#FFFFFF');
            var unit = String(readConfig(config, 'unit', '') || '');
            var subheader = String(readConfig(config, 'subheader', '') || '');
            var useThreshold = readBool(config, 'threshold', false);
            var thMin = useThreshold ? readFloat(config, 'thresholdMin', 20) : null;
            var thMax = useThreshold ? readFloat(config, 'thresholdMax', 80) : null;
            var target = useThreshold ? readFloat(config, 'target', 50) : null;
            var anomalyMode = String(readConfig(config, 'anomalies', 'none'));
            var anomalySens = readInt(config, 'anomalySensitivity', 3);
            var showXAxis = readBool(config, 'showXAxis', false);
            // Splunk formatter text fields may omit the key; only explicit false disables hover.
            var showHover = readBool(config, 'showHover', true);
            if (readConfig(config, 'showHover', null) === null) {
                showHover = true;
            }
            var drilldown = readBool(config, 'drilldown', false);
            var drilldownQuery = String(
                readConfig(config, 'drilldownQuery', 'search index=_internal | stats count') || ''
            );

            var showMajor = readBool(config, 'showMajor', true);
            var centerMajor = readBool(config, 'centerMajor', true);
            var colorPlacement = String(readConfig(config, 'colorPlacement', 'full') || 'full').toLowerCase();
            if (colorPlacement !== 'top') colorPlacement = 'full';
            var strokeWidth = readFloat(config, 'strokeWidth', 2);
            if (!isFinite(strokeWidth) || strokeWidth <= 0) strokeWidth = 2;
            var unitScale = readFloat(config, 'unitScale', 0.6);
            if (!isFinite(unitScale) || unitScale <= 0) unitScale = 0.6;
            var thresholdShade = sanitizeCssColor(
                readConfig(config, 'thresholdShade', 'rgba(0,0,0,0.12)'),
                'rgba(0,0,0,0.12)'
            );
            var targetStroke = sanitizeCssColor(
                readConfig(config, 'targetStroke', 'rgba(255,255,255,0.5)'),
                'rgba(255,255,255,0.5)'
            );
            var showHoverAnnotation = readBool(config, 'showHoverAnnotation', false);
            var padLeftCfg = readFloat(config, 'padLeft', 10);
            var padRightCfg = readFloat(config, 'padRight', 10);
            var padTopCfg = readFloat(config, 'padTop', 2);
            var padBottomCfg = readFloat(config, 'padBottom', 12);
            if (!isFinite(padLeftCfg)) padLeftCfg = 10;
            if (!isFinite(padRightCfg)) padRightCfg = 10;
            if (!isFinite(padTopCfg)) padTopCfg = 2;
            if (!isFinite(padBottomCfg)) padBottomCfg = 12;

            var delta = trendColors.trendDelta(plotValues);
            var trendBg = trendColors.trendBackground(delta, goodColor, badColor);
            trendColors.applyTrendHostStyle(this.el, trendBg, textColor);

            var last = plotValues[plotValues.length - 1];

            var norm = normalizeTimes(times, plotValues.length);
            var anomalyFlags = computeAnomalies(plotValues, anomalyMode, anomalySens);

            var width = Math.max(120, this.el.clientWidth || 400);
            var height = Math.max(80, this.el.clientHeight || 200);
            var subheaderH = subheader ? 28 : 0;
            var majorH = showMajor ? 44 : 0;
            var effPadL = showMajor ? Math.min(padLeftCfg, 10) : padLeftCfg;
            var effPadR = showMajor ? Math.min(padRightCfg, 10) : padRightCfg;
            var effPadT = showMajor ? Math.min(padTopCfg, 2) : padTopCfg;
            var effPadB = showMajor ? Math.min(padBottomCfg, 12) : padBottomCfg;
            var padL = effPadL;
            var padR = effPadR;
            var padT = effPadT;
            var padB = effPadB;
            var chartH = Math.max(40, height - subheaderH - majorH);

            var containerBg = showMajor && colorPlacement === 'top' ? background : trendBg;
            var chartStripBg = showMajor && colorPlacement === 'top' ? background : trendBg;

            log(
                'layout:',
                'showMajor',
                showMajor,
                'colorPlacement',
                colorPlacement,
                'chartH',
                chartH,
                'size',
                width + 'x' + height,
                'hover',
                showHover,
                'annot',
                showHoverAnnotation,
                'drill',
                drilldown
            );

            // --- Root flex column: header → major row → chart strip ---
            var root = ownerDoc.createElement('div');
            root.className = 'bgdhamp-kpi-line-viz';
            trendColors.applyTrendSurfaceStyle(root, containerBg);
            root.style.color = textColor;
            root.style.width = '100%';
            root.style.height = '100%';
            root.style.minHeight = '100%';
            root.style.pointerEvents = 'auto';

            if (subheader) {
                var head = ownerDoc.createElement('div');
                head.className = 'bgdhamp-kpi-line-viz__header';
                head.textContent = subheader;
                root.appendChild(head);
            }

            var majorRow = null;
            if (showMajor) {
                majorRow = ownerDoc.createElement('div');
                majorRow.className = 'bgdhamp-kpi-line-viz__major';
                majorRow.style.justifyContent = centerMajor ? 'center' : 'space-between';
                majorRow.style.textAlign = centerMajor ? 'center' : '';
                var major = ownerDoc.createElement('div');
                major.className = 'bgdhamp-kpi-line-viz__majorVal';
                major.textContent = isFinite(last)
                    ? last.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : '—';
                if (unit) {
                    var unitSpan = ownerDoc.createElement('span');
                    unitSpan.className = 'bgdhamp-kpi-line-viz__unit';
                    unitSpan.style.fontSize = unitScale + 'em';
                    unitSpan.textContent = unit;
                    major.appendChild(unitSpan);
                }

                var trend = ownerDoc.createElement('div');
                trend.className = 'bgdhamp-kpi-line-viz__trend';
                trend.style.marginLeft = centerMajor ? '6px' : '';
                trend.textContent = formatDelta(delta);

                trendColors.applyTrendSurfaceStyle(majorRow, trendBg);

                majorRow.appendChild(major);
                majorRow.appendChild(trend);
                root.appendChild(majorRow);
            }

            var chartWrap = ownerDoc.createElement('div');
            chartWrap.className = 'bgdhamp-kpi-line-viz__chart';
            chartWrap.style.flex = '1 1 auto';
            chartWrap.style.minHeight = chartH + 'px';
            chartWrap.style.width = '100%';
            trendColors.applyTrendSurfaceStyle(chartWrap, chartStripBg);
            chartWrap.style.pointerEvents = 'auto';

            // --- SVG model space; screen size uses meet letterboxing in bgdhampVizHoverMath ---
            var svg = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', String(width));
            svg.setAttribute('height', String(chartH));
            svg.style.display = 'block';
            svg.style.width = '100%';
            svg.style.cursor = drilldown && norm.timeLike ? 'pointer' : 'default';
            svg.style.pointerEvents = 'auto';

            function yFor(v) {
                var ih = Math.max(1, chartH - padT - padB);
                var ratio = (v - scale.min) / (scale.max - scale.min);
                return padT + ih - clamp(ratio, 0, 1) * ih;
            }

            var chartBg = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
            chartBg.setAttribute('class', 'bgdhamp-kpi-line-viz__chartBg');
            chartBg.setAttribute('x', '0');
            chartBg.setAttribute('y', '0');
            chartBg.setAttribute('width', String(width));
            chartBg.setAttribute('height', String(chartH));
            chartBg.setAttribute('fill', chartStripBg);
            svg.appendChild(chartBg);

            if (useThreshold && isFinite(thMin)) {
                var rectLo = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rectLo.setAttribute('x', String(padL));
                rectLo.setAttribute('y', '0');
                rectLo.setAttribute('width', String(Math.max(0, width - padL - padR)));
                rectLo.setAttribute('height', String(Math.max(0, yFor(thMin))));
                rectLo.setAttribute('fill', thresholdShade);
                svg.appendChild(rectLo);
            }
            if (useThreshold && isFinite(thMax)) {
                var yHi = yFor(thMax);
                var rectHi = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rectHi.setAttribute('x', String(padL));
                rectHi.setAttribute('y', String(Math.max(0, yHi)));
                rectHi.setAttribute('width', String(Math.max(0, width - padL - padR)));
                rectHi.setAttribute('height', String(Math.max(0, chartH - padB - yHi)));
                rectHi.setAttribute('fill', thresholdShade);
                svg.appendChild(rectHi);
            }
            if (useThreshold && isFinite(target)) {
                var yT = yFor(target);
                var tLine = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
                tLine.setAttribute('x1', String(padL));
                tLine.setAttribute('y1', String(yT));
                tLine.setAttribute('x2', String(width - padR));
                tLine.setAttribute('y2', String(yT));
                tLine.setAttribute('stroke', targetStroke);
                tLine.setAttribute('stroke-width', '1');
                tLine.setAttribute('stroke-dasharray', '4 3');
                svg.appendChild(tLine);
            }

            if (cmpValues) {
                var cmpPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
                var cmpD = buildPath(
                    cmpValues,
                    width,
                    chartH,
                    padL,
                    padR,
                    padT,
                    padB,
                    scale.min,
                    scale.max
                );
                if (cmpD) {
                    cmpPath.setAttribute('d', cmpD);
                    cmpPath.setAttribute('fill', 'none');
                    cmpPath.setAttribute('stroke', 'rgba(255,255,255,0.65)');
                    cmpPath.setAttribute('stroke-width', String(strokeWidth));
                    cmpPath.setAttribute('stroke-dasharray', '6 4');
                    cmpPath.setAttribute('stroke-opacity', '0.55');
                    svg.appendChild(cmpPath);
                }
            }

            var mainD = buildPath(
                plotValues,
                width,
                chartH,
                padL,
                padR,
                padT,
                padB,
                scale.min,
                scale.max
            );
            if (mainD) {
                var mainPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
                mainPath.setAttribute('d', mainD);
                mainPath.setAttribute('fill', 'none');
                mainPath.setAttribute('stroke', stroke);
                mainPath.setAttribute('stroke-width', String(strokeWidth));
                mainPath.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(mainPath);
            }

            var n = plotValues.length;
            var innerW = Math.max(1, width - padL - padR);
            var xStep = n > 1 ? innerW / (n - 1) : innerW;
            var ai;
            for (ai = 0; ai < n; ai += 1) {
                if (!anomalyFlags[ai]) continue;
                var ax = padL + ai * xStep;
                var ay = yFor(plotValues[ai]);
                var dot = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', ax.toFixed(1));
                dot.setAttribute('cy', ay.toFixed(1));
                dot.setAttribute('r', '3');
                dot.setAttribute('fill', '#ff6b6b');
                svg.appendChild(dot);
            }

            if (showXAxis && norm.timeLike && norm.ms.length >= 2) {
                var tickCount = 4;
                var ti;
                for (ti = 0; ti < tickCount; ti += 1) {
                    var idx = Math.round((ti * (n - 1)) / (tickCount - 1));
                    var tx = padL + idx * xStep;
                    var tick = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
                    tick.setAttribute('x', tx.toFixed(1));
                    tick.setAttribute('y', String(chartH - 2));
                    tick.setAttribute('fill', 'rgba(255,255,255,0.55)');
                    tick.setAttribute('font-size', '9');
                    tick.setAttribute('text-anchor', 'middle');
                    var label = isFinite(norm.ms[idx])
                        ? new Date(norm.ms[idx]).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : String(times[idx] != null ? times[idx] : '');
                    tick.textContent = label;
                    svg.appendChild(tick);
                }
            }

            var hoverAnnEl = null;
            if (showHoverAnnotation) {
                hoverAnnEl = ownerDoc.createElement('div');
                hoverAnnEl.className = 'bgdhamp-kpi-line-viz__hoverAnn';
                hoverAnnEl.setAttribute('aria-hidden', 'true');
            }

            var tooltip = ownerDoc.createElement('div');
            tooltip.className = 'bgdhamp-kpi-line-viz__tooltip';
            tooltip.setAttribute('role', 'status');
            tooltip.setAttribute('aria-live', 'polite');
            tooltip.setAttribute('aria-atomic', 'true');
            tooltip.style.display = 'none';
            tooltip.style.position = 'fixed';
            this._hoverTooltipEl = tooltip;

            function hitTestChart(px, py) {
                // Use chartWrap, not svg: flex can make chartWrap taller than svg while the gold
                // “footer” still looks like chart area — svg hit-test would miss those rows (React
                // pins a wrapper to exact chartH so it doesn’t have this gap).
                var rect = chartWrap.getBoundingClientRect();
                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    px >= rect.left &&
                    px <= rect.right &&
                    py >= rect.top &&
                    py <= rect.bottom
                );
            }

            var teardownDoc = [];

            // --- Document-level listeners: Splunk overlays block bubble events on the SVG ---
            if (showHover && n >= 2) {
                function onDocPointerMove(e) {
                    if (!hitTestChart(e.clientX, e.clientY)) {
                        clearHoverOverlay(svg, tooltip, hoverAnnEl);
                        return;
                    }
                    var idx = hoverMath.seriesIndexFromPointerMeet(
                        e.clientX,
                        e.clientY,
                        svg,
                        width,
                        chartH,
                        padL,
                        padR,
                        n
                    );
                    if (idx === null) {
                        clearHoverOverlay(svg, tooltip, hoverAnnEl);
                        return;
                    }
                    var hx = padL + idx * xStep;
                    var hy = yFor(plotValues[idx]);
                    updateHoverOverlay(svg, tooltip, ownerDoc, {
                        hx: hx,
                        hy: hy,
                        padT: padT,
                        padB: padB,
                        chartH: chartH,
                        stroke: stroke,
                        idx: idx,
                        plotValues: plotValues,
                        times: times,
                        norm: norm,
                        unit: unit,
                        width: width,
                        chartWrap: chartWrap,
                        clientX: e.clientX,
                        clientY: e.clientY,
                        showHoverAnnotation: showHoverAnnotation,
                        hoverAnnEl: hoverAnnEl,
                    });
                }
                teardownDoc.push(function () {
                    ownerDoc.removeEventListener('pointermove', onDocPointerMove, true);
                    ownerDoc.removeEventListener('pointerdown', onDocPointerMove, true);
                    ownerDoc.removeEventListener('mousemove', onDocPointerMove, true);
                    if (ownerDoc.defaultView) {
                        ownerDoc.defaultView.removeEventListener('mousemove', onDocPointerMove, true);
                    }
                });
                ownerDoc.addEventListener('pointermove', onDocPointerMove, true);
                ownerDoc.addEventListener('pointerdown', onDocPointerMove, true);
                ownerDoc.addEventListener('mousemove', onDocPointerMove, true);
                if (ownerDoc.defaultView) {
                    ownerDoc.defaultView.addEventListener('mousemove', onDocPointerMove, true);
                }
            }

            // Same stacking issue breaks svg.onclick on dashboards.
            if (drilldown && norm.timeLike) {
                function onDocClick(e) {
                    if (!hitTestChart(e.clientX, e.clientY)) return;
                    var idx = hoverMath.seriesIndexFromPointerMeet(
                        e.clientX,
                        e.clientY,
                        svg,
                        width,
                        chartH,
                        padL,
                        padR,
                        n
                    );
                    if (idx === null) return;
                    var ms = norm.ms[idx];
                    if (!isFinite(ms)) return;
                    var prevMs = idx > 0 ? norm.ms[idx - 1] : ms;
                    var nextMs = idx < norm.ms.length - 1 ? norm.ms[idx + 1] : ms;
                    var earliest = Math.floor((prevMs + ms) / 2 / 1000);
                    var latest = Math.floor((ms + nextMs) / 2 / 1000);
                    var params = new URLSearchParams();
                    params.set('q', drilldownQuery || '*');
                    params.set('earliest', String(earliest));
                    params.set('latest', String(latest));
                    var navWin = ownerDoc.defaultView || window;
                    navWin.location.href = '/app/search/search?' + params.toString();
                }
                teardownDoc.push(function () {
                    ownerDoc.removeEventListener('click', onDocClick, true);
                });
                ownerDoc.addEventListener('click', onDocClick, true);
            }

            if (teardownDoc.length) {
                this._docHoverCleanup = function () {
                    var ti;
                    for (ti = 0; ti < teardownDoc.length; ti += 1) teardownDoc[ti]();
                };
            }

            if (this.el && this.el.style) {
                this.el.style.pointerEvents = 'auto';
            }
            enableAncestorPointerEvents(this.el);

            chartWrap.appendChild(svg);
            if (hoverAnnEl) {
                chartWrap.appendChild(hoverAnnEl);
            }
            root.appendChild(chartWrap);
            this.el.appendChild(root);

            // --- Re-tint after Splunk may have painted chrome over the tile (vanilla pattern + placement colors) ---
            var vizHost = this.el;
            var repaintPass = 0;
            function repaintTrend() {
                repaintPass += 1;
                log('repaintTrend pass', repaintPass);
                repaintTrendTileCompat(vizHost, root, chartWrap, majorRow, trendBg, textColor);
                trendColors.applyTrendSurfaceStyle(root, containerBg);
                trendColors.applyTrendSurfaceStyle(chartWrap, chartStripBg);
                chartBg.setAttribute('fill', chartStripBg);
            }
            repaintTrend();
            if (typeof requestAnimationFrame === 'function') {
                log('repaintTrend: scheduling rAF follow-up');
                requestAnimationFrame(repaintTrend);
            }

            if (t0) {
                log('updateView: done', plotValues.length, 'points', 'ms', (performance.now() - t0).toFixed(1));
            } else {
                log('updateView: done', plotValues.length, 'points');
            }
            } catch (err) {
                if (debugEnabled()) {
                    // eslint-disable-next-line no-console
                    console.error('[' + VIZ_ID + '] updateView exception', err);
                }
                throw err;
            }
        },

        reflow: function () {
            log('reflow');
            if (this._lastData) {
                this.updateView(this._lastData, this._lastConfig == null ? {} : this._lastConfig);
            }
        },

        remove: function () {
            log('remove');
            if (typeof this._docHoverCleanup === 'function') {
                this._docHoverCleanup();
                this._docHoverCleanup = null;
            }
            if (this._hoverTooltipEl && this._hoverTooltipEl.parentNode) {
                this._hoverTooltipEl.parentNode.removeChild(this._hoverTooltipEl);
            }
            this._hoverTooltipEl = null;
            this._lastData = null;
            this._lastConfig = null;
            this.el.innerHTML = '';
        },
    });
});
