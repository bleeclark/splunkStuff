import { useEffect, useMemo, useState } from 'react';

import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';
import { applyFiltersToFixtures } from '../data/applyFiltersToFixtures.js';
import { mockEntityDetails } from '../data/riskFixtures.js';
import { runSavedSearch } from '../data/splunkSearchClient.js';

const PANEL_SEARCH_MAP = {
    summary: 'risk_summary',
    timeseries: 'risk_timeseries',
    heatmap: 'risk_heatmap_entity_category',
    domain: 'risk_breakdown_domain',
    calendar: 'risk_calendar_heatmap',
    anomalies: 'risk_anomalies',
    entityDetail: 'risk_entity_detail',
};

function mapSplunkSummary(rows) {
    const row = rows[0] || {};
    return {
        totalRiskScore: Number(row.total_risk_score) || 0,
        previousTotalRiskScore: Number(row.previous_total_risk_score) || 0,
        deltaPercent: Number(row.delta_percent) || 0,
        anomalyCount: Number(row.anomaly_count) || 0,
        previousAnomalyCount: Number(row.previous_anomaly_count) || 0,
        severityCounts: {
            critical: Number(row.critical_count) || 0,
            high: Number(row.high_count) || 0,
            medium: Number(row.medium_count) || 0,
            low: Number(row.low_count) || 0,
        },
        meanTimeToDetectHours: Number(row.mttd_hours) || 0,
        sparklineMttd: String(row.mttd_sparkline || '')
            .split(',')
            .map(Number)
            .filter(Number.isFinite),
    };
}

function mapSplunkTimeSeries(rows) {
    return rows.map((row) => ({
        timestamp: row._time,
        riskScore: Number(row.risk_score) || 0,
        baselineScore: Number(row.baseline_score) || 0,
        isAnomaly: Number(row.is_anomaly) === 1,
        entityId: row.entity_id || null,
    }));
}

function mapSplunkHeatmapCells(rows) {
    return rows.map((row) => ({
        rowKey: row.entity_name,
        colKey: row.risk_category,
        value: Number(row.value) || 0,
        entityIds: row.entity_name ? [row.entity_name] : [],
    }));
}

function mapSplunkDomainBreakdown(rows) {
    return rows.map((row) => ({
        domain: row.domain,
        score: Number(row.score) || 0,
    }));
}

function mapSplunkCalendarCells(rows) {
    return rows.map((row) => ({
        rowKey: row.day,
        colKey: row.hour,
        value: Number(row.value) || 0,
    }));
}

function mapSplunkAnomalies(rows) {
    return rows.map((row) => ({
        id: row.id,
        entityId: row.entity_id,
        entityName: row.entity_name,
        domain: row.domain,
        severity: row.severity,
        riskScore: Number(row.risk_score) || 0,
        deltaFromBaseline: Number(row.delta_from_baseline) || 0,
        status: row.status,
        recurrenceCount: Number(row.recurrence_count) || 0,
    }));
}

function mapSplunkPanelData(panelId, rows, appliedFilters) {
    switch (panelId) {
        case 'summary':
            return mapSplunkSummary(rows);
        case 'timeseries':
            return mapSplunkTimeSeries(rows);
        case 'heatmap':
            return mapSplunkHeatmapCells(rows);
        case 'domain':
            return mapSplunkDomainBreakdown(rows);
        case 'calendar':
            return mapSplunkCalendarCells(rows);
        case 'anomalies':
            return mapSplunkAnomalies(rows);
        case 'entityDetail': {
            const id = appliedFilters.entityFocus;
            if (!id) {
                return null;
            }
            const row = rows[0] || {};
            return {
                entityId: id,
                currentRiskScore: Number(row.current_risk_score) || 0,
                threshold: Number(row.threshold) || 0,
                owner: row.owner,
                domain: row.domain,
                timeline: [],
            };
        }
        default:
            return rows;
    }
}

