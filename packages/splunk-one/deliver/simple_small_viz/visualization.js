/* eslint-disable */
/**
 * Splunk custom visualization: simple compact latest-value tile.
 * Vanilla AMD module; Splunk Web provides api/SplunkVisualizationBase.
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.simple_small_viz.';

    function fieldName(fields, idx) {
        var f = fields && fields[idx];
        if (typeof f === 'string') {
            return f;
        }
        if (f && f.name != null) {
            return String(f.name);
        }
        return '';
    }

    function readConfig(config, prop, fallback) {
        var value = config && config[NS + prop];
        return value === undefined || value === null || value === '' ? fallback : value;
    }

    function safeColor(raw, fallback) {
        return /^#[0-9A-Fa-f]{6}$/.test(String(raw || '').trim()) ? String(raw).trim() : fallback;
    }

    function formatNumber(value) {
        if (!isFinite(value)) {
            return 'n/a';
        }
        return Math.abs(value) >= 1000 ? value.toLocaleString() : String(Math.round(value * 100) / 100);
    }

    function pickFirstNumericColumn(rawData) {
        if (!rawData || !rawData.columns || !rawData.fields) {
            return -1;
        }
        for (var c = 0; c < rawData.columns.length; c += 1) {
            if (fieldName(rawData.fields, c) === '_time') {
                continue;
            }
            var col = rawData.columns[c] || [];
            for (var r = col.length - 1; r >= 0; r -= 1) {
                if (isFinite(parseFloat(col[r], 10))) {
                    return c;
                }
            }
        }
        return -1;
    }

    function latestNumericValue(col) {
        for (var i = col.length - 1; i >= 0; i -= 1) {
            var n = parseFloat(col[i], 10);
            if (isFinite(n)) {
                return n;
            }
        }
        return NaN;
    }

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 100,
            };
        },

        formatData: function (rawData) {
            var valueIdx = pickFirstNumericColumn(rawData);
            if (valueIdx < 0) {
                return { field: '', value: NaN, rows: 0 };
            }
            var col = rawData.columns[valueIdx] || [];
            return {
                field: fieldName(rawData.fields, valueIdx),
                value: latestNumericValue(col),
                rows: col.length,
            };
        },

        updateView: function (data, config) {
            var label = readConfig(config, 'label', data.field || 'Value');
            var unit = readConfig(config, 'unit', '');
            var bg = safeColor(readConfig(config, 'background', '#1B2A41'), '#1B2A41');
            var text = safeColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');

            this.el.innerHTML = '';
            var root = document.createElement('div');
            root.className = 'splunkstuff-simple-small-viz';
            root.style.background = bg;
            root.style.color = text;

            var title = document.createElement('div');
            title.className = 'splunkstuff-simple-small-viz__label';
            title.textContent = label;

            var value = document.createElement('div');
            value.className = 'splunkstuff-simple-small-viz__value';
            value.textContent = formatNumber(data.value) + unit;

            var meta = document.createElement('div');
            meta.className = 'splunkstuff-simple-small-viz__meta';
            meta.textContent = data.rows ? data.rows + ' rows' : 'No numeric values';

            root.appendChild(title);
            root.appendChild(value);
            root.appendChild(meta);
            this.el.appendChild(root);
        },
    });
});
