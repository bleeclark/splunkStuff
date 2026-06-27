/**
 * Risk score time-series line chart panel with anomaly markers.
 */
import React, { useMemo } from 'react';

import LineChart from '../../../components/visualizations/LineChart';
import { useRiskData } from '../hooks/useRiskData.js';
import { useContainerSize } from '../hooks/useContainerSize.js';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';

const CHART_HEIGHT = 240;

/**
 * WHAT: Renders the risk score over time line chart with anomaly point markers.
 * WORKS WITH: useRiskData, useContainerSize, useDashboardFilters, LineChart, PanelShell.
 */
export default function RiskTrendChart() {
    const riskData = useRiskData('timeseries');
    const { data: timeSeries, lastRefreshedAt } = riskData;
    const { appliedFilters } = useDashboardFilters();
    const { hostRef, width: chartWidth } = useContainerSize({
        minWidth: 320,
        defaultWidth: 800,
    });

    const { values, times, anomalyIndices } = useMemo(() => {
        if (!Array.isArray(timeSeries)) {
            return { values: [], times: [], anomalyIndices: [] };
        }
        const valuesOut = timeSeries.map((p) => p.riskScore);
        const timesOut = timeSeries.map((p) => p.timestamp);
        const anomalyIndicesOut = timeSeries
            .map((p, i) => (p.isAnomaly ? i : -1))
            .filter((i) => i >= 0);
        return { values: valuesOut, times: timesOut, anomalyIndices: anomalyIndicesOut };
    }, [timeSeries]);

    const isEmptyOk = riskData.status === 'ok' && !values.length;

    if (appliedFilters.hideEmptyPanels && isEmptyOk) {
        return null;
    }

    return (
        <PanelShell
            title="Risk Score Over Time"
            lastUpdated={lastRefreshedAt}
            {...panelShellPropsFromRiskData(riskData)}
            compact={isEmptyOk}
            emptyState={isEmptyOk ? 'No trend data for selected filters' : undefined}
        >
            <div
                ref={hostRef}
                style={{
                    background: '#0B1F3B',
                    padding: 8,
                    borderRadius: 4,
                    width: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                <LineChart
                    values={values}
                    times={times}
                    width={chartWidth}
                    height={CHART_HEIGHT}
                    fillContainer
                    min={600}
                    max={950}
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth={2}
                    background="#0B1F3B"
                    goodColor="#01417F"
                    badColor="#DFA611"
                    textColor="#FFFFFF"
                    subheader="Risk score trend"
                    anomalyMode="deltaZscore"
                    anomalySensitivity={2}
                    showMajor={false}
                />
                {anomalyIndices.length ? (
                    <div style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>
                        Anomalies at points:{' '}
                        {anomalyIndices.map((i) => (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    marginRight: 8,
                                    background: '#DFA611',
                                    borderRadius: 4,
                                    padding: '2px 8px',
                                }}
                            >
                                {i + 1}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        </PanelShell>
    );
}
