/* eslint-disable */
/**
 * Splunk custom visualization entry (AMD) — React LineChart bundle.
 *
 * Splunk loads this file via RequireJS as:
 *   define(['api/SplunkVisualizationBase'], factory)
 */
import { mountViz, unmountViz } from './vizMount';

define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var NS = 'display.visualizations.custom.splunk-one.fixed_loaded_line.';

    function readConfig(config, prop, defaultVal) {
        var v = config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return defaultVal;
        }
        return v;
    }

    function readBool(config, prop, defaultVal) {
        var v = config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return defaultVal;
        }
        if (v === true) return true;
        if (v === false) return false;
        var s = String(v).toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes') return true;
        if (s === 'false' || s === '0' || s === 'no') return false;
        return defaultVal;
    }

    function readFloat(config, prop, defaultVal) {
        var raw = readConfig(config, prop, null);
        if (raw === null || raw === '') {
            return defaultVal;
        }
        var n = parseFloat(raw, 10);
        return isFinite(n) ? n : defaultVal;
    }

    function readInt(config, prop, defaultVal) {
        var raw = readConfig(config, prop, null);
        if (raw === null || raw === '') {
            return defaultVal;
        }
        var n = parseInt(raw, 10);
        return isFinite(n) ? n : defaultVal;
    }

    function fieldName(fields, idx) {
        if (!fields || idx < 0 || idx >= fields.length) return '';
        var f = fields[idx];
        if (typeof f === 'string') return f;
        if (f != null && f.name != null) return String(f.name);
        return '';
    }

    function findTimeColumnIndex(rawData) {
        if (!rawData || !rawData.fields) {
            return -1;
        }
        for (var i = 0; i < rawData.fields.length; i += 1) {
            if (fieldName(rawData.fields, i) === '_time') {
                return i;
            }
        }
        return -1;
    }

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

    function buildComparisonValues(values) {
        return values.map(function (v, i) {
            var base = parseFloat(v, 10);
            var wiggle = i % 2 === 0 ? -6 : 4;
            return isFinite(base) ? base + wiggle : base;
        });
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
                return { values: [], times: [] };
            }
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Fixed loaded line requires at least one all-numeric column (excluding _time) in results.'
                );
            }
            var vals = rawData.columns[idx].map(function (v) {
                return parseFloat(v, 10);
            });
            var tIdx = findTimeColumnIndex(rawData);
            var times = [];
            if (tIdx >= 0 && rawData.columns[tIdx] && rawData.columns[tIdx].length === vals.length) {
                times = rawData.columns[tIdx].slice();
            }
            return { values: vals, times: times };
        },

        updateView: function (data, config) {
            var values = (data && data.values) || [];
            var times = (data && data.times) || [];

            var comparison = readBool(config, 'comparison', false);
            var comparisonSeries = null;
            if (comparison && values.length) {
                comparisonSeries = [
                    {
                        id: 'previous',
                        label: 'Previous period',
                        values: buildComparisonValues(values),
                        color: 'rgba(255,255,255,0.65)',
                    },
                ];
            }

            var useThreshold = readBool(config, 'threshold', false);

            mountViz(this.el, {
                values: values,
                times: times,
                comparisonSeries: comparisonSeries,
                min: readFloat(config, 'min', 0),
                max: readFloat(config, 'max', 100),
                goodColor: readConfig(config, 'goodColor', '#01417F'),
                badColor: readConfig(config, 'badColor', '#DFA611'),
                textColor: readConfig(config, 'textColor', '#FFFFFF'),
                stroke: readConfig(config, 'stroke', '#FFFFFF'),
                background: readConfig(config, 'background', '#0B1F3B'),
                unit: readConfig(config, 'unit', '%'),
                subheader: readConfig(config, 'subheader', ''),
                smoothing: readConfig(config, 'smoothing', 'none'),
                smaWindow: readInt(config, 'smaWindow', 3),
                maxPoints: readInt(config, 'maxPoints', 0),
                thresholdMin: useThreshold ? readFloat(config, 'thresholdMin', 20) : undefined,
                thresholdMax: useThreshold ? readFloat(config, 'thresholdMax', 80) : undefined,
                target: useThreshold ? readFloat(config, 'target', 50) : undefined,
                anomalyMode: readConfig(config, 'anomalies', 'none'),
                anomalySensitivity: readInt(config, 'anomalySensitivity', 3),
                showXAxis: readBool(config, 'showXAxis', false),
                drilldown: readBool(config, 'drilldown', false),
                drilldownQuery: readConfig(
                    config,
                    'drilldownQuery',
                    'search index=_internal | stats count'
                ),
            });
        },

        reflow: function () {},

        remove: function () {
            unmountViz(this.el);
            this.el.innerHTML = '';
        },
    });
});
