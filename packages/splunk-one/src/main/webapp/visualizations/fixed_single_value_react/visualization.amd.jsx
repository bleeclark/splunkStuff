/* eslint-disable */
/**
 * Splunk custom visualization entry — React implementation.
 *
 * Export the extended class as default (Splunk loads this as an AMD module).
 * Build with `output.library.type: "amd"` so `api/SplunkVisualizationBase` binds correctly.
 */
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import { mountViz, unmountViz } from './vizMount';

const NS = 'display.visualizations.custom.splunk-one.fixed_single_value_react.';

function fieldName(fields, idx) {
    if (!fields || idx < 0 || idx >= fields.length) return '';
    const f = fields[idx];
    if (typeof f === 'string') return f;
    if (f != null && f.name != null) return String(f.name);
    return '';
}

function timeSortKey(rawData, timeIdx, rowIdx) {
    const cell = rawData.columns[timeIdx][rowIdx];
    if (cell == null || cell === '') return 0;
    if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
    const s = String(cell).trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) {
        const n = parseFloat(s, 10);
        return Number.isFinite(n) ? n : 0;
    }
    const ms = Date.parse(s);
    if (Number.isFinite(ms)) return ms / 1000;
    const fb = parseFloat(s, 10);
    return Number.isFinite(fb) ? fb : 0;
}

/** Value column entries reordered by _time ascending (sparkline / headline = chronological). */
function reorderValuesByTime(rawData, valueIdx) {
    const col = rawData.columns[valueIdx];
    if (!col || col.length === 0) return [];
    const n = col.length;
    let tIdx = -1;
    if (rawData.fields) {
        for (let i = 0; i < rawData.fields.length; i += 1) {
            if (fieldName(rawData.fields, i) === '_time') {
                tIdx = i;
                break;
            }
        }
    }
    if (tIdx < 0 || !rawData.columns[tIdx] || rawData.columns[tIdx].length !== n) {
        return col.map((v) => parseFloat(v, 10));
    }
    const order = [...Array(n).keys()].sort((a, b) => {
        const ka = timeSortKey(rawData, tIdx, a);
        const kb = timeSortKey(rawData, tIdx, b);
        if (ka !== kb) return ka - kb;
        return a - b;
    });
    return order.map((ri) => parseFloat(rawData.columns[valueIdx][ri], 10));
}

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
        if (fieldName(rawData.fields, c) === '_time') {
            continue;
        }
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
        const vals = reorderValuesByTime(rawData, idx);
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
