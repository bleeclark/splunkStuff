/* eslint-disable */
/**
 * =============================================================================
 * SplunkStuff — KPI loaded line VERBOSE (vanilla AMD)
 * =============================================================================
 *
 * Fork of splunkstuff_kpi_line with identical runtime behavior, expanded inline
 * documentation, and opt-in structured console logging.
 *
 * --- Data contract (formatData / updateView) ---
 * Splunk delivers COLUMN_MAJOR search results. We pick the *last* column that is
 * all-numeric excluding _time, then reorder rows by _time when that column exists.
 * updateView receives { values: number[], times: parallel[] }.
 *
 * --- Config namespace ---
 * Keys in Splunk config are NS + propName, where NS must match formatter names:
 *   display.visualizations.custom.<APP_ID>.splunkstuff_kpi_line_verbose.<prop>
 * APP_ID here is so_BUI_pickulationts (see NS constant below).
 *
 * --- Formatter UI pitfall ---
 * Do not use (parentheses) in splunk-formatter-section section-label: Splunk/jQuery
 * builds IDs from labels; parentheses break selectors. See formatter.html header.
 *
 * --- Hover / hit-testing ---
 * Pointer listeners run on document CAPTURE because Splunk dashboard chrome sits
 * above the viz and swallows bubble-phase hits. Index mapping uses SVG xMidYMid
 * meet letterboxing math inlined below (same behavior as the splunkstuffVizHoverMath AMD module).
 *
 * --- Inlined helpers (single-file deliver) ---
 * Trend surfaces + repaint: same contract as splunkstuffTrendColors AMD module.
 * Hover mapping: same contract as splunkstuffVizHoverMath AMD module.
 * With SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG, argument-shape warnings and API verification log once at load.
 *
 * --- Formatter options (prop key → purpose, default) ---
 *   min, max — fixed Y scale (0, 100)
 *   background — empty tile / chart strip when colorPlacement top (#0B1F3B)
 *   goodColor, badColor — trend up vs down (#01417F / #DFA611)
 *   textColor, stroke — label and line (#FFFFFF)
 *   strokeWidth — line width px (2)
 *   showMajor, centerMajor, colorPlacement — headline row layout (true, true, full|top)
 *   subheader — optional 28px title row ()
 *   unit — suffix after numbers in major + hover (); empty = digits only
 *   unitScale — em size of unit vs major (0.6)
 *   smoothing, smaWindow, maxPoints — none|sma, window, downsample cap
 *   comparison — synthetic shifted series (false)
 *   threshold, thresholdMin, thresholdMax, target — band + line (off)
 *   thresholdShade, targetStroke — rgba/hex for band fill and target line
 *   anomalies, anomalySensitivity — none|deltaZscore|pctChange, 1–10
 *   showHover, showHoverAnnotation — tooltip + in-chart caption
 *   padLeft..padBottom — SVG paddings; capped when showMajor
 *   showXAxis — time ticks (false)
 *   drilldown, drilldownQuery — click opens Search (false)
 *   emptyText — custom message when &lt; 2 points ()
 *
 * --- Debug ---
 *   window.SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG = true  →  log() + effectiveConfig snapshot
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var VIZ_ID = 'splunkstuff_kpi_line_verbose';
    var BUILD_TAG = '2026-05-15-smaWindow-early-read';
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_line_verbose.';

    function debugEnabled() {
        try {
            return typeof window !== 'undefined' && window.SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG === true;
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

    /** One structured row per updateView when SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG is true. */
    function logEffectiveConfig(snapshot) {
        if (!debugEnabled()) return;
        try {
            // eslint-disable-next-line no-console
            console.log('[' + VIZ_ID + '] effectiveConfig', snapshot);
            if (typeof console.table === 'function') {
                var keys = Object.keys(snapshot);
                var rows = [];
                var ki;
                for (ki = 0; ki < keys.length; ki += 1) {
                    var k = keys[ki];
                    rows.push({ option: k, value: snapshot[k] });
                }
                // eslint-disable-next-line no-console
                console.table(rows);
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[' + VIZ_ID + '] logEffectiveConfig failed', err);
        }
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

    /** Shared numeric clamp for SMA path, thresholds, and hover index math (must precede hover helpers). */
    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    /* Inlined: splunkstuffTrendColors (Keith/ITSI-style trend surfaces) */
    var DEFAULT_UP_COLOR = '#01417F';
    var DEFAULT_DOWN_COLOR = '#DFA611';

    function trendDelta(values) {
        if (debugEnabled() && values != null && !Array.isArray(values)) {
            log('trendDelta: expected Array, got', typeof values);
        }
        if (!values || !values.length) {
            return NaN;
        }
        var len = values.length;
        var last = Number(values[len - 1]);
        var prev = len > 1 ? Number(values[len - 2]) : last;
        if (!isFinite(last) || !isFinite(prev)) {
            if (debugEnabled()) {
                log('trendDelta: non-finite last/prev', { last: last, prev: prev });
            }
            return NaN;
        }
        return last - prev;
    }

    function trendBackground(delta, upColor, downColor) {
        var isUp = isFinite(delta) ? delta >= 0 : true;
        return isUp ? upColor : downColor;
    }

    function applyTrendSurfaceStyle(el, bg) {
        if (!el) {
            if (debugEnabled()) {
                log('applyTrendSurfaceStyle: el is null/undefined');
            }
            return;
        }
        el.style.backgroundColor = bg;
        el.style.setProperty('background-color', bg, 'important');
    }

    function applyTrendHostStyle(el, bg, textColor) {
        if (!el) {
            if (debugEnabled()) {
                log('applyTrendHostStyle: el is null/undefined');
            }
            return;
        }
        el.style.position = 'relative';
        applyTrendSurfaceStyle(el, bg);
        el.style.setProperty('background', bg, 'important');
        el.style.color = textColor;
        el.style.overflow = 'hidden';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.minHeight = '100%';
        el.style.boxSizing = 'border-box';
        el.style.pointerEvents = 'auto';
    }

    /** Re-apply trend bg after Splunk formatter may have painted host/parent navy. */
    function repaintTrendTile(hostEl, rootEl, chartEl, majorEl, bg, textColor) {
        applyTrendHostStyle(hostEl, bg, textColor);
        if (rootEl) {
            applyTrendSurfaceStyle(rootEl, bg);
        }
        if (majorEl) {
            applyTrendSurfaceStyle(majorEl, bg);
        }
        if (chartEl) {
            applyTrendSurfaceStyle(chartEl, bg);
        }
        var p = hostEl ? hostEl.parentElement : null;
        var depth = 0;
        while (p && depth < 4) {
            applyTrendSurfaceStyle(p, bg);
            p = p.parentElement;
            depth += 1;
        }
    }

    var trendColors = {
        DEFAULT_UP_COLOR: DEFAULT_UP_COLOR,
        DEFAULT_DOWN_COLOR: DEFAULT_DOWN_COLOR,
        trendDelta: trendDelta,
        trendBackground: trendBackground,
        applyTrendSurfaceStyle: applyTrendSurfaceStyle,
        applyTrendHostStyle: applyTrendHostStyle,
        repaintTrendTile: repaintTrendTile,
    };

    /* Inlined: splunkstuffVizHoverMath (pointer → series index) */
    function viewportToSvgUserXY(clientX, clientY, rectSource, userW, userH) {
        if (debugEnabled()) {
            if (typeof clientX !== 'number' || typeof clientY !== 'number' || !isFinite(clientX) || !isFinite(clientY)) {
                log('viewportToSvgUserXY: client coordinates should be finite numbers', {
                    clientX: clientX,
                    clientY: clientY,
                });
            }
            if (typeof userW !== 'number' || typeof userH !== 'number' || !isFinite(userW) || !isFinite(userH)) {
                log('viewportToSvgUserXY: userW/userH invalid', { userW: userW, userH: userH });
            }
        }
        var rect =
            rectSource && typeof rectSource.getBoundingClientRect === 'function'
                ? rectSource.getBoundingClientRect()
                : rectSource;
        if (
            !rect ||
            !rect.width ||
            !rect.height ||
            !isFinite(userW) ||
            !isFinite(userH) ||
            userW <= 0 ||
            userH <= 0
        ) {
            return null;
        }
        var scale = Math.min(rect.width / userW, rect.height / userH);
        var offX = rect.left + (rect.width - scale * userW) / 2;
        var offY = rect.top + (rect.height - scale * userH) / 2;
        return {
            x: (clientX - offX) / scale,
            y: (clientY - offY) / scale,
        };
    }

    function seriesIndexFromPointerMeet(clientX, clientY, rectSource, userW, userH, padLeft, padRight, pointCount) {
        try {
            if (debugEnabled()) {
                if (typeof pointCount !== 'number' || pointCount !== Math.floor(pointCount)) {
                    log('seriesIndexFromPointerMeet: pointCount should be integer', pointCount);
                }
                if (typeof padLeft !== 'number' || typeof padRight !== 'number') {
                    log('seriesIndexFromPointerMeet: padLeft/padRight should be numbers', padLeft, padRight);
                }
            }
            var mapped = viewportToSvgUserXY(clientX, clientY, rectSource, userW, userH);
            if (!mapped || pointCount < 2) return null;
            var innerW = Math.max(1, userW - padLeft - padRight);
            var xStep = pointCount > 1 ? innerW / (pointCount - 1) : innerW;
            return clamp(Math.round((mapped.x - padLeft) / xStep), 0, pointCount - 1);
        } catch (err) {
            if (debugEnabled()) {
                // eslint-disable-next-line no-console
                console.warn('[' + VIZ_ID + '] seriesIndexFromPointerMeet ReferenceError/TypeError', err);
            }
            return null;
        }
    }

    var hoverMath = {
        clamp: clamp,
        viewportToSvgUserXY: viewportToSvgUserXY,
        seriesIndexFromPointerMeet: seriesIndexFromPointerMeet,
    };

    /** When verbose debug is on at load: ensure inlined APIs exist (catches edit regressions). */
    function verifyInlinedApis() {
        if (!debugEnabled()) return;
        var trendNeed = [
            'trendDelta',
            'trendBackground',
            'applyTrendSurfaceStyle',
            'applyTrendHostStyle',
            'repaintTrendTile',
        ];
        var ti;
        for (ti = 0; ti < trendNeed.length; ti += 1) {
            var tk = trendNeed[ti];
            if (typeof trendColors[tk] !== 'function') {
                // eslint-disable-next-line no-console
                console.warn(
                    '[' + VIZ_ID + '] trendColors.' + tk + ' missing (expected function), got',
                    typeof trendColors[tk]
                );
            }
        }
        var hoverNeed = ['seriesIndexFromPointerMeet', 'viewportToSvgUserXY', 'clamp'];
        var hi;
        for (hi = 0; hi < hoverNeed.length; hi += 1) {
            var hk = hoverNeed[hi];
            if (typeof hoverMath[hk] !== 'function') {
                // eslint-disable-next-line no-console
                console.warn(
                    '[' + VIZ_ID + '] hoverMath.' + hk + ' missing (expected function), got',
                    typeof hoverMath[hk]
                );
            }
        }
        log('verifyInlinedApis: trend + hover surfaces OK');
    }
    verifyInlinedApis();

    function repaintTrendTileCompat(hostEl, rootEl, chartEl, majorEl, bg, textColor) {
        /* Call the hoisted function directly — avoids relying on trendColors.repaintTrendTile if the
         * object were ever reassigned or partially merged (stale AMD cache, bad hand edits). */
        repaintTrendTile(hostEl, rootEl, chartEl, majorEl, bg, textColor);
    }

    /** Splunk dashboard wrappers often set pointer-events:none on viz hosts; walk ancestors. */
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
        var old = svg.querySelector('.splunkstuff-kpi-line-viz__hover');
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
        g.setAttribute('class', 'splunkstuff-kpi-line-viz__hover');
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
        valEl.className = 'splunkstuff-kpi-line-viz__tooltipValue';
        valEl.textContent = valueLabel;
        tooltip.appendChild(valEl);
        if (timeLabel) {
            var timeEl = ownerDoc.createElement('div');
            timeEl.className = 'splunkstuff-kpi-line-viz__tooltipTime';
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
        // eslint-disable-next-line no-console
            console.info(
                '[' +
                    VIZ_ID +
                    '] AMD loaded (' +
                    BUILD_TAG +
                    '). Trace: window.SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG = true (refresh). ' +
                    'Logs: verifyInlinedApis + effectiveConfig + console.table per updateView; ReferenceError/TypeError in updateView always warn.'
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
            if (debugEnabled()) {
                if (rawData == null) {
                    log('formatData: rawData is null or undefined');
                } else if (typeof rawData !== 'object') {
                    log('formatData: rawData expected object, got', typeof rawData);
                } else if (!Object.prototype.hasOwnProperty.call(rawData, 'columns')) {
                    log('formatData: rawData has no columns property');
                } else if (!Array.isArray(rawData.columns)) {
                    log('formatData: rawData.columns is not Array, got', typeof rawData.columns);
                }
            }
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                log('formatData: empty columns');
                return { values: [], times: [] };
            }
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                log('formatData: no numeric column — VisualizationError');
                throw new SplunkVisualizationBase.VisualizationError(
                    'KPI loaded line verbose (SplunkStuff) requires at least one all-numeric column (excluding _time).'
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
            /* Read early: entire updateView (incl. debug logging) must never hit an undefined smaWindow. */
            var smaWindow = readInt(config, 'smaWindow', 3);
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
                empty.className = 'splunkstuff-kpi-line-viz__err';
                var defaultEmptyMsg =
                    values.length === 0
                        ? 'No numeric results to display.'
                        : 'Need at least 2 numeric points for the line chart.';
                empty.textContent = emptyText || defaultEmptyMsg;
                this.el.appendChild(empty);
                return;
            }

            // --- Smoothing (none | sma) + optional maxPoints downsampling ---
            var smoothing = String(readConfig(config, 'smoothing', 'none')).toLowerCase();
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
            // Keith/ITSI-style surface: last vs previous point
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
            var effectiveSmaWindow =
                typeof smaWindow !== 'undefined' && isFinite(smaWindow)
                    ? smaWindow
                    : readInt(config, 'smaWindow', 3);

            logEffectiveConfig({
                goodColor: goodColor,
                badColor: badColor,
                textColor: textColor,
                background: background,
                emptyTextLen: emptyText.length,
                smoothing: smoothing,
                smaWindow: effectiveSmaWindow,
                maxPoints: maxPoints,
                plotPointCount: plotValues.length,
                comparison: comparison,
                yMin: scale.min,
                yMax: scale.max,
                stroke: stroke,
                unit: unit || '(none)',
                subheaderLen: subheader.length,
                threshold: useThreshold,
                thresholdMin: thMin,
                thresholdMax: thMax,
                target: target,
                anomalies: anomalyMode,
                anomalySensitivity: anomalySens,
                showXAxis: showXAxis,
                showHover: showHover,
                drilldown: drilldown,
                drilldownQueryLen: drilldownQuery.length,
                showMajor: showMajor,
                centerMajor: centerMajor,
                colorPlacement: colorPlacement,
                strokeWidth: strokeWidth,
                unitScale: unitScale,
                thresholdShade: thresholdShade,
                targetStroke: targetStroke,
                showHoverAnnotation: showHoverAnnotation,
                padLeftRaw: padLeftCfg,
                padRightRaw: padRightCfg,
                padTopRaw: padTopCfg,
                padBottomRaw: padBottomCfg,
                padLeftEff: padL,
                padRightEff: padR,
                padTopEff: padT,
                padBottomEff: padB,
                chartH: chartH,
                hostWidth: width,
                hostHeight: height,
                majorH: majorH,
                subheaderH: subheaderH,
                containerBg: containerBg,
                chartStripBg: chartStripBg,
                trendBg: trendBg,
                delta: delta,
                normTimeLike: norm.timeLike,
            });

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
            root.className = 'splunkstuff-kpi-line-viz';
            trendColors.applyTrendSurfaceStyle(root, containerBg);
            root.style.color = textColor;
            root.style.width = '100%';
            root.style.height = '100%';
            root.style.minHeight = '100%';
            root.style.pointerEvents = 'auto';

            if (subheader) {
                var head = ownerDoc.createElement('div');
                head.className = 'splunkstuff-kpi-line-viz__header';
                head.textContent = subheader;
                root.appendChild(head);
            }

            var majorRow = null;
            if (showMajor) {
                majorRow = ownerDoc.createElement('div');
                majorRow.className = 'splunkstuff-kpi-line-viz__major';
                majorRow.style.justifyContent = centerMajor ? 'center' : 'space-between';
                majorRow.style.textAlign = centerMajor ? 'center' : '';
                var major = ownerDoc.createElement('div');
                major.className = 'splunkstuff-kpi-line-viz__majorVal';
                major.textContent = isFinite(last)
                    ? last.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : '—';
                if (unit) {
                    var unitSpan = ownerDoc.createElement('span');
                    unitSpan.className = 'splunkstuff-kpi-line-viz__unit';
                    unitSpan.style.fontSize = unitScale + 'em';
                    unitSpan.textContent = unit;
                    major.appendChild(unitSpan);
                }

                var trend = ownerDoc.createElement('div');
                trend.className = 'splunkstuff-kpi-line-viz__trend';
                trend.style.marginLeft = centerMajor ? '6px' : '';
                trend.textContent = formatDelta(delta);

                trendColors.applyTrendSurfaceStyle(majorRow, trendBg);

                majorRow.appendChild(major);
                majorRow.appendChild(trend);
                root.appendChild(majorRow);
            }

            var chartWrap = ownerDoc.createElement('div');
            chartWrap.className = 'splunkstuff-kpi-line-viz__chart';
            chartWrap.style.flex = '1 1 auto';
            chartWrap.style.minHeight = chartH + 'px';
            chartWrap.style.width = '100%';
            trendColors.applyTrendSurfaceStyle(chartWrap, chartStripBg);
            chartWrap.style.pointerEvents = 'auto';

            // --- SVG model space; screen size uses meet letterboxing in splunkstuffVizHoverMath ---
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
            chartBg.setAttribute('class', 'splunkstuff-kpi-line-viz__chartBg');
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
                hoverAnnEl.className = 'splunkstuff-kpi-line-viz__hoverAnn';
                hoverAnnEl.setAttribute('aria-hidden', 'true');
            }

            var tooltip = ownerDoc.createElement('div');
            tooltip.className = 'splunkstuff-kpi-line-viz__tooltip';
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
                if (err && (err.name === 'ReferenceError' || err.name === 'TypeError')) {
                    // eslint-disable-next-line no-console
                    console.warn('[' + VIZ_ID + '] updateView ' + err.name + ': ' + err.message);
                }
                if (debugEnabled()) {
                    // eslint-disable-next-line no-console
                    console.error('[' + VIZ_ID + '] updateView exception (full)', err);
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
