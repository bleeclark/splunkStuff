/**
 * KPI panel displaying total risk score with delta sparkline.
 */
import React, { useMemo } from 'react';

import { useRiskData } from '../hooks/useRiskData.js';
import { KpiTile } from '../RiskStyles.jsx';
import { KPI_WIDGET_COMMON } from './kpiWidgetCommon.js';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';
import ResponsiveKpiValue from './ResponsiveKpiValue.jsx';

/**
 * WHAT: Shows total risk score with period-over-period delta in a sparkline KPI tile.
 * WORKS WITH: useRiskData, ResponsiveKpiValue, KPI_WIDGET_COMMON, PanelShell, KpiTile.
 */
export default function RiskScoreKpi() {
    const riskData = useRiskData('summary');
    const { data, lastRefreshedAt } = riskData;

    const feed = useMemo(() => {
        if (!data) {
            return { subheader: '(+0%)', values: [], times: [] };
        }
        return {
            subheader: `(${data.deltaPercent >= 0 ? '+' : ''}${data.deltaPercent}%)`,
            tooltipText: `Current: ${data.totalRiskScore}, previous: ${data.previousTotalRiskScore}`,
            values: [data.previousTotalRiskScore, data.totalRiskScore],
            times: ['2026-06-09T00:00:00Z', '2026-06-10T00:00:00Z'],
        };
    }, [data]);

    return (
        <PanelShell
            title="Total Risk Score"
            lastUpdated={lastRefreshedAt}
            {...panelShellPropsFromRiskData(riskData)}
        >
            <KpiTile>
                <ResponsiveKpiValue
                    feed={feed}
                    {...KPI_WIDGET_COMMON}
                    sparkMin={0}
                    sparkMax={1000}
                    options={{ ...KPI_WIDGET_COMMON.options, unit: '' }}
                />
            </KpiTile>
        </PanelShell>
    );
}
