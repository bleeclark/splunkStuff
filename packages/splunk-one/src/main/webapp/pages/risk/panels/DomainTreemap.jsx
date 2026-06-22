import React, { useMemo } from 'react';

import { useRiskData } from '../hooks/useRiskData.js';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';

export default function DomainTreemap() {
    const riskData = useRiskData('domain');
    const { data: breakdown, lastRefreshedAt } = riskData;

    const total = useMemo(() => {
        if (!Array.isArray(breakdown)) {
            return 0;
        }
        return breakdown.reduce((sum, row) => sum + row.score, 0);
    }, [breakdown]);

    const colors = ['#01417F', '#1565c0', '#42a5f5', '#90caf9'];

    const shellProps = panelShellPropsFromRiskData(riskData);

    return (
        <PanelShell
            title="Risk by Domain"
            lastUpdated={lastRefreshedAt}
            {...shellProps}
            emptyState={
                shellProps.emptyState ||
                (!breakdown?.length ? 'No domain breakdown data' : undefined)
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.isArray(breakdown) &&
                    breakdown.map((row, i) => {
                        const pct = total > 0 ? (row.score / total) * 100 : 0;
                        return (
                            <div key={row.domain}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 12,
                                        marginBottom: 4,
                                    }}
                                >
                                    <span>{row.domain}</span>
                                    <span>
                                        {row.score} ({pct.toFixed(0)}%)
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: 24,
                                        width: `${Math.max(pct, 4)}%`,
                                        background: colors[i % colors.length],
                                        borderRadius: 4,
                                    }}
                                />
                            </div>
                        );
                    })}
            </div>
        </PanelShell>
    );
}
