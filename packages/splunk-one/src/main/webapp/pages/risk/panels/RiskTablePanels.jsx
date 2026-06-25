/**
 * Shared table panel components for the risk dashboard with consistent styling and empty-state handling.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import Table from '@splunk/react-ui/Table';

import { useRiskData } from '../hooks/useRiskData.js';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';

const TABLE_WRAP_STYLE = {
    overflowX: 'auto',
    width: '100%',
    minWidth: 0,
};

const TABLE_STYLE = {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
};

const HEAD_CELL_STYLE = {
    padding: '10px 12px',
    whiteSpace: 'nowrap',
};

const BODY_CELL_STYLE = {
    padding: '10px 12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
};

/**
 * WHAT: Formats a numeric value as a locale-aware string, defaulting non-finite values to '0'.
 * WORKS WITH: RiskDataTable panels, summary and anomaly row data.
 */
function numberCell(value) {
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '0';
}

/**
 * WHAT: Formats a numeric value as a fixed-one-decimal percentage string.
 * WORKS WITH: RiskScoresTable, DomainDistributionHistogram, summary deltaPercent.
 */
function percentCell(value) {
    return `${Number(value || 0).toFixed(1)}%`;
}

/**
 * WHAT: Wraps Splunk Table with shared fixed-layout styling and configurable minimum width.
 * WORKS WITH: HeadCell, DataCell, Splunk Table, all exported table panel components.
 */
function RiskDataTable({ minWidth, children }) {
    return (
        <Table style={{ ...TABLE_STYLE, minWidth }}>
            {children}
        </Table>
    );
}

RiskDataTable.propTypes = {
    minWidth: PropTypes.number,
    children: PropTypes.node,
};

RiskDataTable.defaultProps = {
    minWidth: 560,
    children: null,
};

/**
 * WHAT: Renders a table header cell with shared head-cell padding and nowrap styling.
 * WORKS WITH: RiskDataTable, Splunk Table.HeadCell.
 */
function HeadCell({ children }) {
    return <Table.HeadCell style={HEAD_CELL_STYLE}>{children}</Table.HeadCell>;
}

HeadCell.propTypes = {
    children: PropTypes.node,
};

HeadCell.defaultProps = {
    children: null,
};

/**
 * WHAT: Renders a table body cell with shared ellipsis and padding styling.
 * WORKS WITH: RiskDataTable, Splunk Table.Cell.
 */
function DataCell({ children }) {
    return <Table.Cell style={BODY_CELL_STYLE}>{children}</Table.Cell>;
}

DataCell.propTypes = {
    children: PropTypes.node,
};

DataCell.defaultProps = {
    children: null,
};

/**
 * WHAT: Wraps table content in PanelShell with empty-state and hideEmptyPanels support.
 * WORKS WITH: panelShellPropsFromRiskData, useDashboardFilters, PanelShell, all exported table components.
 */
function EmptyAwarePanel({ riskData, title, emptyState, isEmpty, children }) {
    const shellProps = panelShellPropsFromRiskData(riskData);
    const { appliedFilters } = useDashboardFilters();
    const isEmptyOk = shellProps.status === 'ok' && isEmpty;

    if (appliedFilters.hideEmptyPanels && isEmptyOk) {
        return null;
    }

    return (
        <PanelShell
            title={title}
            lastUpdated={riskData.lastRefreshedAt}
            {...shellProps}
            compact={isEmptyOk}
            emptyState={shellProps.emptyState || emptyState}
        >
            <div style={TABLE_WRAP_STYLE}>{children}</div>
        </PanelShell>
    );
}

EmptyAwarePanel.propTypes = {
    riskData: PropTypes.shape({
        lastRefreshedAt: PropTypes.string,
    }).isRequired,
    title: PropTypes.string.isRequired,
    emptyState: PropTypes.node,
    isEmpty: PropTypes.bool,
    children: PropTypes.node,
};

EmptyAwarePanel.defaultProps = {
    emptyState: undefined,
    isEmpty: false,
    children: null,
};

/**
 * WHAT: Displays summary KPI metrics (risk score, anomalies, MTTD, severity) in a comparison table.
 * WORKS WITH: useRiskData, EmptyAwarePanel, RiskDataTable, numberCell, percentCell.
 */
