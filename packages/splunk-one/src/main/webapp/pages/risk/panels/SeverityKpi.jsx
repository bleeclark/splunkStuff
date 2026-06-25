/**
 * KPI panel displaying critical and high severity anomaly counts as badges.
 */
import React from 'react';

import { useRiskData } from '../hooks/useRiskData.js';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';

/**
 * WHAT: Returns inline style object for a severity badge based on severity level.
 * WORKS WITH: SeverityKpi, severityCounts from useRiskData summary.
 */
const badgeStyle = (severity) => ({
    display: 'inline-block',
    padding: '16px 20px',
    borderRadius: 8,
    marginRight: 12,
    fontWeight: 600,
    fontSize: 18,
    background:
        severity === 'critical'
            ? '#ffcdd2'
            : severity === 'high'
              ? '#ffe0b2'
              : '#e0e0e0',
});

/**
 * WHAT: Displays critical and high severity counts as colored badge labels.
 * WORKS WITH: useRiskData, PanelShell, panelShellPropsFromRiskData, summary.severityCounts.
 */
export default function SeverityKpi() {
    const riskData = useRiskData('summary');
    const { data: summary, lastRefreshedAt, status } = riskData;

    const { critical = 0, high = 0 } = summary?.severityCounts || {};
    const shellProps = panelShellPropsFromRiskData(riskData);

    return (
        <PanelShell
            title="Critical / High"
            lastUpdated={lastRefreshedAt}
            {...shellProps}
            emptyState={
                shellProps.emptyState ||
                (status === 'ok' && !summary ? 'No severity data' : undefined)
            }
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 150,
                    padding: '12px 8px',
                }}
            >
                <span style={badgeStyle('critical')}>Critical: {critical}</span>
                <span style={badgeStyle('high')}>High: {high}</span>
            </div>
        </PanelShell>
    );
}
