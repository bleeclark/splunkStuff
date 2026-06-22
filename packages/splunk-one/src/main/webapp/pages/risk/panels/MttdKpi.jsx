import React, { useMemo } from 'react';

import { useRiskData } from '../hooks/useRiskData.js';
import { KpiTile } from '../RiskStyles.jsx';
import { KPI_WIDGET_COMMON } from './kpiWidgetCommon.js';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';
import ResponsiveKpiValue from './ResponsiveKpiValue.jsx';

export default function MttdKpi() {
    const riskData = useRiskData('summary');
    const { data: summary, lastRefreshedAt } = riskData;

    const feed = useMemo(() => {
        const spark = summary?.sparklineMttd || [4.2];
        const hours = summary?.meanTimeToDetectHours ?? 4.2;
        const values =
            spark.length > 1
                ? [...spark.slice(0, -1), hours]
                : [hours];
        return {
            subheader: `(${hours}h avg)`,
            tooltipText: 'Mean time to detect (hours)',
            values,
            times: values.map((_, i) => `2026-06-0${i + 1}T00:00:00Z`),
        };
    }, [summary]);

    return (
        <PanelShell
            title="Mean Time to Detect"
            lastUpdated={lastRefreshedAt}
            {...panelShellPropsFromRiskData(riskData)}
        >
            <KpiTile>
                <ResponsiveKpiValue
                    feed={feed}
                    {...KPI_WIDGET_COMMON}
                    sparkMin={0}
                    sparkMax={8}
                    options={{ ...KPI_WIDGET_COMMON.options, unit: 'h' }}
                />
            </KpiTile>
        </PanelShell>
    );
}