export function RiskScoresTable() {
    const riskData = useRiskData('summary');
    const summary = riskData.data;

    const rows = useMemo(() => {
        if (!summary) {
            return [];
        }
        const severity = summary.severityCounts || {};
        return [
            {
                metric: 'Total risk score',
                current: numberCell(summary.totalRiskScore),
                previous: numberCell(summary.previousTotalRiskScore),
                change: percentCell(summary.deltaPercent),
            },
            {
                metric: 'Active anomalies',
                current: numberCell(summary.anomalyCount),
                previous: numberCell(summary.previousAnomalyCount),
                change: numberCell(
                    (summary.anomalyCount || 0) - (summary.previousAnomalyCount || 0)
                ),
            },
            {
                metric: 'Mean time to detect',
                current: `${Number(summary.meanTimeToDetectHours || 0).toFixed(1)}h`,
                previous: '-',
                change: '-',
            },
            {
                metric: 'Critical / high / medium / low',
                current: [
                    numberCell(severity.critical),
                    numberCell(severity.high),
                    numberCell(severity.medium),
                    numberCell(severity.low),
                ].join(' / '),
                previous: '-',
                change: '-',
            },
        ];
    }, [summary]);

    return (
        <EmptyAwarePanel
            riskData={riskData}
            title="Risk Scores Table"
            isEmpty={!rows.length}
            emptyState={!rows.length ? 'No score data for selected filters' : undefined}
        >
            <RiskDataTable minWidth={720}>
                <Table.Head>
                    <HeadCell>Metric</HeadCell>
                    <HeadCell>Current</HeadCell>
                    <HeadCell>Previous</HeadCell>
                    <HeadCell>Change</HeadCell>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <Table.Row key={row.metric}>
                            <DataCell>{row.metric}</DataCell>
                            <DataCell>{row.current}</DataCell>
                            <DataCell>{row.previous}</DataCell>
                            <DataCell>{row.change}</DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </RiskDataTable>
        </EmptyAwarePanel>
    );
}

/**
 * WHAT: Displays entity-by-category heatmap data as a flat tabular listing.
 * WORKS WITH: useRiskData, EmptyAwarePanel, RiskDataTable, heatmap panel data.
 */
export function EntityCategoryTable() {
    const riskData = useRiskData('heatmap');
    const rows = Array.isArray(riskData.data) ? riskData.data : [];

    return (
        <EmptyAwarePanel
            riskData={riskData}
            title="Entity Category Table"
            isEmpty={!rows.length}
            emptyState={!rows.length ? 'No entity/category data for selected filters' : undefined}
        >
            <RiskDataTable minWidth={620}>
                <Table.Head>
                    <HeadCell>Entity</HeadCell>
                    <HeadCell>Category</HeadCell>
                    <HeadCell>Risk value</HeadCell>
                    <HeadCell>Entity IDs</HeadCell>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <Table.Row key={`${row.rowKey}-${row.colKey}`}>
                            <DataCell>{row.rowKey}</DataCell>
                            <DataCell>{row.colKey}</DataCell>
                            <DataCell>{numberCell(row.value)}</DataCell>
                            <DataCell>{(row.entityIds || []).join(', ') || '-'}</DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </RiskDataTable>
        </EmptyAwarePanel>
    );
}

/**
 * WHAT: Displays domain risk scores as a horizontal bar histogram with share percentages.
 * WORKS WITH: useRiskData, EmptyAwarePanel, numberCell, percentCell, domain breakdown data.
 */
