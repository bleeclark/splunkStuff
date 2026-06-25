/**
 * KPI panel displaying active anomaly count with delta sparkline.
 */
import React, { useMemo } from 'react';

import { useRiskData } from '../hooks/useRiskData.js';
import { KpiTile } from '../RiskStyles.jsx';
import { KPI_WIDGET_COMMON } from './kpiWidgetCommon.js';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';
import ResponsiveKpiValue from './ResponsiveKpiValue.jsx';

/**
 * WHAT: Shows active anomaly count with change-from-previous-period in a sparkline KPI tile.
 * WORKS WITH: useRiskData, ResponsiveKpiValue, KPI_WIDGET_COMMON, PanelShell, KpiTile.
 */
export default function AnomalyCountKpi() {
    const riskData = useRiskData('summary');
    const { data: summary, lastRefreshedAt } = riskData;

    const feed = useMemo(() => {
        if (!summary) {
            return { subheader: '(+0)', values: [], times: [] };
        }
        const delta = summary.anomalyCount - summary.previousAnomalyCount;
        return {
            subheader: `(${delta >= 0 ? '+' : ''}${delta})`,
            tooltipText: `${summary.anomalyCount} open anomalies in range`,
            values: [summary.previousAnomalyCount, summary.anomalyCount],
            times: ['2026-06-09T00:00:00Z', '2026-06-10T00:00:00Z'],
        };
    }, [summary]);

    return (
        <PanelShell
            title="Active Anomalies"
            lastUpdated={lastRefreshedAt}
            {...panelShellPropsFromRiskData(riskData)}
        >
            <KpiTile>
                <ResponsiveKpiValue
                    feed={feed}
                    {...KPI_WIDGET_COMMON}
                    sparkMin={0}
                    sparkMax={50}
                    options={{ ...KPI_WIDGET_COMMON.options, unit: '' }}
                />
            </KpiTile>
        </PanelShell>
    );
}
