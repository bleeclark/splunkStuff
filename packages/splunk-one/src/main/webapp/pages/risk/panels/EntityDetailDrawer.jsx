/**
 * Expandable entity detail card with score breakdown, timeline chart, and contributing signals.
 */
import React from 'react';

import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Button from '@splunk/react-ui/Button';

import { useRiskData } from '../hooks/useRiskData.js';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';
import LineChart from '../../../components/visualizations/LineChart';

/**
 * WHAT: Renders a detailed entity inspection card when entityFocus is set in dashboard filters.
 * WORKS WITH: useDashboardFilters, useRiskData, LineChart, Splunk Card, setEntityFocus.
 */
export default function EntityDetailDrawer() {
    const { appliedFilters, setEntityFocus } = useDashboardFilters();
    const entityId = appliedFilters.entityFocus;
    const { data: entity, loading } = useRiskData('entityDetail');

    if (!entityId) {
        return null;
    }

    const timeline = entity?.timeline || [];
    const values = timeline.map((p) => p.riskScore);
    const times = timeline.map((p) => p.timestamp);

    return (
        <Card style={{ marginBottom: 24, border: '2px solid #01417F' }}>
            <Card.Header>
                <Heading level={3} style={{ margin: 0 }}>
                    Entity detail — {entityId}
                </Heading>
                <Button
                    appearance="flat"
                    label="Close"
                    onClick={() => setEntityFocus(null)}
                />
            </Card.Header>
            <Card.Body>
                {loading ? <div>Loading entity…</div> : null}
                {!loading && !entity ? (
                    <div>No detail found for {entityId}</div>
                ) : null}
                {entity ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <p>
                                <strong>Risk score:</strong> {entity.currentRiskScore} / threshold{' '}
                                {entity.threshold}
                            </p>
                            <p>
                                <strong>Owner:</strong> {entity.owner} · <strong>Domain:</strong>{' '}
                                {entity.domain}
                            </p>
                            <Heading level={4}>Score breakdown</Heading>
                            <ul>
                                {entity.scoreByCategory.map((s) => (
                                    <li key={s.category}>
                                        {s.category}: {s.score}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <Heading level={4}>Timeline</Heading>
                            <div style={{ background: '#0B1F3B', padding: 8 }}>
                                <LineChart
                                    values={values}
                                    times={times}
                                    width={400}
                                    height={120}
                                    min={600}
                                    max={950}
                                    stroke="#fff"
                                    background="#0B1F3B"
                                    textColor="#fff"
                                    showMajor={false}
                                />
                            </div>
                            <Heading level={4} style={{ marginTop: 16 }}>
                                Contributing signals
                            </Heading>
                            <table style={{ width: '100%', fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th align="left">Signal</th>
                                        <th align="left">Contribution</th>
                                        <th align="left">Severity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entity.signals.map((sig) => (
                                        <tr key={sig.signalId}>
                                            <td>{sig.name}</td>
                                            <td>{sig.contribution}</td>
                                            <td>{sig.severity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </Card.Body>
        </Card>
    );
}
