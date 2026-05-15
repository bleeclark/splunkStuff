/* eslint-disable */
/**
 * Splunk custom visualization entry — React LineChart bundle.
 * Same `SplunkVisualizationBase.extend` + AMD library output as fixed_single_value_react.
 */
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import { mountViz, unmountViz } from './vizMount';

const NS = 'display.visualizations.custom.splunk-one.fixed_loaded_line.';

function readConfig(config, prop, defaultVal) {
    const v = config[NS + prop];
    if (v === undefined || v === null || v === '') {
        return defaultVal;
    }
    return v;
}

function readBool(config, prop, defaultVal) {
    const v = config[NS + prop];
    if (v === undefined || v === null || v === '') {
        return defaultVal;
    }
    if (v === true) return true;
    if (v === false) return false;
    const s = String(v).toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
    return defaultVal;
}

function readFloat(config, prop, defaultVal) {
    const raw = readConfig(config, prop, null);
    if (raw === null || raw === '') {
        return defaultVal;
    }
    const n = parseFloat(raw, 10);
    return isFinite(n) ? n : defaultVal;
}

function readInt(config, prop, defaultVal) {
    const raw = readConfig(config, prop, null);
    if (raw === null || raw === '') {
        return defaultVal;
    }
    const n = parseInt(raw, 10);
    return isFinite(n) ? n : defaultVal;
}

function fieldName(fields, idx) {
    if (!fields || idx < 0 || idx >= fields.length) return '';
    const f = fields[idx];
    if (typeof f === 'string') return f;
    if (f != null && f.name != null) return String(f.name);
    return '';
}

function findTimeColumnIndex(rawData) {
    if (!rawData || !rawData.fields) {
        return -1;
    }
    for (let i = 0; i < rawData.fields.length; i += 1) {
        if (fieldName(rawData.fields, i) === '_time') {
            return i;
        }
    }
    return -1;
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

/** Keep `values` and `times` row-aligned after sorting by _time ascending. */
function reorderValuesAndTimesByTime(rawData, valueIdx, timeIdx) {
    const valCol = rawData.columns[valueIdx];
    const n = valCol ? valCol.length : 0;
    if (!n) {
        return { values: [], times: [] };
    }
    if (timeIdx < 0 || !rawData.columns[timeIdx] || rawData.columns[timeIdx].length !== n) {
        return {
            values: valCol.map((v) => parseFloat(v, 10)),
            times: [],
        };
    }
    const tcol = rawData.columns[timeIdx];
    const order = [...Array(n).keys()].sort((a, b) => {
        const ka = timeSortKey(rawData, timeIdx, a);
        const kb = timeSortKey(rawData, timeIdx, b);
        if (ka !== kb) return ka - kb;
        return a - b;
    });
    return {
        values: order.map((ri) => parseFloat(valCol[ri], 10)),
        times: order.map((ri) => tcol[ri]),
    };
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

function buildComparisonValues(values) {
    return values.map((v, i) => {
        const base = parseFloat(v, 10);
        const wiggle = i % 2 === 0 ? -6 : 4;
        return isFinite(base) ? base + wiggle : base;
    });
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
            return { values: [], times: [] };
        }
        const idx = pickNumericColumnIndex(rawData);
        if (idx < 0) {
            throw new SplunkVisualizationBase.VisualizationError(
                'Fixed loaded line requires at least one all-numeric column (excluding _time) in results.'
            );
        }
        const tIdx = findTimeColumnIndex(rawData);
        return reorderValuesAndTimesByTime(rawData, idx, tIdx);
    },

    updateView(data, config) {
        const values = (data && data.values) || [];
        const times = (data && data.times) || [];

        const comparison = readBool(config, 'comparison', false);
        let comparisonSeries = null;
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

        const useThreshold = readBool(config, 'threshold', false);

        mountViz(this.el, {
            values,
            times,
            comparisonSeries,
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

    reflow() {},

    remove() {
        unmountViz(this.el);
        this.el.innerHTML = '';
    },
});
