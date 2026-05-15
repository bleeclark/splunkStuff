/* eslint-disable */
/**
 * Splunk custom visualization: fixed-domain single value + SVG sparkline.
 * AMD module — Splunk Web provides api/SplunkVisualizationBase at runtime.
 * This is a vanilla implementation (not the React NewSingleValue page component).
 *
 * Data flow (important):
 * - Splunk runs the panel's SPL search and passes results to `formatData` in COLUMN_MAJOR form.
 * - `formatData` picks a numeric column (not `_time`), sorts rows by `_time` ascending, and
 *   returns `{ values: number[] }` so the sparkline reads oldest→newest left→right and the
 *   headline uses the latest `_time` point.
 * - `updateView` renders the DOM + sparkline based on `{ values }` and formatter props in `config`.
 */
define([
    'api/SplunkVisualizationBase',
    '../_shared/splunkstuffTrendColors',
], function (SplunkVisualizationBase, trendColors) {
    /**
     * Formatter property namespace.
     *
     * In `formatter.html` we use `name="{{VIZ_NAMESPACE}}.<prop>"`.
     * Splunk expands `{{VIZ_NAMESPACE}}` to:
     *   "display.visualizations.custom.<app>.<viz_name>"
     *
     * For this app/viz, that becomes:
     *   display.visualizations.custom.so_BUI_pickulationts.fixed_single_value
     */
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.fixed_single_value.';

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
        if (!rawData || !rawData.fields) {
            return -1;
        }
        var i;
        for (i = 0; i < rawData.fields.length; i += 1) {
            if (fieldName(rawData.fields, i) === '_time') {
                return i;
            }
        }
        return -1;
    }

    function timeSortKey(rawData, timeIdx, rowIdx) {
        var cell = rawData.columns[timeIdx][rowIdx];
        if (cell == null || cell === '') {
            return 0;
        }
        if (typeof cell === 'number' && isFinite(cell)) {
            return cell;
        }
        var s = String(cell).trim();
        // Splunk often sends human-readable _time. parseFloat("2026-05-14 ...") === 2026 for
        // every row, which breaks ordering and makes sparklines not match the data.
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

    /**
     * Splunk row order is not guaranteed to match chronological order. Plot and headline
     * use array index, so sort by _time ascending: sparkline left→older, right→newer;
     * last point = headline = latest _time.
     */
    function reorderNumericColumnByTime(rawData, valueIdx) {
        var col = rawData.columns[valueIdx];
        if (!col || col.length === 0) {
            return [];
        }
        var n = col.length;
        var tIdx = findTimeColumnIndex(rawData);
        if (tIdx < 0 || !rawData.columns[tIdx] || rawData.columns[tIdx].length !== n) {
            return col.map(function (v) {
                return parseFloat(v, 10);
            });
        }
        var order = [];
        var r;
        for (r = 0; r < n; r += 1) {
            order.push(r);
        }
        order.sort(function (a, b) {
            var ka = timeSortKey(rawData, tIdx, a);
            var kb = timeSortKey(rawData, tIdx, b);
            if (ka !== kb) {
                return ka - kb;
            }
            return a - b;
        });
        return order.map(function (ri) {
            return parseFloat(rawData.columns[valueIdx][ri], 10);
        });
    }

    /** Read a formatter prop from Splunk config with a default fallback. */
    function readConfig(config, prop, defaultVal) {
        var v = config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return defaultVal;
        }
        return v;
    }

    /** Formatter returns strings; validate hex colors so the viz never renders unreadable. */
    function sanitizeHexColor(raw, fallback) {
        if (typeof raw !== 'string') {
            return fallback;
        }
        var s = raw.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) {
            return s;
        }
        return fallback;
    }

    /** Ensure sparkline scale is sane (max must be > min). */
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

    /**
     * Splunk gives results as columns: `rawData.columns[c] = [row0, row1, ...]`.
     * We select the LAST column that is fully numeric (often a "value" series).
     *
     * If your search returns multiple numeric columns, choose ordering accordingly.
     */
    function pickNumericColumnIndex(rawData) {
        if (!rawData || !rawData.columns || !rawData.fields) {
            return -1;
        }
        var best = -1;
        for (var c = 0; c < rawData.columns.length; c += 1) {
            if (fieldName(rawData.fields, c) === '_time') {
                continue;
            }
            var col = rawData.columns[c];
            if (!col || col.length === 0) {
                continue;
            }
            var ok = true;
            for (var i = 0; i < col.length; i += 1) {
                if (!isFinite(parseFloat(col[i], 10))) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                best = c;
            }
        }
        return best;
    }

    /** Build an SVG path for an evenly-spaced sparkline line. */
    function sparkPath(values, w, h, padL, padR, padT, padB, vmin, vmax) {
        var iw = Math.max(1, w - padL - padR);
        var ih = Math.max(1, h - padT - padB);
        var n = values.length;
        if (n < 2) {
            return '';
        }
        var xStep = iw / (n - 1);
        var parts = [];
        for (var i = 0; i < n; i += 1) {
            var v = Number(values[i]);
            var ratio = (v - vmin) / (vmax - vmin);
            ratio = Math.max(0, Math.min(1, ratio));
            var x = padL + i * xStep;
            var y = padT + ih - ratio * ih;
            parts.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
        }
        return parts.join(' ');
    }

    return SplunkVisualizationBase.extend({
        /**
         * Tell Splunk what data shape we expect.
         * COLUMN_MAJOR_OUTPUT_MODE means:
         *   rawData.columns = [col0Array, col1Array, ...]
         *   rawData.fields  = [{name: ...}, ...]
         */
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        formatData: function (rawData) {
            // IMPORTANT: This is where "panel search results" become the visualization's model.
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                return { values: [] };
            }
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Fixed single value requires at least one all-numeric column in results.'
                );
            }
            var vals = reorderNumericColumnByTime(rawData, idx);
            return {
                values: vals,
                fieldName:
                    rawData.fields[idx] && rawData.fields[idx].name
                        ? String(rawData.fields[idx].name)
                        : '',
            };
        },

        updateView: function (data, config) {
            // Splunk calls updateView whenever data or formatter settings change.
            this.el.innerHTML = '';
            var values = (data && data.values) || [];
            if (values.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'splunk-one-fixed-single-value-viz__err';
                empty.textContent = 'No numeric results to display.';
                this.el.appendChild(empty);
                return;
            }

            // Formatter props (see `formatter.html`). These are configurable in the panel editor UI.
            var scale = sparkBounds(readConfig(config, 'sparkMin', 0), readConfig(config, 'sparkMax', 100));
            var goodColor = sanitizeHexColor(readConfig(config, 'goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(readConfig(config, 'badColor', '#DFA611'), '#DFA611');
            var textColor = sanitizeHexColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');
            var sparkStroke = sanitizeHexColor(readConfig(config, 'sparkStroke', '#FFFFFF'), '#FFFFFF');
            var unit = String(readConfig(config, 'unit', '%') || '');
            var subheader = String(readConfig(config, 'subheader', '') || '');

            var delta = trendColors.trendDelta(values);
            var bg = trendColors.trendBackground(delta, goodColor, badColor);
            trendColors.applyTrendHostStyle(this.el, bg, textColor);

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
            var majorText = isFinite(last)
                ? last.toLocaleString(undefined, { maximumFractionDigits: 2 }) + String(unit || '')
                : '—';
            major.textContent = majorText;

            var trend = document.createElement('div');
            trend.className = 'splunk-one-fixed-single-value-viz__trend';
            var trendStr = isFinite(delta)
                ? (delta >= 0 ? '\u25b2 ' : '\u25bc ') + delta.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : '—';
            trend.textContent = trendStr;

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
