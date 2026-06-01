/* eslint-disable */
import React from 'react';
import { createRoot } from 'react-dom/client';
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import { numericSeries, readConfig } from '../splunkVizData';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.simple_small_viz_react.';
const roots = new WeakMap();

function SimpleSmallViz({ value, label }) {
    return (
        <div
            style={{
                alignItems: 'center',
                background: '#01417F',
                boxSizing: 'border-box',
                color: '#fff',
                display: 'flex',
                fontFamily: "'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                gap: 10,
                height: '100%',
                justifyContent: 'space-between',
                minHeight: 90,
                padding: '16px 18px',
                width: '100%',
            }}
        >
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.82 }}>{label}</div>
            <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1 }}>
                {Number.isFinite(value) ? value.toLocaleString() : '-'}
            </div>
        </div>
    );
}

function mount(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    root.render(<SimpleSmallViz {...props} />);
}

export default SplunkVisualizationBase.extend({
    getInitialDataParams() {
        return {
            outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
            count: 1000,
        };
    },

    formatData(rawData) {
        const series = numericSeries(rawData);
        return series.values;
    },

    updateView(values, config) {
        const latest = values && values.length ? values[values.length - 1] : NaN;
        mount(this.el, {
            value: latest,
            label: readConfig(config, NS, 'label', 'Latest count'),
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

