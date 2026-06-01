/* eslint-disable */
/**
 * Splunk custom visualization entry — React KPI + sparkline bundle.
 */
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import { applyTrendHostStyle, trendBackground, trendDelta } from '../../lib/splunkstuffTrendColors';
import { numericSeries, readBool, readConfig, safeColor } from '../splunkVizData';
import { mountViz, reflowViz, unmountViz } from './vizMount';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_sparkline_react.';

function enableAncestorPointerEvents(el, maxDepth = 24) {
    let node = el;
    let depth = 0;
    while (node && depth < maxDepth) {
        node.style.pointerEvents = 'auto';
        node = node.parentElement;
        depth += 1;
    }
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
        const values = (data && data.values) || [];
        const times = (data && data.times) || [];
        const goodColor = safeColor(readConfig(config, NS, 'goodColor', '#01417F'), '#01417F');
        const badColor = safeColor(readConfig(config, NS, 'badColor', '#DFA611'), '#DFA611');
        const textColor = safeColor(readConfig(config, NS, 'textColor', '#FFFFFF'), '#FFFFFF');
        const background = safeColor(readConfig(config, NS, 'background', '#0B1F3B'), '#0B1F3B');
        const invertTrend = readBool(config, NS, 'invertTrend', false);
        const delta = trendDelta(values);
        const visualDelta = invertTrend && Number.isFinite(delta) ? -delta : delta;
        const tileBackground =
            values.length >= 2 ? trendBackground(visualDelta, goodColor, badColor) : background;

        applyTrendHostStyle(this.el, tileBackground, textColor);
        this.el.style.pointerEvents = 'auto';
        enableAncestorPointerEvents(this.el);

        this._reflowTick = this._reflowTick || 0;
        mountViz(this.el, {
            values,
            times,
            config,
            reflowTick: this._reflowTick,
        });
    },

    reflow() {
        reflowViz(this.el);
    },

    remove() {
        unmountViz(this.el);
        this.el.innerHTML = '';
    },
});
