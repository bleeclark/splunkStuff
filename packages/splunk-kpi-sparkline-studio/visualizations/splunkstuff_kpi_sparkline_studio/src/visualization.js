import { VisualizationAPI } from '@splunk/dashboard-studio-extension';
import './visualization.css';
import { parsePrimarySearchData } from './lib/parsePrimaryData.js';
import { resolveOptions } from './lib/resolveOptions.js';
import {
    cleanupSharedHover,
    renderKpiSparklineTile,
    renderTrellisGrid,
} from './lib/renderTile.js';

const mountElement = document.getElementById('root');
const visualizationState = {
    searchData: null,
    loading: false,
    rawOptions: {},
    sharedHover: { cleanupHandlers: [], tooltipElement: null },
};

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

VisualizationAPI.addDataSourcesListener(
    ({ dataSources, loading }) => {
        visualizationState.loading = loading;
        visualizationState.searchData = dataSources?.primary?.data ?? null;
        renderVisualization();
    },
    { invokeImmediately: true }
);

VisualizationAPI.addOptionsListener(({ options }) => {
    visualizationState.rawOptions = options || {};
    renderVisualization();
});
