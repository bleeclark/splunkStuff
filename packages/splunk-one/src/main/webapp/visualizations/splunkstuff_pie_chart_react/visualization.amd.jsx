/* eslint-disable */
import React from 'react';
import { createRoot } from 'react-dom/client';
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import PieChart from '../../components/visualizations/PieChart';
import {
    cellValue,
    fieldsList,
    fieldName,
    parseNum,
    readBool,
    readConfig,
    readFloat,
    safeColor,
} from '../splunkVizData';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_pie_chart_react.';
const roots = new WeakMap();
const VALUE_HINTS = ['value', 'count', 'sum', 'total', 'amount', 'pct', 'percent', 'avg', 'mean'];
const LABEL_HINTS = ['category', 'label', 'name', 'series', 'slice', 'status', 'host', 'field'];

function isNumericColumn(rawData, colIdx) {
    const col = rawData.columns[colIdx] || [];
    return col.some((cell) => Number.isFinite(parseNum(cell)));
}

function hintMatch(name, hints) {
    return hints.some((hint) => name === hint || name.indexOf(hint) >= 0);
}

function pickColumns(rawData) {
    const fields = fieldsList(rawData);
    let valueIdx = -1;
    let labelIdx = -1;
    for (let c = 0; c < rawData.columns.length; c += 1) {
        const name = fieldName(fields, c).toLowerCase();
        if (name === '_time' || name.indexOf('_time') === 0) {
            continue;
        }
        if (hintMatch(name, VALUE_HINTS) && isNumericColumn(rawData, c)) {
            valueIdx = c;
            break;
        }
    }
    if (valueIdx < 0) {
        valueIdx = rawData.columns.findIndex((_, c) => isNumericColumn(rawData, c));
    }
    for (let c = 0; c < rawData.columns.length; c += 1) {
        const name = fieldName(fields, c).toLowerCase();
        if (c !== valueIdx && hintMatch(name, LABEL_HINTS) && !isNumericColumn(rawData, c)) {
            labelIdx = c;
            break;
        }
    }
    if (labelIdx < 0) {
        labelIdx = rawData.columns.findIndex((_, c) => c !== valueIdx && !isNumericColumn(rawData, c));
    }
    return { labelIdx, valueIdx };
}

function slicesFromRaw(rawData) {
    const picked = pickColumns(rawData);
    if (picked.valueIdx < 0) {
        return [];
    }
    const labels = picked.labelIdx >= 0 ? rawData.columns[picked.labelIdx] || [] : [];
    const values = rawData.columns[picked.valueIdx] || [];
    const byLabel = {};
    const order = [];
    for (let i = 0; i < values.length; i += 1) {
        const value = parseNum(values[i]);
        if (!Number.isFinite(value) || value < 0) {
            continue;
        }
        let label = picked.labelIdx >= 0 ? String(cellValue(labels[i]) || '') : `Row ${i + 1}`;
        if (!label) {
            label = '(blank)';
        }
        if (!Object.prototype.hasOwnProperty.call(byLabel, label)) {
            byLabel[label] = 0;
            order.push(label);
        }
        byLabel[label] += value;
    }
    return order.map((label) => ({ label, value: byLabel[label] }));
}

function mount(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    root.render(<PieChart {...props} />);
}

export default SplunkVisualizationBase.extend({
    getInitialDataParams() {
        return {
            outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
            count: 10000,
        };
    },

    formatData(rawData) {
        return { slices: rawData && rawData.columns ? slicesFromRaw(rawData) : [] };
    },

    updateView(data, config) {
        mount(this.el, {
            slices: data.slices,
            topN: readFloat(config, NS, 'topN', 5),
            otherLabel: readConfig(config, NS, 'otherLabel', 'Other'),
            showPercent: readBool(config, NS, 'showPercent', true),
            title: readConfig(config, NS, 'title', 'Top categories'),
            background: safeColor(readConfig(config, NS, 'background', '#1B2A41'), '#1B2A41'),
            textColor: safeColor(readConfig(config, NS, 'textColor', '#FFFFFF'), '#FFFFFF'),
            width: '100%',
            height: '100%',
        });
    },

    remove() {
        const root = roots.get(this.el);
        if (root) {
            root.unmount();
            roots.delete(this.el);
        }
        this.el.innerHTML = '';
    },
});

