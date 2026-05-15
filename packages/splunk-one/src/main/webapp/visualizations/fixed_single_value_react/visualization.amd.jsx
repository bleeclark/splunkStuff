/* eslint-disable */
/**
 * Splunk custom visualization entry — React implementation.
 *
 * Default export is the `SplunkVisualizationBase.extend({...})` class. Keep the
 * `api/SplunkVisualizationBase` import so Webpack emits `define([deps], factory)`.
 */
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import { mountViz, unmountViz } from './vizMount';

const NS = 'display.visualizations.custom.splunk-one.fixed_single_value_react.';

function readConfig(config, prop, defaultVal) {
    const v = config[NS + prop];
    if (v === undefined || v === null || v === '') {
        return defaultVal;
    }
    return v;
}

function pickNumericColumnIndex(rawData) {
    if (!rawData || !rawData.columns || !rawData.fields) {
        return -1;
    }
    let best = -1;
    for (let c = 0; c < rawData.columns.length; c += 1) {
        const col = rawData.columns[c];
        if (!col || col.length === 0) {
            continue;
        }
        let ok = true;
        for (let i = 0; i < col.length; i += 1) {
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

export default SplunkVisualizationBase.extend({
    getInitialDataParams() {
        return {
            outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
            count: 5000,
        };
    },

    formatData(rawData) {
        if (!rawData || !rawData.columns || rawData.columns.length === 0) {
            return { values: [] };
        }
        const idx = pickNumericColumnIndex(rawData);
        if (idx < 0) {
            throw new SplunkVisualizationBase.VisualizationError(
                'Fixed single value (React) requires at least one all-numeric column in results.'
            );
        }
        const vals = rawData.columns[idx].map((v) => parseFloat(v, 10));
        return { values: vals };
    },

    updateView(data, config) {
        const values = (data && data.values) || [];

        mountViz(this.el, {
            values,
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

    reflow() {},

    remove() {
        unmountViz(this.el);
        this.el.innerHTML = '';
    },
});
