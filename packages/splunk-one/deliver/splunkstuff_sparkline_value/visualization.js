/* eslint-disable */
/**
 * Splunk custom visualization: single value + delta + sparkline (extended formatter).
 * Vanilla AMD — SplunkVisualizationBase only.
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_sparkline_value.';

    function fieldsList(rawData) {
        if (rawData && rawData.fields && rawData.fields.length) {
            return rawData.fields;
        }
        if (rawData && rawData.meta && rawData.meta.fields && rawData.meta.fields.length) {
            return rawData.meta.fields;
        }
        return [];
    }

    function cellValue(cell) {
        if (cell == null) {
            return cell;
        }
        if (typeof cell === 'object' && cell.value != null) {
            return cell.value;
        }
        return cell;
    }

    function parseNum(cell) {
        var n = parseFloat(cellValue(cell), 10);
        return isFinite(n) ? n : NaN;
    }

    function fieldName(fields, idx) {
        if (!fields || idx < 0 || idx >= fields.length) {
            return '';
        }
        var f = fields[idx];
        if (typeof f === 'string') {
            return f;
        }
        if (f != null && f.name != null) {
            return String(f.name);
        }
        return '';
    }

    function findTimeColumnIndex(rawData) {
        var fields = fieldsList(rawData);
        var i;
        for (i = 0; i < fields.length; i += 1) {
            if (fieldName(fields, i) === '_time') {
                return i;
            }
        }
        return -1;
    }

    function timeSortKey(rawData, timeIdx, rowIdx) {
        var cell = cellValue(rawData.columns[timeIdx][rowIdx]);
        if (cell == null || cell === '') {
            return 0;
        }
        if (typeof cell === 'number' && isFinite(cell)) {
            return cell;
        }
        var s = String(cell).trim();
        if (/^-?\d+(\.\d+)?$/.test(s)) {
            var n = parseFloat(s, 10);
            return isFinite(n) ? n : 0;
        }
        var ms = Date.parse(s);
        if (isFinite(ms)) {
            return ms / 1000;
        }
        var fb = parseFloat(s, 10);
        return isFinite(fb) ? fb : 0;
    }

    function propertyNamespace(viz) {
        if (viz && typeof viz.getPropertyNamespaceInfo === 'function') {
            try {
                var info = viz.getPropertyNamespaceInfo();
                if (info && info.propertyNamespace) {
                    return info.propertyNamespace;
                }
            } catch (ignoreErr) {
                /* SplunkVisualizationBase may not expose namespace in all contexts */
            }
        }
        return NS;
    }

    function readConfig(config, prop, defaultVal, viz) {
        if (config == null || typeof config !== 'object') {
            return defaultVal;
        }
        var ns = propertyNamespace(viz);
        var candidates = [ns + prop, NS + prop, prop];
        var ci;
        for (ci = 0; ci < candidates.length; ci += 1) {
            var v = config[candidates[ci]];
            if (v !== undefined && v !== null && v !== '') {
                return v;
            }
        }
        var suffix = '.' + prop;
        var keys = Object.keys(config);
        var ki;
        for (ki = 0; ki < keys.length; ki += 1) {
            var key = keys[ki];
            if (key.length >= suffix.length && key.slice(-suffix.length) === suffix) {
                var v2 = config[key];
                if (v2 !== undefined && v2 !== null && v2 !== '') {
                    return v2;
                }
            }
        }
        return defaultVal;
    }

    function truthy(raw) {
        var s = String(raw == null ? '' : raw).trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'on';
    }

    function sanitizeHexColor(raw, fallback) {
        var s = String(raw == null ? '' : raw).trim();
        return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
    }

    function clamp(n, lo, hi) {
        return Math.max(lo, Math.min(hi, n));
    }

    function sparkBounds(minIn, maxIn, values, sparkAuto) {
        if (truthy(sparkAuto)) {
            var lo = Infinity;
            var hi = -Infinity;
            var i;
            for (i = 0; i < values.length; i += 1) {
                var v = Number(values[i]);
                if (!isFinite(v)) {
                    continue;
                }
                if (v < lo) {
                    lo = v;
                }
                if (v > hi) {
                    hi = v;
                }
            }
            if (!isFinite(lo) || !isFinite(hi)) {
                return { min: 0, max: 100 };
            }
            if (lo === hi) {
                hi = lo + 1;
            }
            return { min: lo, max: hi };
        }
        var lo2 = parseFloat(minIn, 10);
        var hi2 = parseFloat(maxIn, 10);
        if (!isFinite(lo2)) {
            lo2 = 0;
        }
        if (!isFinite(hi2)) {
            hi2 = 100;
        }
        if (lo2 > hi2) {
            var t = lo2;
            lo2 = hi2;
            hi2 = t;
        }
        if (hi2 <= lo2) {
            hi2 = lo2 + 1;
        }
        return { min: lo2, max: hi2 };
    }

    function trendDelta(values) {
        if (!values || !values.length) {
            return NaN;
        }
        var len = values.length;
        var last = Number(values[len - 1]);
        var prev = len > 1 ? Number(values[len - 2]) : last;
        if (!isFinite(last) || !isFinite(prev)) {
            return NaN;
        }
        return last - prev;
    }

    function trendBackground(delta, upColor, downColor, invertTrend) {
        var downIsGood = truthy(invertTrend);
        if (!isFinite(delta)) {
            return upColor;
        }
        if (delta < 0) {
            return downIsGood ? upColor : downColor;
        }
        return downIsGood ? downColor : upColor;
    }

    function applyTrendHostStyle(el, bg, textColor) {
        if (!el) {
            return;
        }
        el.style.position = 'relative';
        el.style.backgroundColor = bg;
        el.style.setProperty('background', bg, 'important');
        el.style.color = textColor;
        el.style.overflow = 'hidden';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.minHeight = '100%';
        el.style.boxSizing = 'border-box';
        el.style.pointerEvents = 'auto';
    }

    function pickNumericColumnIndex(rawData) {
        var fields = fieldsList(rawData);
        if (!rawData || !rawData.columns || !fields.length) {
            return -1;
        }
        var best = -1;
        var c;
        for (c = 0; c < rawData.columns.length; c += 1) {
            if (fieldName(fields, c) === '_time') {
                continue;
            }
            var col = rawData.columns[c] || [];
            var r;
            for (r = 0; r < col.length; r += 1) {
                if (isFinite(parseNum(col[r]))) {
                    best = c;
                    break;
                }
            }
        }
        return best;
    }

    function reorderSeriesByTime(rawData, valueIdx) {
        var col = rawData.columns[valueIdx] || [];
        if (!col.length) {
            return { values: [], times: [] };
        }
        var n = col.length;
        var tIdx = findTimeColumnIndex(rawData);
        var values = [];
        var times = [];
        var r;
        if (tIdx < 0 || !rawData.columns[tIdx] || rawData.columns[tIdx].length !== n) {
            for (r = 0; r < n; r += 1) {
                var v0 = parseNum(col[r]);
                if (isFinite(v0)) {
                    values.push(v0);
                    times.push(null);
                }
            }
            return { values: values, times: times };
        }
        var timeCol = rawData.columns[tIdx];
        var pairs = [];
        for (r = 0; r < n; r += 1) {
            var v = parseNum(col[r]);
            if (!isFinite(v)) {
                continue;
            }
            pairs.push({
                t: timeSortKey(rawData, tIdx, r),
                v: v,
                timeRaw: cellValue(timeCol[r]),
                i: r,
            });
        }
        pairs.sort(function (a, b) {
            if (a.t !== b.t) {
                return a.t - b.t;
            }
            return a.i - b.i;
        });
        for (r = 0; r < pairs.length; r += 1) {
            values.push(pairs[r].v);
            times.push(pairs[r].timeRaw);
        }
        return { values: values, times: times };
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
                if (t > 31536000000) {
                    ms.push(t);
                } else if (t > 31536000) {
                    ms.push(t * 1000);
                } else {
                    ms.push(null);
                }
                if (ms[i] != null) {
                    ok += 1;
                }
                continue;
            }
            ms.push(null);
        }
        return { ms: ms, timeLike: ok >= Math.max(2, Math.floor(len * 0.5)) };
    }

    function formatHoverTime(times, norm, idx) {
        if (norm.timeLike && norm.ms[idx] != null) {
            return new Date(norm.ms[idx]).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        if (times[idx] == null) {
            return '';
        }
        return String(times[idx]);
    }

    function parseSparkPointLabels(raw) {
        var map = {};
        var s = String(raw == null ? '' : raw).trim();
        if (!s) {
            return map;
        }
        var parts = s.split(/[,;]+/);
        var i;
        for (i = 0; i < parts.length; i += 1) {
            var p = parts[i].trim();
            if (!p) {
                continue;
            }
            var colon = p.indexOf(':');
            if (colon < 0) {
                continue;
            }
            var idx = parseInt(p.slice(0, colon), 10);
            var label = p.slice(colon + 1).trim();
            if (isFinite(idx) && idx >= 0 && label) {
                map[idx] = label;
            }
        }
        return map;
    }

    function sparkPath(values, w, h, padL, padR, padT, padB, vmin, vmax) {
        var iw = Math.max(1, w - padL - padR);
        var ih = Math.max(1, h - padT - padB);
        var len = values.length;
        if (len < 2) {
            return '';
        }
        var xStep = iw / (len - 1);
        var parts = [];
        var i;
        for (i = 0; i < len; i += 1) {
            var val = Number(values[i]);
            var ratio = (val - vmin) / (vmax - vmin);
            ratio = Math.max(0, Math.min(1, ratio));
            var x = padL + i * xStep;
            var y = padT + ih - ratio * ih;
            parts.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
        }
        return parts.join(' ');
    }

    function sparkXY(values, idx, w, h, padL, padR, padT, padB, vmin, vmax) {
        var len = values.length;
        var iw = Math.max(1, w - padL - padR);
        var ih = Math.max(1, h - padT - padB);
        var xStep = len > 1 ? iw / (len - 1) : 0;
        var val = Number(values[idx]);
        var ratio = (val - vmin) / (vmax - vmin);
        ratio = Math.max(0, Math.min(1, ratio));
        return {
            x: padL + idx * xStep,
            y: padT + ih - ratio * ih,
            xStep: xStep,
        };
    }

    function sparkIndexFromPointer(clientX, sparkWrap, padL, padR, w, n) {
        var rect = sparkWrap.getBoundingClientRect();
        if (rect.width <= 0 || n < 2) {
            return null;
        }
        var relX = (clientX - rect.left) / rect.width;
        var xSvg = relX * w;
        var iw = w - padL - padR;
        var idx = Math.round((xSvg - padL) / (iw / (n - 1)));
        return clamp(idx, 0, n - 1);
    }

    function yFromValue(val, h, padT, padB, vmin, vmax) {
        var ih = Math.max(1, h - padT - padB);
        var ratio = (val - vmin) / (vmax - vmin);
        ratio = Math.max(0, Math.min(1, ratio));
        return padT + ih - ratio * ih;
    }

    function formatMajor(value, precision, unit) {
        if (!isFinite(value)) {
            return '—';
        }
        var p = parseInt(precision, 10);
        if (!isFinite(p) || p < 0) {
            p = 2;
        }
        return value.toLocaleString(undefined, { maximumFractionDigits: p, minimumFractionDigits: 0 }) + unit;
    }

    function formatDelta(delta, last, mode, precision) {
        if (!isFinite(delta)) {
            return '—';
        }
        var p = parseInt(precision, 10);
        if (!isFinite(p) || p < 0) {
            p = 2;
        }
        var arrow = delta >= 0 ? '\u25b2 ' : '\u25bc ';
        if (String(mode).toLowerCase() === 'percent' && isFinite(last) && last !== 0) {
            var pct = (delta / Math.abs(last)) * 100;
            return arrow + pct.toLocaleString(undefined, { maximumFractionDigits: p }) + '%';
        }
        return arrow + delta.toLocaleString(undefined, { maximumFractionDigits: p });
    }

    function formatHoverValue(v, precision, unit, prefix) {
        if (!isFinite(v)) {
            return '—';
        }
        var p = parseInt(precision, 10);
        if (!isFinite(p) || p < 0) {
            p = 2;
        }
        var core =
            v.toLocaleString(undefined, { maximumFractionDigits: p, minimumFractionDigits: 0 }) +
            String(unit || '');
        var pre = String(prefix || '').trim();
        return pre ? pre + ' ' + core : core;
    }

    function clearSparkHover(svg, tooltip, hoverAnnEl) {
        if (svg) {
            var old = svg.querySelector('.splunkstuff-sparkline-value-viz__hover');
            if (old && old.parentNode) {
                old.parentNode.removeChild(old);
            }
        }
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        if (hoverAnnEl) {
            hoverAnnEl.style.display = 'none';
            hoverAnnEl.textContent = '';
        }
    }

    function updateSparkHover(svg, tooltip, ownerDoc, opts) {
        clearSparkHover(svg, tooltip, opts.hoverAnnEl);
        var g = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'splunkstuff-sparkline-value-viz__hover');
        g.setAttribute('pointer-events', 'none');

        var line = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', opts.hx.toFixed(1));
        line.setAttribute('x2', opts.hx.toFixed(1));
        line.setAttribute('y1', String(opts.padT));
        line.setAttribute('y2', String(opts.h - opts.padB));
        line.setAttribute('stroke', 'rgba(255,255,255,0.35)');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);

        var dot = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', opts.hx.toFixed(1));
        dot.setAttribute('cy', opts.hy.toFixed(1));
        dot.setAttribute('r', '4');
        dot.setAttribute('fill', opts.stroke);
        dot.setAttribute('stroke', 'rgba(0,0,0,0.35)');
        dot.setAttribute('stroke-width', '1');
        g.appendChild(dot);
        svg.appendChild(g);

        var valueLabel = formatHoverValue(opts.v, opts.precision, opts.unit, opts.tooltipPrefix);
        var timeLabel = opts.timeLabel || '';
        var pointLabel = opts.pointLabel || '';
        var lines = [];
        if (pointLabel) {
            lines.push(pointLabel);
        }
        lines.push(valueLabel);
        if (timeLabel) {
            lines.push(timeLabel);
        }

        tooltip.textContent = '';
        var i;
        for (i = 0; i < lines.length; i += 1) {
            var row = ownerDoc.createElement('div');
            row.className =
                i === 0 && pointLabel
                    ? 'splunkstuff-sparkline-value-viz__tooltipPoint'
                    : i === (pointLabel ? 1 : 0)
                      ? 'splunkstuff-sparkline-value-viz__tooltipValue'
                      : 'splunkstuff-sparkline-value-viz__tooltipTime';
            row.textContent = lines[i];
            tooltip.appendChild(row);
        }

        tooltip.style.display = 'block';
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '2147483646';
        tooltip.style.left = opts.clientX + 'px';
        tooltip.style.top = opts.clientY + 'px';
        tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
        var bodyEl = ownerDoc.body || ownerDoc.documentElement;
        if (bodyEl && tooltip.parentNode !== bodyEl) {
            bodyEl.appendChild(tooltip);
        }

        if (opts.showHoverAnnotation && opts.hoverAnnEl) {
            opts.hoverAnnEl.textContent = lines.join(' \u2014 ');
            opts.hoverAnnEl.style.display = 'block';
        }
    }

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        formatData: function (rawData) {
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                return { values: [], times: [], fieldName: '' };
            }
            var fields = fieldsList(rawData);
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Sparkline value needs a numeric column (e.g. value) beside _time.'
                );
            }
            var series = reorderSeriesByTime(rawData, idx);
            if (!series.values.length) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Sparkline value found a value column but no parseable numbers in results.'
                );
            }
            return {
                values: series.values,
                times: series.times,
                fieldName: fieldName(fields, idx),
            };
        },

        updateView: function (data, config) {
            var viz = this;
            function opt(prop, defaultVal) {
                return readConfig(config, prop, defaultVal, viz);
            }
            /** When Splunk has no key yet (cached panel), use formatter demo defaults. */
            function optOr(prop, builtInDefault) {
                var raw = readConfig(config, prop, null, viz);
                if (raw === null || raw === undefined) {
                    return builtInDefault;
                }
                if (typeof raw === 'string' && raw.trim() === '') {
                    return builtInDefault;
                }
                return raw;
            }

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
            var emptyText = String(opt('emptyText', 'No numeric results to display.') || '');

            if (values.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'splunkstuff-sparkline-value-viz__err';
                empty.textContent = emptyText;
                this.el.appendChild(empty);
                return;
            }

            var sparkAuto = opt('sparkAuto', 'false');
            var sparkMinRaw = opt('sparkMin', '');
            var sparkMaxRaw = opt('sparkMax', '');
            var scale = sparkBounds(sparkMinRaw, sparkMaxRaw, values, sparkAuto);
            var goodColor = sanitizeHexColor(opt('goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(opt('badColor', '#DFA611'), '#DFA611');
            var invertTrend = opt('invertTrend', 'false');
            var textColor = sanitizeHexColor(opt('textColor', '#FFFFFF'), '#FFFFFF');
            var sparkStroke = sanitizeHexColor(opt('sparkStroke', '#FFFFFF'), '#FFFFFF');
            var sparkStrokeWidth = parseFloat(opt('sparkStrokeWidth', '2'), 10);
            if (!isFinite(sparkStrokeWidth) || sparkStrokeWidth <= 0) {
                sparkStrokeWidth = 2;
            }
            var unit = String(opt('unit', '') || '');
            var subheader = String(opt('subheader', '') || '');
            var precision = opt('precision', '2');
            var showDelta = truthy(opt('showDelta', 'true'));
            var deltaMode = String(opt('deltaMode', 'absolute') || 'absolute');
            var showSparkline = truthy(opt('showSparkline', 'true'));
            var showTarget = truthy(opt('showTarget', 'false'));
            var target = parseFloat(opt('target', '50'), 10);
            var showThresholdBand = truthy(opt('showThresholdBand', 'false'));
            var thresholdMin = parseFloat(opt('thresholdMin', '20'), 10);
            var thresholdMax = parseFloat(opt('thresholdMax', '80'), 10);
            var showHover = truthy(opt('showHover', 'true'));
            var showHoverAnnotation = truthy(optOr('showHoverAnnotation', 'true'));
            var tooltipPrefix = String(optOr('tooltipPrefix', 'Value') || '');
            var majorLabel = String(optOr('majorLabel', 'Current:') || '').trim();
            var deltaLabel = String(optOr('deltaLabel', 'Change:') || '').trim();
            var badgeText = String(optOr('badgeText', 'Demo KPI') || '').trim();
            var sparkPointLabels = parseSparkPointLabels(
                optOr('sparkPointLabels', '0:Oldest,9:Mid,19:Latest')
            );
            var showPointLabels = truthy(optOr('showPointLabels', 'true'));

            var delta = trendDelta(values);
            var last = values[values.length - 1];
            var bg = trendBackground(delta, goodColor, badColor, invertTrend);
            applyTrendHostStyle(this.el, bg, textColor);

            var ownerDoc = (this.el && this.el.ownerDocument) || document;
            var norm = normalizeTimes(times, values.length);

            var root = document.createElement('div');
            root.className = 'splunkstuff-sparkline-value-viz';
            root.style.position = 'relative';
            root.style.backgroundColor = bg;
            root.style.color = textColor;

            if (badgeText) {
                var badge = document.createElement('div');
                badge.className = 'splunkstuff-sparkline-value-viz__badge';
                badge.textContent = badgeText;
                badge.setAttribute('title', badgeText);
                root.appendChild(badge);
            }

            if (subheader) {
                var head = document.createElement('div');
                head.className = 'splunkstuff-sparkline-value-viz__header';
                head.textContent = subheader;
                root.appendChild(head);
            }

            var body = document.createElement('div');
            body.className = 'splunkstuff-sparkline-value-viz__body';

            var major = document.createElement('div');
            major.className = 'splunkstuff-sparkline-value-viz__major';
            if (majorLabel) {
                var majorLbl = document.createElement('div');
                majorLbl.className = 'splunkstuff-sparkline-value-viz__indicatorLabel';
                majorLbl.textContent = majorLabel;
                major.appendChild(majorLbl);
            }
            var majorVal = document.createElement('div');
            majorVal.className = 'splunkstuff-sparkline-value-viz__majorValue';
            majorVal.textContent = formatMajor(last, precision, unit);
            major.appendChild(majorVal);
            body.appendChild(major);

            if (showDelta) {
                var trend = document.createElement('div');
                trend.className = 'splunkstuff-sparkline-value-viz__trend';
                if (deltaLabel) {
                    var deltaLbl = document.createElement('div');
                    deltaLbl.className = 'splunkstuff-sparkline-value-viz__indicatorLabel';
                    deltaLbl.textContent = deltaLabel;
                    trend.appendChild(deltaLbl);
                }
                var deltaVal = document.createElement('div');
                deltaVal.className = 'splunkstuff-sparkline-value-viz__trendValue';
                deltaVal.textContent = formatDelta(delta, last, deltaMode, precision);
                trend.appendChild(deltaVal);
                body.appendChild(trend);
            }

            var hoverAnnEl = null;
            if (showHoverAnnotation) {
                hoverAnnEl = ownerDoc.createElement('div');
                hoverAnnEl.className = 'splunkstuff-sparkline-value-viz__hoverAnn';
                hoverAnnEl.setAttribute('aria-hidden', 'true');
                body.appendChild(hoverAnnEl);
            }

            var padL = 4;
            var padR = 4;
            var padT = 2;
            var padB = 2;
            var w = 360;
            var h = 32;
            var n = values.length;

            if (showSparkline) {
                var sparkWrap = document.createElement('div');
                sparkWrap.className = 'splunkstuff-sparkline-value-viz__spark';
                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('preserveAspectRatio', 'none');
                svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

                if (showThresholdBand && isFinite(thresholdMin) && isFinite(thresholdMax)) {
                    var y1 = yFromValue(thresholdMax, h, padT, padB, scale.min, scale.max);
                    var y2 = yFromValue(thresholdMin, h, padT, padB, scale.min, scale.max);
                    var band = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    band.setAttribute('x', String(padL));
                    band.setAttribute('y', String(Math.min(y1, y2)));
                    band.setAttribute('width', String(w - padL - padR));
                    band.setAttribute('height', String(Math.abs(y2 - y1)));
                    band.setAttribute('fill', 'rgba(0,0,0,0.18)');
                    svg.appendChild(band);
                }

                if (showTarget && isFinite(target)) {
                    var ty = yFromValue(target, h, padT, padB, scale.min, scale.max);
                    var tLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    tLine.setAttribute('x1', String(padL));
                    tLine.setAttribute('x2', String(w - padR));
                    tLine.setAttribute('y1', String(ty));
                    tLine.setAttribute('y2', String(ty));
                    tLine.setAttribute('stroke', 'rgba(255,255,255,0.55)');
                    tLine.setAttribute('stroke-width', '1');
                    tLine.setAttribute('stroke-dasharray', '4 3');
                    svg.appendChild(tLine);
                }

                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                var d = sparkPath(values, w, h, padL, padR, padT, padB, scale.min, scale.max);
                if (d) {
                    path.setAttribute('d', d);
                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke', sparkStroke);
                    path.setAttribute('stroke-width', String(sparkStrokeWidth));
                    path.setAttribute('vector-effect', 'non-scaling-stroke');
                    svg.appendChild(path);
                }

                if (showPointLabels && n >= 1) {
                    var pi;
                    for (pi = 0; pi < n; pi += 1) {
                        if (!Object.prototype.hasOwnProperty.call(sparkPointLabels, pi)) {
                            continue;
                        }
                        var xy = sparkXY(values, pi, w, h, padL, padR, padT, padB, scale.min, scale.max);
                        var mark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        mark.setAttribute('cx', xy.x.toFixed(1));
                        mark.setAttribute('cy', xy.y.toFixed(1));
                        mark.setAttribute('r', '3');
                        mark.setAttribute('fill', sparkStroke);
                        svg.appendChild(mark);
                        var lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        lbl.setAttribute('x', xy.x.toFixed(1));
                        lbl.setAttribute('y', String(Math.max(8, xy.y - 6)));
                        lbl.setAttribute('fill', 'rgba(255,255,255,0.9)');
                        lbl.setAttribute('font-size', '10');
                        lbl.setAttribute('text-anchor', 'middle');
                        lbl.textContent = sparkPointLabels[pi];
                        svg.appendChild(lbl);
                    }
                }

                sparkWrap.appendChild(svg);
                body.appendChild(sparkWrap);

                var tooltip = ownerDoc.createElement('div');
                tooltip.className = 'splunkstuff-sparkline-value-viz__tooltip';
                tooltip.setAttribute('role', 'status');
                tooltip.style.display = 'none';
                this._hoverTooltipEl = tooltip;

                if (showHover && n >= 2) {
                    function hitTestSpark(px, py) {
                        var rect = sparkWrap.getBoundingClientRect();
                        return (
                            rect.width > 0 &&
                            rect.height > 0 &&
                            px >= rect.left &&
                            px <= rect.right &&
                            py >= rect.top &&
                            py <= rect.bottom
                        );
                    }

                    var teardown = [];
                    function onDocPointerMove(e) {
                        if (!hitTestSpark(e.clientX, e.clientY)) {
                            clearSparkHover(svg, tooltip, hoverAnnEl);
                            return;
                        }
                        var idx = sparkIndexFromPointer(e.clientX, sparkWrap, padL, padR, w, n);
                        if (idx == null) {
                            clearSparkHover(svg, tooltip, hoverAnnEl);
                            return;
                        }
                        var xy = sparkXY(values, idx, w, h, padL, padR, padT, padB, scale.min, scale.max);
                        updateSparkHover(svg, tooltip, ownerDoc, {
                            hx: xy.x,
                            hy: xy.y,
                            h: h,
                            padT: padT,
                            padB: padB,
                            stroke: sparkStroke,
                            v: values[idx],
                            precision: precision,
                            unit: unit,
                            tooltipPrefix: tooltipPrefix,
                            timeLabel: formatHoverTime(times, norm, idx),
                            pointLabel: sparkPointLabels[idx] || '',
                            clientX: e.clientX,
                            clientY: e.clientY,
                            showHoverAnnotation: showHoverAnnotation,
                            hoverAnnEl: hoverAnnEl,
                        });
                    }
                    teardown.push(function () {
                        ownerDoc.removeEventListener('pointermove', onDocPointerMove, true);
                        ownerDoc.removeEventListener('mousemove', onDocPointerMove, true);
                        if (ownerDoc.defaultView) {
                            ownerDoc.defaultView.removeEventListener('mousemove', onDocPointerMove, true);
                        }
                    });
                    ownerDoc.addEventListener('pointermove', onDocPointerMove, true);
                    ownerDoc.addEventListener('mousemove', onDocPointerMove, true);
                    if (ownerDoc.defaultView) {
                        ownerDoc.defaultView.addEventListener('mousemove', onDocPointerMove, true);
                    }
                    this._docHoverCleanup = function () {
                        var ti;
                        for (ti = 0; ti < teardown.length; ti += 1) {
                            teardown[ti]();
                        }
                        clearSparkHover(svg, tooltip, hoverAnnEl);
                    };
                }
            }

            root.appendChild(body);
            this.el.appendChild(root);
        },

        reflow: function () {},

        remove: function () {
            if (typeof this._docHoverCleanup === 'function') {
                this._docHoverCleanup();
                this._docHoverCleanup = null;
            }
            if (this._hoverTooltipEl && this._hoverTooltipEl.parentNode) {
                this._hoverTooltipEl.parentNode.removeChild(this._hoverTooltipEl);
                this._hoverTooltipEl = null;
            }
            this.el.innerHTML = '';
        },
    });
});
