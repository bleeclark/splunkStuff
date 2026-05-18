/* eslint-disable */
/**
 * Splunk custom visualization: fixed-domain single value + SVG sparkline.
 * Vanilla AMD — only SplunkVisualizationBase (no sibling ./splunkstuffTrendColors.js).
 *
 * Data: COLUMN_MAJOR results with _time + at least one numeric column (e.g. value).
 * Picks the last non-_time column that has any numeric cells; sorts by _time when present.
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.fixed_single_value.';

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

    function readConfig(config, prop, defaultVal) {
        var v = config && config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return defaultVal;
        }
        return v;
    }

    function sanitizeHexColor(raw, fallback) {
        var s = String(raw == null ? '' : raw).trim();
        return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
    }

    function sparkBounds(minIn, maxIn) {
        var lo = parseFloat(minIn, 10);
        var hi = parseFloat(maxIn, 10);
        if (!isFinite(lo)) {
            lo = 0;
        }
        if (!isFinite(hi)) {
            hi = 100;
        }
        if (lo > hi) {
            var t = lo;
            lo = hi;
            hi = t;
        }
        if (hi <= lo) {
            hi = lo + 1;
        }
        return { min: lo, max: hi };
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

    function trendBackground(delta, upColor, downColor) {
        return isFinite(delta) && delta < 0 ? downColor : upColor;
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

    /** Last non-_time column with at least one parseable numeric cell. */
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

    function reorderNumericColumnByTime(rawData, valueIdx) {
        var col = rawData.columns[valueIdx] || [];
        if (!col.length) {
            return [];
        }
        var n = col.length;
        var tIdx = findTimeColumnIndex(rawData);
        var out = [];
        var r;
        if (tIdx < 0 || !rawData.columns[tIdx] || rawData.columns[tIdx].length !== n) {
            for (r = 0; r < n; r += 1) {
                var v0 = parseNum(col[r]);
                if (isFinite(v0)) {
                    out.push(v0);
                }
            }
            return out;
        }
        var pairs = [];
        for (r = 0; r < n; r += 1) {
            var v = parseNum(col[r]);
            if (!isFinite(v)) {
                continue;
            }
            pairs.push({ t: timeSortKey(rawData, tIdx, r), v: v, i: r });
        }
        pairs.sort(function (a, b) {
            if (a.t !== b.t) {
                return a.t - b.t;
            }
            return a.i - b.i;
        });
        for (r = 0; r < pairs.length; r += 1) {
            out.push(pairs[r].v);
        }
        return out;
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

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        formatData: function (rawData) {
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                return { values: [], fieldName: '' };
            }
            var fields = fieldsList(rawData);
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Fixed single value needs a numeric column (e.g. value) beside _time.'
                );
            }
            var vals = reorderNumericColumnByTime(rawData, idx);
            if (!vals.length) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Fixed single value found a value column but no parseable numbers in results.'
                );
            }
            return {
                values: vals,
                fieldName: fieldName(fields, idx),
            };
        },

        updateView: function (data, config) {
            this.el.innerHTML = '';
            var values = (data && data.values) || [];
            if (values.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'splunk-one-fixed-single-value-viz__err';
                empty.textContent = 'No numeric results to display.';
                this.el.appendChild(empty);
                return;
            }

            var scale = sparkBounds(readConfig(config, 'sparkMin', 0), readConfig(config, 'sparkMax', 100));
            var goodColor = sanitizeHexColor(readConfig(config, 'goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(readConfig(config, 'badColor', '#DFA611'), '#DFA611');
            var textColor = sanitizeHexColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');
            var sparkStroke = sanitizeHexColor(readConfig(config, 'sparkStroke', '#FFFFFF'), '#FFFFFF');
            var unit = String(readConfig(config, 'unit', '%') || '');
            var subheader = String(readConfig(config, 'subheader', '') || '');

            var delta = trendDelta(values);
            var bg = trendBackground(delta, goodColor, badColor);
            applyTrendHostStyle(this.el, bg, textColor);

            var last = values[values.length - 1];

            var root = document.createElement('div');
            root.className = 'splunk-one-fixed-single-value-viz';
            root.style.backgroundColor = bg;
            root.style.color = textColor;

            if (subheader) {
                var head = document.createElement('div');
                head.className = 'splunk-one-fixed-single-value-viz__header';
                head.textContent = subheader;
                root.appendChild(head);
            }

            var body = document.createElement('div');
            body.className = 'splunk-one-fixed-single-value-viz__body';

            var major = document.createElement('div');
            major.className = 'splunk-one-fixed-single-value-viz__major';
            major.textContent = isFinite(last)
                ? last.toLocaleString(undefined, { maximumFractionDigits: 2 }) + unit
                : '—';

            var trend = document.createElement('div');
            trend.className = 'splunk-one-fixed-single-value-viz__trend';
            trend.textContent = isFinite(delta)
                ? (delta >= 0 ? '\u25b2 ' : '\u25bc ') +
                  delta.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : '—';

            body.appendChild(major);
            body.appendChild(trend);

            var sparkWrap = document.createElement('div');
            sparkWrap.className = 'splunk-one-fixed-single-value-viz__spark';
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.setAttribute('viewBox', '0 0 360 28');
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var d = sparkPath(values, 360, 28, 4, 4, 2, 2, scale.min, scale.max);
            if (d) {
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', sparkStroke);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(path);
            }
            sparkWrap.appendChild(svg);
            body.appendChild(sparkWrap);

            root.appendChild(body);
            this.el.appendChild(root);
        },

        reflow: function () {},

        remove: function () {
            this.el.innerHTML = '';
        },
    });
});
