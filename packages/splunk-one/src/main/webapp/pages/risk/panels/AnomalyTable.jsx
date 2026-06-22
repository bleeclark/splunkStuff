import React from 'react';

import Table from '@splunk/react-ui/Table';

import { useRiskData } from '../hooks/useRiskData.js';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';

function MiniSparkline({ values }) {
    const nums = (values || []).map(Number).filter(Number.isFinite);
    if (nums.length < 2) {
        return <span>—</span>;
    }
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max - min || 1;
    const w = 60;
    const h = 20;
    const step = w / (nums.length - 1);
    const points = nums
        .map((v, i) => {
            const x = i * step;
            const y = h - ((v - min) / range) * h;
            return `${x},${y}`;
        })
        .join(' ');
    return (
        <svg width={w} height={h} aria-hidden>
            <polyline
                fill="none"
                stroke="#01417F"
                strokeWidth="1.5"
                points={points}
            />
        </svg>
    );
}

export default function AnomalyTable() {
    const riskData = useRiskData('anomalies');
    const { data: anomalies, lastRefreshedAt } = riskData;
    const { setEntityFocus } = useDashboardFilters();

    const rows = Array.isArray(anomalies) ? anomalies : [];
    const shellProps = panelShellPropsFromRiskData(riskData);

    return (
        <PanelShell
            title="Anomaly Investigation"
            lastUpdated={lastRefreshedAt}
            {...shellProps}
            emptyState={
                shellProps.emptyState ||
                (!rows.length ? 'No anomalies match the applied filters' : undefined)
            }
        >
            <div id="risk-anomaly-table">
                <Table>
                    <Table.Head>
                        <Table.HeadCell>Severity</Table.HeadCell>
                        <Table.HeadCell>Entity</Table.HeadCell>
                        <Table.HeadCell>Domain</Table.HeadCell>
                        <Table.HeadCell>Score</Table.HeadCell>
                        <Table.HeadCell>Delta</Table.HeadCell>
                        <Table.HeadCell>Status</Table.HeadCell>
                        <Table.HeadCell>Trend</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.severity}</Table.Cell>
                                <Table.Cell>
                                    <button
                                        type="button"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#1565c0',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                        }}
                                        onClick={() => setEntityFocus(row.entityId)}
                                    >
                                        {row.entityName}
                                    </button>
                                </Table.Cell>
                                <Table.Cell>{row.domain}</Table.Cell>
                                <Table.Cell>{row.riskScore}</Table.Cell>
                                <Table.Cell>{row.deltaFromBaseline}</Table.Cell>
                                <Table.Cell>{row.status}</Table.Cell>
                                <Table.Cell>
                                    <MiniSparkline values={row.sparkline} />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
        </PanelShell>
    );
}
