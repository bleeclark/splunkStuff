/* eslint-disable */
import React from 'react';
import { createRoot } from 'react-dom/client';
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import RadialMeter from '../../components/visualizations/RadialMeter';
import { cellValue, parseNum, readConfig, readFloat, safeColor } from '../splunkVizData';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.radial_meter_react.';
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

function mount(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    root.render(<RadialMeter {...props} />);
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
            mainColor: safeColor(readConfig(config, NS, 'mainColor', '#f7bc38'), '#f7bc38'),
            backgroundColor: safeColor(
                readConfig(config, NS, 'backgroundColor', '#ffffff'),
                '#ffffff'
            ),
            width: 220,
            height: 220,
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