export function DomainDistributionHistogram() {
    const riskData = useRiskData('domain');
    const rows = useMemo(
        () => (Array.isArray(riskData.data) ? riskData.data : []),
        [riskData.data]
    );

    const total = useMemo(
        () => rows.reduce((sum, row) => sum + Number(row.score || 0), 0),
        [rows]
    );
    const maxScore = useMemo(
        () => rows.reduce((max, row) => Math.max(max, Number(row.score || 0)), 0),
        [rows]
    );

    return (
        <EmptyAwarePanel
            riskData={riskData}
            title="Domain Distribution Histogram"
            isEmpty={!rows.length}
            emptyState={!rows.length ? 'No domain data for selected filters' : undefined}
        >
            <div
                aria-label="Domain distribution histogram"
                role="img"
                style={{
                    display: 'grid',
                    gap: 12,
                    minHeight: Math.max(rows.length * 42, 72),
                    padding: '4px 2px 2px',
                }}
            >
                {rows.map((row) => {
                    const score = Number(row.score || 0);
                    const share = total > 0 ? (score / total) * 100 : 0;
                    const widthPct = maxScore > 0 ? (score / maxScore) * 100 : 0;

                    return (
                        <div
                            key={row.domain}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '96px minmax(0, 1fr) 96px',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <div style={{ fontWeight: 600, color: '#364152' }}>
                                {row.domain}
                            </div>
                            <div
                                style={{
                                    height: 24,
                                    background: '#e8edf3',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${widthPct}%`,
                                        height: '100%',
                                        background: '#1565c0',
                                    }}
                                />
                            </div>
                            <div style={{ color: '#4a5a6a', textAlign: 'right' }}>
                                {numberCell(score)} / {percentCell(share)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </EmptyAwarePanel>
    );
}

/**
 * WHAT: Displays calendar heatmap data as a flat day-hour-risk-value table.
 * WORKS WITH: useRiskData, EmptyAwarePanel, RiskDataTable, calendar panel data.
 */
export function CalendarRiskTable() {
    const riskData = useRiskData('calendar');
    const rows = Array.isArray(riskData.data) ? riskData.data : [];

    return (
        <EmptyAwarePanel
            riskData={riskData}
            title="Calendar Risk Table"
            isEmpty={!rows.length}
            emptyState={!rows.length ? 'No calendar data for selected filters' : undefined}
        >
            <RiskDataTable minWidth={420}>
                <Table.Head>
                    <HeadCell>Day</HeadCell>
                    <HeadCell>Hour</HeadCell>
                    <HeadCell>Risk value</HeadCell>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <Table.Row key={`${row.rowKey}-${row.colKey}`}>
                            <DataCell>{row.rowKey}</DataCell>
                            <DataCell>{`${row.colKey}:00`}</DataCell>
                            <DataCell>{numberCell(row.value)}</DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </RiskDataTable>
        </EmptyAwarePanel>
    );
}

/**
 * WHAT: Displays non-zero severity counts from summary data in a two-column table.
 * WORKS WITH: useRiskData, EmptyAwarePanel, RiskDataTable, summary.severityCounts.
 */
export function SeverityBreakdownTable() {
    const riskData = useRiskData('summary');
    const severity = riskData.data?.severityCounts || {};

    const rows = [
        { severity: 'Critical', count: severity.critical },
        { severity: 'High', count: severity.high },
        { severity: 'Medium', count: severity.medium },
        { severity: 'Low', count: severity.low },
    ].filter((row) => Number(row.count || 0) > 0);

    return (
        <EmptyAwarePanel
            riskData={riskData}
            title="Severity Breakdown Table"
            isEmpty={!rows.length}
            emptyState={!rows.length ? 'No severity data for selected filters' : undefined}
        >
            <RiskDataTable minWidth={360}>
                <Table.Head>
                    <HeadCell>Severity</HeadCell>
                    <HeadCell>Count</HeadCell>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <Table.Row key={row.severity}>
                            <DataCell>{row.severity}</DataCell>
                            <DataCell>{numberCell(row.count)}</DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </RiskDataTable>
        </EmptyAwarePanel>
    );
}

/**
 * WHAT: Displays anomaly investigation rows with severity, entity, domain, score, and status columns.
 * WORKS WITH: useRiskData, EmptyAwarePanel, RiskDataTable, anomalies panel data.
 */
export function AnomalyRowsTable() {
    const riskData = useRiskData('anomalies');
    const rows = Array.isArray(riskData.data) ? riskData.data : [];

    return (
        <EmptyAwarePanel
            riskData={riskData}
            title="Anomaly Rows Table"
            isEmpty={!rows.length}
            emptyState={!rows.length ? 'No anomalies match the applied filters' : undefined}
        >
            <RiskDataTable minWidth={760}>
                <Table.Head>
                    <HeadCell>Severity</HeadCell>
                    <HeadCell>Entity</HeadCell>
                    <HeadCell>Domain</HeadCell>
                    <HeadCell>Risk score</HeadCell>
                    <HeadCell>Delta</HeadCell>
                    <HeadCell>Status</HeadCell>
                    <HeadCell>Recurrence</HeadCell>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <Table.Row key={row.id}>
                            <DataCell>{row.severity}</DataCell>
                            <DataCell>{row.entityName}</DataCell>
                            <DataCell>{row.domain}</DataCell>
                            <DataCell>{numberCell(row.riskScore)}</DataCell>
                            <DataCell>{numberCell(row.deltaFromBaseline)}</DataCell>
                            <DataCell>{row.status}</DataCell>
                            <DataCell>{numberCell(row.recurrenceCount)}</DataCell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </RiskDataTable>
        </EmptyAwarePanel>
    );
}
