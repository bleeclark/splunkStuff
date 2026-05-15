/* eslint-disable */
/**
 * Splunk custom visualization: Fixed loaded line (vanilla AMD)
 *
 * Readable hand-maintained source — Webpack does NOT overwrite this file.
 * Feature parity with React fixed_loaded_line / LineChart.jsx.
 */
define([
    'api/SplunkVisualizationBase',
    '../_shared/splunkstuffTrendColors',
], function (SplunkVisualizationBase, trendColors) {
    var DEBUG = false;
    var VIZ_ID = 'fixed_loaded_line_vanilla';
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.fixed_loaded_line_vanilla.';

    function log() {
        if (!DEBUG) return;
        var args = ['[' + VIZ_ID + ']'].concat(Array.prototype.slice.call(arguments));
        // eslint-disable-next-line no-console
        console.log.apply(console, args);
    }

    function readConfig(config, prop, defaultVal) {
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

    /** Splunk dashboard wrappers often set pointer-events:none on viz hosts; don't stop early. */
    function enableAncestorPointerEvents(el, maxDepth) {
        var node = el;
        var depth = 0;
        var limit = maxDepth == null ? 24 : maxDepth;
        while (node && depth < limit) {
            node.style.pointerEvents = 'auto';
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

    function clearHoverOverlay(svg, tooltip) {
        var old = svg.querySelector('.splunk-one-fixed-loaded-line-vanilla-viz__hover');
        if (old) {
            old.parentNode.removeChild(old);
        }
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    function updateHoverOverlay(svg, tooltip, opts) {
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

        clearHoverOverlay(svg, tooltip);

        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'splunk-one-fixed-loaded-line-vanilla-viz__hover');
        g.setAttribute('pointer-events', 'none');

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', hx.toFixed(1));
        line.setAttribute('x2', hx.toFixed(1));
        line.setAttribute('y1', String(padT));
        line.setAttribute('y2', String(chartH - padB));
        line.setAttribute('stroke', 'rgba(255,255,255,0.22)');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);

        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
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
        var valEl = document.createElement('div');
        valEl.className = 'splunk-one-fixed-loaded-line-vanilla-viz__tooltipValue';
        valEl.textContent = valueLabel;
        tooltip.appendChild(valEl);
        if (timeLabel) {
            var timeEl = document.createElement('div');
            timeEl.className = 'splunk-one-fixed-loaded-line-vanilla-viz__tooltipTime';
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
        if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
        }
    }

    log('module loaded');

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        formatData: function (rawData) {
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                return { values: [], times: [] };
            }
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Fixed loaded line (vanilla) requires at least one all-numeric column (excluding _time).'
                );
            }
            var tIdx = findTimeColumnIndex(rawData);
            return reorderValuesAndTimesByTime(rawData, idx, tIdx);
        },

        updateView: function (data, config) {
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

            var values = (data && data.values) || [];
            var times = (data && data.times) || [];
            var goodColor = sanitizeHexColor(readConfig(config, 'goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(readConfig(config, 'badColor', '#DFA611'), '#DFA611');
            var textColor = sanitizeHexColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');
            var background = sanitizeHexColor(readConfig(config, 'background', '#0B1F3B'), '#0B1F3B');

            if (values.length < 2) {
                trendColors.applyTrendHostStyle(this.el, background, textColor);
                var empty = document.createElement('div');
                empty.className = 'splunk-one-fixed-loaded-line-vanilla-viz__err';
                empty.textContent =
                    values.length === 0
                        ? 'No numeric results to display.'
                        : 'Need at least 2 numeric points for the line chart.';
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
            var unit = String(readConfig(config, 'unit', '%') || '');
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

            var delta = trendColors.trendDelta(plotValues);
            var trendBg = trendColors.trendBackground(delta, goodColor, badColor);
            trendColors.applyTrendHostStyle(this.el, trendBg, textColor);

            var last = plotValues[plotValues.length - 1];

            var norm = normalizeTimes(times, plotValues.length);
            var anomalyFlags = computeAnomalies(plotValues, anomalyMode, anomalySens);

            var width = Math.max(120, this.el.clientWidth || 400);
            var height = Math.max(80, this.el.clientHeight || 200);
            var subheaderH = subheader ? 28 : 0;
            var majorH = 44;
            var chartH = Math.max(40, height - subheaderH - majorH);
            var padL = 10;
            var padR = 10;
            var padT = 2;
            var padB = 12;

            var root = document.createElement('div');
            root.className = 'splunk-one-fixed-loaded-line-vanilla-viz';
            trendColors.applyTrendSurfaceStyle(root, trendBg);
            root.style.color = textColor;
            root.style.width = '100%';
            root.style.height = '100%';
            root.style.minHeight = '100%';
            root.style.pointerEvents = 'auto';

            if (subheader) {
                var head = document.createElement('div');
                head.className = 'splunk-one-fixed-loaded-line-vanilla-viz__header';
                head.textContent = subheader;
                root.appendChild(head);
            }

            var majorRow = document.createElement('div');
            majorRow.className = 'splunk-one-fixed-loaded-line-vanilla-viz__major';
            var major = document.createElement('div');
            major.className = 'splunk-one-fixed-loaded-line-vanilla-viz__majorVal';
            major.textContent = isFinite(last)
                ? last.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : '—';
            if (unit) {
                var unitSpan = document.createElement('span');
                unitSpan.className = 'splunk-one-fixed-loaded-line-vanilla-viz__unit';
                unitSpan.textContent = unit;
                major.appendChild(unitSpan);
            }

            var trend = document.createElement('div');
            trend.className = 'splunk-one-fixed-loaded-line-vanilla-viz__trend';
            trend.textContent = formatDelta(delta);

            trendColors.applyTrendSurfaceStyle(majorRow, trendBg);

            majorRow.appendChild(major);
            majorRow.appendChild(trend);
            root.appendChild(majorRow);

            var chartWrap = document.createElement('div');
            chartWrap.className = 'splunk-one-fixed-loaded-line-vanilla-viz__chart';
            chartWrap.style.flex = '1 1 auto';
            chartWrap.style.minHeight = chartH + 'px';
            chartWrap.style.width = '100%';
            trendColors.applyTrendSurfaceStyle(chartWrap, trendBg);
            chartWrap.style.pointerEvents = 'auto';

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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

            var chartBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            chartBg.setAttribute('class', 'splunk-one-fixed-loaded-line-vanilla-viz__chartBg');
            chartBg.setAttribute('x', '0');
            chartBg.setAttribute('y', '0');
            chartBg.setAttribute('width', String(width));
            chartBg.setAttribute('height', String(chartH));
            chartBg.setAttribute('fill', trendBg);
            svg.appendChild(chartBg);

            if (useThreshold && isFinite(thMin)) {
                var rectLo = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rectLo.setAttribute('x', String(padL));
                rectLo.setAttribute('y', '0');
                rectLo.setAttribute('width', String(Math.max(0, width - padL - padR)));
                rectLo.setAttribute('height', String(Math.max(0, yFor(thMin))));
                rectLo.setAttribute('fill', 'rgba(0,0,0,0.12)');
                svg.appendChild(rectLo);
            }
            if (useThreshold && isFinite(thMax)) {
                var yHi = yFor(thMax);
                var rectHi = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rectHi.setAttribute('x', String(padL));
                rectHi.setAttribute('y', String(Math.max(0, yHi)));
                rectHi.setAttribute('width', String(Math.max(0, width - padL - padR)));
                rectHi.setAttribute('height', String(Math.max(0, chartH - padB - yHi)));
                rectHi.setAttribute('fill', 'rgba(0,0,0,0.12)');
                svg.appendChild(rectHi);
            }
            if (useThreshold && isFinite(target)) {
                var yT = yFor(target);
                var tLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                tLine.setAttribute('x1', String(padL));
                tLine.setAttribute('y1', String(yT));
                tLine.setAttribute('x2', String(width - padR));
                tLine.setAttribute('y2', String(yT));
                tLine.setAttribute('stroke', 'rgba(255,255,255,0.5)');
                tLine.setAttribute('stroke-width', '1');
                tLine.setAttribute('stroke-dasharray', '4 3');
                svg.appendChild(tLine);
            }

            if (cmpValues) {
                var cmpPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
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
                    cmpPath.setAttribute('stroke-width', '2');
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
                var mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                mainPath.setAttribute('d', mainD);
                mainPath.setAttribute('fill', 'none');
                mainPath.setAttribute('stroke', stroke);
                mainPath.setAttribute('stroke-width', '2');
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
                var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
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
                    var tick = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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

            var tooltip = document.createElement('div');
            tooltip.className = 'splunk-one-fixed-loaded-line-vanilla-viz__tooltip';
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

            if (showHover && n >= 2) {
                /** Capture phase: Splunk overlays often sit above the viz and swallow hit targets. */
                function onDocPointerMove(e) {
                    if (!hitTestChart(e.clientX, e.clientY)) {
                        clearHoverOverlay(svg, tooltip);
                        return;
                    }
                    var rect = svg.getBoundingClientRect();
                    var scaleX = width / rect.width;
                    var x = (e.clientX - rect.left) * scaleX;
                    var idx = clamp(Math.round((x - padL) / xStep), 0, n - 1);
                    var hx = padL + idx * xStep;
                    var hy = yFor(plotValues[idx]);
                    updateHoverOverlay(svg, tooltip, {
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
                    });
                }
                teardownDoc.push(function () {
                    document.removeEventListener('pointermove', onDocPointerMove, true);
                    document.removeEventListener('mousemove', onDocPointerMove, true);
                });
                document.addEventListener('pointermove', onDocPointerMove, true);
                document.addEventListener('mousemove', onDocPointerMove, true);
            }

            // Same stacking issue breaks svg.onclick on dashboards.
            if (drilldown && norm.timeLike) {
                function onDocClick(e) {
                    if (!hitTestChart(e.clientX, e.clientY)) return;
                    var rect = svg.getBoundingClientRect();
                    if (!rect.width) return;
                    var scaleX = width / rect.width;
                    var x = (e.clientX - rect.left) * scaleX;
                    var idx = clamp(Math.round((x - padL) / xStep), 0, n - 1);
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
                    window.location.href = '/app/search/search?' + params.toString();
                }
                teardownDoc.push(function () {
                    document.removeEventListener('click', onDocClick, true);
                });
                document.addEventListener('click', onDocClick, true);
            }

            if (teardownDoc.length) {
                this._docHoverCleanup = function () {
                    var ti;
                    for (ti = 0; ti < teardownDoc.length; ti += 1) teardownDoc[ti]();
                };
            }

            this.el.style.pointerEvents = 'auto';
            enableAncestorPointerEvents(this.el);

            chartWrap.appendChild(svg);
            root.appendChild(chartWrap);
            this.el.appendChild(root);

            var vizHost = this.el;
            function repaintTrend() {
                trendColors.repaintTrendTile(vizHost, root, chartWrap, majorRow, trendBg, textColor);
                chartBg.setAttribute('fill', trendBg);
            }
            repaintTrend();
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(repaintTrend);
            }

            log('updateView done', plotValues.length, 'points');
        },

        reflow: function () {
            if (this._lastData && this._lastConfig) {
                this.updateView(this._lastData, this._lastConfig);
            }
        },

        remove: function () {
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
