/**
 * @file visualization.js
 * @description Dashboard Studio extension entry point for SplunkStuff KPI + Sparkline.
 *   Splunk 10.4+ loads this ESM bundle into a host page with `<div id="root">` and wires
 *   search data + formatter options through VisualizationAPI listeners.
 *
 * Data flow:
 *   VisualizationAPI.addDataSourcesListener → visualizationState.searchData
 *   VisualizationAPI.addOptionsListener      → visualizationState.rawOptions
 *        ↓
 *   resolveOptions(rawOptions) → resolvedOptions
 *   parsePrimarySearchData(searchData, resolvedOptions) → primary | trellisGroups
 *        ↓
 *   splitByLayout === 'trellis' ? renderTrellisGrid : renderKpiSparklineTile
 *
 * @requires @splunk/dashboard-studio-extension
 * @see lib/renderTile.js — DOM rendering
 * @see lib/parsePrimaryData.js — search data contract
 * @see lib/resolveOptions.js — config.json option mapping
 */

import { VisualizationAPI } from '@splunk/dashboard-studio-extension';
import './visualization.css';
import { parsePrimarySearchData } from './lib/parsePrimaryData.js';
import { resolveOptions } from './lib/resolveOptions.js';
import {
    cleanupSharedHover,
    renderKpiSparklineTile,
    renderTrellisGrid,
} from './lib/renderTile.js';

/** Studio host mount node provided in the extension HTML shell. */
const mountElement = document.getElementById('root');

/**
 * Mutable visualization state shared across API listener callbacks.
 * Re-rendered synchronously on each data or options change.
 */
const visualizationState = {
    searchData: null,
    loading: false,
    rawOptions: {},
    sharedHover: { cleanupHandlers: [], tooltipElement: null },
};

/**
 * Full render pass: cleanup hover listeners, parse data, render tile or trellis grid.
 * Surfaces parse errors via VisualizationAPI.setError and inline mount text.
 */
function renderVisualization() {
    if (!mountElement) {
        return;
    }

    cleanupSharedHover(visualizationState.sharedHover);
    mountElement.innerHTML = '';

    if (visualizationState.loading) {
        mountElement.textContent = 'Loading...';
        return;
    }

    const resolvedOptions = resolveOptions(visualizationState.rawOptions);

    try {
        const parsedData = parsePrimarySearchData(visualizationState.searchData, resolvedOptions);

        if (resolvedOptions.splitByLayout === 'trellis' && parsedData.trellisGroups.length) {
            renderTrellisGrid(
                mountElement,
                parsedData.trellisGroups,
                resolvedOptions,
                document,
                visualizationState.sharedHover
            );
        } else if (parsedData.primary.valueSeries.length) {
            renderKpiSparklineTile(
                mountElement,
                parsedData.primary,
                resolvedOptions,
                document,
                visualizationState.sharedHover
            );
        } else {
            mountElement.textContent = resolvedOptions.emptyStateMessage;
        }
        VisualizationAPI.clearError();
    } catch (error) {
        mountElement.textContent = error && error.message ? error.message : String(error);
        VisualizationAPI.setError(error && error.message ? error.message : String(error));
    }
}

/** Primary search data + loading flag from Dashboard Studio data sources. */
VisualizationAPI.addDataSourcesListener(
    ({ dataSources, loading }) => {
        visualizationState.loading = loading;
        visualizationState.searchData = dataSources?.primary?.data ?? null;
        renderVisualization();
    },
    { invokeImmediately: true }
);

/** Formatter / visualization options from Studio editor (maps to config.json keys). */
VisualizationAPI.addOptionsListener(({ options }) => {
    visualizationState.rawOptions = options || {};
    renderVisualization();
});
