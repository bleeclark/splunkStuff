/* eslint-disable */
import React from 'react';
import { createRoot } from 'react-dom/client';
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import LineChart from '../../components/visualizations/LineChart';
import { numericSeries, readBool, readConfig, readFloat, safeColor } from '../splunkVizData';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_sparkline_react.';
const roots = new WeakMap();

function KpiSparklineReact({ values, times, config }) {
    const background = safeColor(readConfig(config, NS, 'background', '#0B1F3B'), '#0B1F3B');
    const textColor = safeColor(readConfig(config, NS, 'textColor', '#FFFFFF'), '#FFFFFF');
    return (
        <div style={{ width: '100%', height: '100%', minHeight: 220, background, color: textColor }}>
            <LineChart
                values={values}
                times={times}
                width={420}
                height={260}
                min={readFloat(config, NS, 'min', 0)}
                max={readFloat(config, NS, 'max', 100)}
                stroke={safeColor(readConfig(config, NS, 'stroke', '#FFFFFF'), '#FFFFFF')}
                background={background}
                goodColor={safeColor(readConfig(config, NS, 'goodColor', '#01417F'), '#01417F')}
                badColor={safeColor(readConfig(config, NS, 'badColor', '#DFA611'), '#DFA611')}
                textColor={textColor}
                unit={readConfig(config, NS, 'unit', '%')}
                subheader={readConfig(config, NS, 'subheader', 'Demo KPI')}
                showMajor
                centerMajor
                colorPlacement="full"
                showHover={readBool(config, NS, 'showHover', true)}
            />
        </div>
    );
}

function mount(el, props) {
    let root = roots.get(el);
    if (!root) {
        root = createRoot(el);
        roots.set(el, root);
    }
    root.render(<KpiSparklineReact {...props} />);
}

export default SplunkVisualizationBase.extend({
    getInitialDataParams() {
        return {
            outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
            count: 5000,
        };
    },

    formatData(rawData) {
        return numericSeries(rawData);
    },

    updateView(data, config) {
        mount(this.el, {
            values: data.values || [],
            times: data.times || [],
            config,
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

