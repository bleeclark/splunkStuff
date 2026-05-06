/* eslint-disable */
/**
 * Splunk custom visualization entry (AMD) — React implementation.
 *
 * Splunk loads this file via RequireJS as:
 *   define(['api/SplunkVisualizationBase'], factory)
 *
 * Webpack bundles React + react-dom into this output, but keeps Splunk APIs external.
 */
import { mountViz, unmountViz } from './vizMount';

define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    /**
     * Must match Splunk's expanded formatter namespace:
     *   display.visualizations.custom.<app_id>.<viz_directory_name>.<prop>
     *
     * This repo's Splunk app id is `splunk-one` (see `default/app.conf`).
     */
    var NS = 'display.visualizations.custom.splunk-one.fixed_single_value_react.';

    function readConfig(config, prop, defaultVal) {
        var v = config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return defaultVal;
        }
        return v;
    }

    function pickNumericColumnIndex(rawData) {
        if (!rawData || !rawData.columns || !rawData.fields) {
            return -1;
        }
        var best = -1;
        for (var c = 0; c < rawData.columns.length; c += 1) {
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

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        formatData: function (rawData) {
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                return { values: [] };
            }
            var idx = pickNumericColumnIndex(rawData);
            if (idx < 0) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Fixed single value (React) requires at least one all-numeric column in results.'
                );
            }
            var vals = rawData.columns[idx].map(function (v) {
                return parseFloat(v, 10);
            });
            return { values: vals };
        },

        updateView: function (data, config) {
            var values = (data && data.values) || [];

            // Mount/update React tree into Splunk-provided container element.
            mountViz(this.el, {
                values: values,
                sparkMin: readConfig(config, 'sparkMin', 0),
                sparkMax: readConfig(config, 'sparkMax', 100),
                goodColor: readConfig(config, 'goodColor', '#01417F'),
                badColor: readConfig(config, 'badColor', '#DFA611'),
                textColor: readConfig(config, 'textColor', '#FFFFFF'),
                sparkStroke: readConfig(config, 'sparkStroke', '#FFFFFF'),
                unit: readConfig(config, 'unit', '%'),
                subheader: readConfig(config, 'subheader', ''),
            });
        },

        reflow: function () {},

        remove: function () {
            unmountViz(this.el);
            this.el.innerHTML = '';
        },
    });
});
