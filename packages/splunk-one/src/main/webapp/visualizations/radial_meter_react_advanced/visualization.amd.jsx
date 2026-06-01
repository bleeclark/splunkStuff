/* eslint-disable */
import React from 'react';
import { createRoot } from 'react-dom/client';
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import AdvancedRadialMeter from '../../components/visualizations/AdvancedRadialMeter';
import {
    cellValue,
    parseNum,
    readBool,
    readConfig,
    readFloat,
    safeColor,
} from '../splunkVizData';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.radial_meter_react_advanced.';
const roots = new WeakMap();

function pickNumericDatum(rawData) {
    if (rawData && rawData.rows && rawData.rows[0] && rawData.rows[0].length) {
        return parseNum(rawData.rows[0][0]);
    }
    if (!rawData || !rawData.columns) {
        return NaN;
    }
    for (let c = 0; c < rawData.columns.length; c += 1) {
        for (let r = 0; r < rawData.columns[c].length; r += 1) {
            const n = parseNum(cellValue(rawData.columns[c][r]));
            if (Number.isFinite(n)) {
                return n;
            }
        }
    }
    return NaN;
}

function readInt(config, prop, fallback) {
    const n = parseInt(readConfig(config, NS, prop, fallback), 10);
    return Number.isFinite(n) ? n : fallback;
}

function mount(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    root.render(<AdvancedRadialMeter {...props} />);
}

export default SplunkVisualizationBase.extend({
    getInitialDataParams() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000,
        };
    },

    formatData(rawData) {
        return pickNumericDatum(rawData);
    },

    updateView(value, config) {
        mount(this.el, {
            value,
            maxValue: readFloat(config, NS, 'maxValue', 100),
            target: readFloat(config, NS, 'target', 80),
            warningAt: readFloat(config, NS, 'warningAt', 55),
            criticalAt: readFloat(config, NS, 'criticalAt', 30),
            invertStatus: readBool(config, NS, 'invertStatus', false),
            title: readConfig(config, NS, 'title', 'Capacity'),
            subtitle: readConfig(config, NS, 'subtitle', 'Current utilization'),
            unit: readConfig(config, NS, 'unit', ''),
            precision: readInt(config, 'precision', 0),
            backgroundColor: safeColor(
                readConfig(config, NS, 'backgroundColor', '#FFFFFF'),
                '#FFFFFF'
            ),
            textColor: safeColor(readConfig(config, NS, 'textColor', '#303B46'), '#303B46'),
            trackColor: safeColor(readConfig(config, NS, 'trackColor', '#D9DEE3'), '#D9DEE3'),
            lowColor: safeColor(readConfig(config, NS, 'lowColor', '#D94E4E'), '#D94E4E'),
            mediumColor: safeColor(
                readConfig(config, NS, 'mediumColor', '#DFA611'),
                '#DFA611'
            ),
            highColor: safeColor(readConfig(config, NS, 'highColor', '#2E9E6F'), '#2E9E6F'),
            needleColor: safeColor(
                readConfig(config, NS, 'needleColor', '#243447'),
                '#243447'
            ),
            width: 320,
            height: 250,
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

