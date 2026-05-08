/* eslint-disable */
/**
 * Splunk custom visualization: Line single value
 *
 * Renders a single-value tile (subheader, major number + optional unit, delta arrow)
 * plus an SVG line in the footer area. Styling aligns with fixed_single_value.
 *
 * Data flow:
 * - Splunk calls getInitialDataParams → COLUMN_MAJOR results (columns + fields).
 * - formatData selects the last fully-numeric column and returns { values, fieldName }.
 * - updateView reads formatter props under NS + reads model values and builds DOM.
 *
 * Formatter keys live in formatter.html as {{VIZ_NAMESPACE}}.&lt;prop&gt;;
 * Splunk resolves that to display.visualizations.custom.&lt;app&gt;.line_single_value.&lt;prop&gt;.
 *
 * Debugging: set DEBUG to true and watch the browser console while the viz runs.
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    /** When true, logs to console (dev only; set false before heavy dashboard use). */
    var DEBUG = false;

    var VIZ_ID = 'line_single_value';

    /**
     * Formatter property namespace — must match visualizations.conf stanza + app id.
     * See formatter.html for each prop name.
     */
    var NS = 'display.visualizations.custom.splunk-one.line_single_value.';

    function log() {
        if (!DEBUG) {
            return;
        }
        var args = ['[' + VIZ_ID + ']'].concat(Array.prototype.slice.call(arguments));
        // eslint-disable-next-line no-console
        console.log.apply(console, args);
    }

    /**
     * Read a single formatter option from Splunk's config object.
     * @param {Object} config - Panel format config (full keys with NS prefix).
     * @param {string} prop - Short property name (e.g. 'min', 'goodColor').
     * @param {*} defaultVal - Used when missing, null, or empty string.
     */
    function readConfig(config, prop, defaultVal) {
        var v = config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return defaultVal;
        }
        return v;
    }

    /**
     * Formatter returns strings; only accept #RRGGBB so colors never break the tile.
     */
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

    /**
     * Y-axis domain for the line (min/max). Ensures hi > lo for division in linePath.
     */
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

    /**
     * Pick the last column where every cell parses to a finite number.
     * Requires rawData.fields (Splunk column-major shape).
     * @returns {number} column index or -1
     */
    function pickNumericColumnIndex(rawData) {
        if (!rawData || !rawData.columns || !rawData.fields) {
            log('pickNumericColumnIndex: missing columns or fields');
            return -1;
        }
        var best = -1;
        for (var c = 0; c < rawData.columns.length; c += 1) {
            var col = rawData.columns[c];
            if (!col || col.length === 0) continue;
            var ok = true;
            for (var i = 0; i < col.length; i += 1) {
                if (!isFinite(parseFloat(col[i], 10))) {
                    ok = false;
                    break;
                }
            }
            if (ok) best = c;
        }
        log('pickNumericColumnIndex: chosen index', best);
        return best;
    }

    /**
     * Build SVG path for a polyline scaled into [vmin, vmax] vertically.
     * @returns {string} SVG d attribute or '' if fewer than 2 points.
     */
    function linePath(values, w, h, padL, padR, padT, padB, vmin, vmax) {
        var iw = Math.max(1, w - padL - padR);
        var ih = Math.max(1, h - padT - padB);
        var n = values.length;
        if (n < 2) return '';
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

    log('module loaded');

    return SplunkVisualizationBase.extend({
        /**
         * Request search results as column arrays (preferred for numeric column pick).
         */
        getInitialDataParams: function () {
            log('getInitialDataParams: COLUMN_MAJOR count=5000');
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        /**
         * Turn raw Splunk rows into our viz model { values: number[], fieldName: string }.
         * Throws VisualizationError if no all-numeric column exists.
         */
        formatData: function (rawData) {
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                log('formatData: no columns — returning empty values');
                return { values: [] };
            }
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                log('formatData: throwing — no numeric column');
                throw new SplunkVisualizationBase.VisualizationError(
                    'Line single value requires at least one all-numeric column in results.'
                );
            }
            var vals = rawData.columns[idx].map(function (v) {
                return parseFloat(v, 10);
            });
            var fieldName =
                rawData.fields[idx] && rawData.fields[idx].name
                    ? String(rawData.fields[idx].name)
                    : '';
            log('formatData: points=', vals.length, 'field=', fieldName);
            return {
                values: vals,
                fieldName: fieldName,
            };
        },

        /**
         * Full DOM render from model + formatter config.
         */
        updateView: function (data, config) {
            log('updateView: start');
            this.el.innerHTML = '';
            var values = (data && data.values) || [];
            if (values.length === 0) {
                log('updateView: empty values — showing error div');
                var empty = document.createElement('div');
                empty.className = 'splunk-one-line-single-value-viz__err';
                empty.textContent = 'No numeric results to display.';
                this.el.appendChild(empty);
                return;
            }

            var scale = bounds(readConfig(config, 'min', 0), readConfig(config, 'max', 100));
            var goodColor = sanitizeHexColor(readConfig(config, 'goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(readConfig(config, 'badColor', '#DFA611'), '#DFA611');
            var textColor = sanitizeHexColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');
            var stroke = sanitizeHexColor(readConfig(config, 'stroke', '#FFFFFF'), '#FFFFFF');
            var unit = String(readConfig(config, 'unit', '%') || '');
            var subheader = String(readConfig(config, 'subheader', '') || '');

            log('updateView: scale', scale, 'subheader len', subheader.length, 'points', values.length);

            var last = values[values.length - 1];
            var prev = values.length > 1 ? values[values.length - 2] : last;
            var delta = last - prev;
            var isGood = delta >= 0;
            var bg = isGood ? goodColor : badColor;

            var root = document.createElement('div');
            root.className = 'splunk-one-line-single-value-viz';
            root.style.backgroundColor = bg;
            root.style.color = textColor;

            if (subheader) {
                var head = document.createElement('div');
                head.className = 'splunk-one-line-single-value-viz__header';
                head.textContent = subheader;
                root.appendChild(head);
            }

            var body = document.createElement('div');
            body.className = 'splunk-one-line-single-value-viz__body';

            var major = document.createElement('div');
            major.className = 'splunk-one-line-single-value-viz__major';
            var majorText = isFinite(last)
                ? last.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : '—';
            major.textContent = majorText;
            if (unit) {
                var unitSpan = document.createElement('span');
                unitSpan.className = 'splunk-one-line-single-value-viz__unit';
                unitSpan.textContent = unit;
                major.appendChild(unitSpan);
            }

            var trend = document.createElement('div');
            trend.className = 'splunk-one-line-single-value-viz__trend';
            var trendStr = isFinite(delta)
                ? (delta >= 0 ? '\u25b2 ' : '\u25bc ') +
                  delta.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : '—';
            trend.textContent = trendStr;

            body.appendChild(major);
            body.appendChild(trend);

            var sparkWrap = document.createElement('div');
            sparkWrap.className = 'splunk-one-line-single-value-viz__spark';
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.setAttribute('viewBox', '0 0 360 28');
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var d = linePath(values, 360, 28, 4, 4, 2, 2, scale.min, scale.max);
            if (d) {
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', stroke);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(path);
                log('updateView: line path length', d.length);
            } else {
                log('updateView: no line path (need n>=2 points)');
            }
            sparkWrap.appendChild(svg);
            body.appendChild(sparkWrap);

            root.appendChild(body);
            this.el.appendChild(root);
            log('updateView: done');
        },

        reflow: function () {},

        remove: function () {
            log('remove: clearing container');
            this.el.innerHTML = '';
        },
    });
});