/**
 * Unified data hook: mock fixtures or Splunk saved searches based on dataMode.
 * @param {'summary'|'timeseries'|'heatmap'|'domain'|'calendar'|'anomalies'|'entityDetail'} panelId
 */
export function useRiskData(panelId) {
    const { appliedFilters, refreshGeneration, dataMode, lastRefreshedAt } =
        useDashboardFilters();

    const [splunkState, setSplunkState] = useState({
        loading: false,
        error: null,
        splunkData: null,
        progress: 0,
        dispatchState: null,
    });

    const mockBundle = useMemo(
        () => applyFiltersToFixtures(appliedFilters),
        [appliedFilters, refreshGeneration]
    );

    useEffect(() => {
        if (dataMode !== 'splunk') {
            setSplunkState({
                loading: false,
                error: null,
                splunkData: null,
                progress: 0,
                dispatchState: null,
            });
            return undefined;
        }

        const searchName = PANEL_SEARCH_MAP[panelId];
        if (!searchName) {
            return undefined;
        }

        if (panelId === 'entityDetail' && !appliedFilters.entityFocus) {
            setSplunkState({
                loading: false,
                error: null,
                splunkData: null,
                progress: 0,
                dispatchState: null,
            });
            return undefined;
        }

        const controller = new AbortController();

        setSplunkState({
            loading: true,
            error: null,
            splunkData: null,
            progress: 0,
            dispatchState: 'QUEUED',
        });

        runSavedSearch(searchName, appliedFilters, {
            signal: controller.signal,
            onProgress: (progress) => {
                setSplunkState((prev) => ({
                    ...prev,
                    progress: progress.progress,
                    dispatchState: progress.dispatchState,
                }));
            },
        })
            .then((rows) => {
                setSplunkState({
                    loading: false,
                    error: null,
                    splunkData: mapSplunkPanelData(panelId, rows, appliedFilters),
                    progress: 100,
                    dispatchState: 'DONE',
                });
            })
            .catch((err) => {
                if (controller.signal.aborted) {
                    return;
                }
                setSplunkState({
                    loading: false,
                    error: err instanceof Error ? err : new Error(String(err)),
                    splunkData: null,
                    progress: 0,
                    dispatchState: 'FAILED',
                });
            });

        return () => controller.abort();
    }, [dataMode, panelId, appliedFilters, refreshGeneration]);

    const data = useMemo(() => {
        if (dataMode === 'mock') {
            switch (panelId) {
                case 'summary':
                    return mockBundle.summary;
                case 'timeseries':
                    return mockBundle.timeSeries;
                case 'heatmap':
                    return mockBundle.heatmapCells;
                case 'domain':
                    return mockBundle.domainBreakdown;
                case 'calendar':
                    return mockBundle.calendarCells;
                case 'anomalies':
                    return mockBundle.anomalies;
                case 'entityDetail': {
                    const id = appliedFilters.entityFocus;
                    return id ? mockEntityDetails[id] || null : null;
                }
                default:
                    return null;
            }
        }
        return splunkState.splunkData;
    }, [dataMode, panelId, mockBundle, appliedFilters.entityFocus, splunkState.splunkData]);

    const loading = dataMode === 'splunk' && splunkState.loading;
    const status = loading ? 'loading' : splunkState.error ? 'error' : 'ok';

    return {
        data,
        loading,
        error: splunkState.error,
        progress: splunkState.progress,
        dispatchState: splunkState.dispatchState,
        status,
        lastRefreshedAt,
        dataMode,
        searchName: PANEL_SEARCH_MAP[panelId],
    };
}

/** Async fetch for Splunk mode (called from effects when dataMode=splunk). */
export async function fetchSplunkPanel(panelId, appliedFilters, options = {}) {
    const searchName = PANEL_SEARCH_MAP[panelId];
    if (!searchName) {
        throw new Error(`Unknown panel: ${panelId}`);
    }
    const rows = await runSavedSearch(searchName, appliedFilters, options);
    return mapSplunkPanelData(panelId, rows, appliedFilters);
}
