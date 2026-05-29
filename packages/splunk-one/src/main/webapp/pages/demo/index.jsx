/**
 * Demo page: interactively edit value series and (in the props playground) visualization
 * props. Complements the Start page with a sticky sidebar for dataset textareas.
 */
import React, { useMemo, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';

import { StyledContainer } from '../start/StartStyles';
import NewSingleValue from '../../components/visualizations/NewSingleValue';
import NewSingleValueTwo from '../../components/visualizations/NewSingleValueTwo';
import LineChart from '../../components/visualizations/LineChart';
import PieChart from '../../components/visualizations/PieChart';
import RadialMeter from '../../components/visualizations/RadialMeter';
import {
    totalRequestsFeed,
    latencyRequests,
    tooltipsDemoFeed,
    annotationDemoFeed,
    customTooltipsDemoFeed,
} from '../../components/visualizations/singleValueFeed';

// --- Time axis for feeds that use ISO timestamps (Start-style cards) ---
const TIME_SLOTS = [
    '2024-06-01T00:00:00Z',
    '2024-06-01T01:00:00Z',
    '2024-06-01T02:00:00Z',
    '2024-06-01T03:00:00Z',
    '2024-06-01T04:00:00Z',
    '2024-06-01T05:00:00Z',
];

// --- Parse comma/space-separated numbers from textarea state ---
/* eslint-disable no-unused-vars */
function parseValues(text) {
    return text
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter(Number.isFinite);
}

/* eslint-disable no-unused-vars */
function buildTimes(len) {
    if (len <= 0) {
        return [];
    }
    return Array.from({ length: len }, (_, i) => TIME_SLOTS[i % TIME_SLOTS.length]);
}

/** Labels under the value on spark hover for the custom tooltips demo (a, b, c, …). */
function buildLetterLabels(len) {
    if (len <= 0) {
        return [];
    }
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    return Array.from({ length: len }, (_, i) => letters[i % 26]);
}

/* eslint-disable no-unused-vars */
/** Ensure at least two points for a line; otherwise spark math degrades. */
function coerceSeries(parsed, fallback) {
    if (parsed.length >= 2) {
        return parsed;
    }
    if (parsed.length === 1) {
        return [parsed[0], parsed[0]];
    }
    return fallback;
}

// --- Shared layout (align with Start: 400×105 tile, page chrome #0B1F3B) ---
const heading = { color: '#000000', marginBottom: 12 };
/** Same footprint as Start page panels; top padding only so the inner card sits flush at the bottom. */
const panel = {
    background: '#0B1F3B',
    width: 400,
    height: 105,
    marginBottom: 24,
    color: '#FFFFFF',
    padding: 0,
    boxSizing: 'border-box',
};

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

/** Same categorical demo as custom_viz_gallery pie panel (A–N, values 10…140). */
const DEFAULT_PIE_SLICES = Array.from({ length: 14 }, (_, i) => ({
    label: 'ABCDEFGHIJKLMN'[i],
    value: (i + 1) * 10,
}));

const piePanel = {
    background: '#1B2A41',
    width: 400,
    height: 220,
    marginBottom: 24,
    boxSizing: 'border-box',
};

/** Default props for NewSingleValue; playground overrides some via `playProps`. */
const widgetDemo = {
    width: 400,
    height: 105,
    ...palette,
    sparkStroke: 'rgba(255,255,255,0.95)',
    sparkStrokeWidth: 2,
    sparkHeight: 36,
    sparkBottom: 0,
    sparkLeft: 10,
    sparkRight: 10,
    sparkPadLeft: 4,
    sparkPadRight: 4,
    sparkPadTop: 2,
    sparkPadBottom: 2,
    sparklineLayout: 'overlay',
    options: {},
};

/** Most Start-parity cards: full 0–100 spark domain. */
const totalRequestsWidget = {
    ...widgetDemo,
    sparkMin: 0,
    sparkMax: 100,
};

/** Last card: different spark range and stroke for variety vs. `totalRequestsWidget`. */
const latencyWidget = {
    ...widgetDemo,
    sparkMin: 20,
    sparkMax: 40,
    sparkStrokeWidth: 1.5,
};

// Sticky right column: edit raw series for each card below
const sidebarStyle = {
    flex: '0 0 300px',
    position: 'sticky',
    top: 16,
    alignSelf: 'flex-start',
    background: '#f4f4f6',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    padding: 16,
    maxHeight: 'calc(100vh - 48px)',
    overflowY: 'auto',
};

const fieldLabel = {
    fontSize: 12,
    fontWeight: 600,
    color: '#222',
    marginBottom: 6,
};

function formatInitial(values) {
    return values.join(', ');
}

/* eslint-disable react/prop-types -- small controlled field helper */
/** One labeled textarea for a comma/space-separated value series. */
function DatasetField({ label, value, onChange }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={fieldLabel}>{label}</div>
            <textarea
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                rows={2}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 12,
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                }}
            />
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                Comma- or space-separated numbers (two or more for a line).
            </div>
        </div>
    );
}
/* eslint-enable react/prop-types */

// Playground: form panel beside the live preview card
const playForm = {
    flex: '0 0 300px',
    minWidth: 240,
    background: '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    padding: 16,
    fontSize: 13,
    color: '#222',
};

const playField = {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
};

const playLabel = { fontWeight: 600, fontSize: 12, color: '#333' };

const playInput = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 13,
};

const playRow = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };

const planShell = {
    background: '#ffffff',
    border: '1px solid #d8dde6',
    borderRadius: 8,
    padding: 20,
    marginBottom: 32,
};

const planGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
    gap: 12,
};

const phaseTile = {
    border: '1px solid #d8dde6',
    borderRadius: 6,
    padding: 12,
    background: '#f7f9fc',
};

const vizPlanGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 12,
};

const vizPlanCard = {
    border: '1px solid #d8dde6',
    borderRadius: 6,
    padding: 14,
    background: '#ffffff',
    minHeight: 168,
    boxSizing: 'border-box',
};

const planLabel = {
    display: 'inline-block',
    fontSize: 11,
    lineHeight: '16px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#3c444d',
    background: '#eef2f7',
    borderRadius: 4,
    padding: '1px 6px',
    marginBottom: 8,
};

const planMeta = {
    display: 'grid',
    gridTemplateColumns: '88px 1fr',
    gap: '5px 8px',
    fontSize: 12,
    color: '#3c444d',
};

const buildPhases = [
    {
        phase: '1',
        title: 'Foundation visual grammar',
        scope: 'Reusable shell, Splunk formatter options, mock datasets, drilldown contracts, and accessibility states.',
    },
    {
        phase: '2',
        title: 'Data trust pack',
        scope: 'Freshness, completeness, schema drift, onboarding score, lookup health, ownership, and trust score.',
    },
    {
        phase: '3',
        title: 'Cost and performance pack',
        scope: 'License attribution, noisy sources, cardinality risk, search flame chart, usage intelligence, and forecasts.',
    },
    {
        phase: '4',
        title: 'Security and ops pack',
        scope: 'Detection coverage, alert noise, incident timeline, entity graph, dependencies, SLO burn, and anomaly storylines.',
    },
];

const implementationTracks = [
    'Define SPL contract and expected fields for every visualization.',
    'Build demo fixtures first so each viz is visible before real searches are wired.',
    'Create one reusable panel shell with title, status, owner, drilldown, and empty-state handling.',
    'Promote shared renderers: heatmap grid, timeline, matrix, sankey, graph, scorecard, and forecast band.',
    'Ship each viz with a saved search example, formatter options, screenshot, and dashboard sample.',
];

const visualizationPlan = [
    {
        name: 'Data Freshness Heatmap',
        type: 'Heatmap grid',
        value: 'Find stale indexes, sourcetypes, hosts, and pipelines before consumers report missing data.',
        data: 'dataset, owner, last_event_time, expected_interval, freshness_status',
        first: 'Color-coded grid with drilldown to late sources.',
    },
    {
        name: 'Field Completeness Matrix',
        type: 'Coverage matrix',
        value: 'Show whether critical fields are consistently present across teams and sourcetypes.',
        data: 'dataset, field, present_pct, null_pct, required',
        first: 'Sortable matrix with required-field highlighting.',
    },
    {
        name: 'Index Cost Attribution Dashboard',
        type: 'Cost treemap',
        value: 'Expose license and storage contribution by team, app, sourcetype, and environment.',
        data: 'index, team, sourcetype, gb, cost, trend',
        first: 'Treemap plus trend sparkline per owner.',
    },
    {
        name: 'Schema Drift Timeline',
        type: 'Change timeline',
        value: 'Detect fields that appear, disappear, or explode in cardinality after releases.',
        data: 'dataset, field, change_type, first_seen, last_seen, cardinality',
        first: 'Timeline grouped by dataset and field.',
    },
    {
        name: 'Pipeline Health Sankey Diagram',
        type: 'Sankey flow',
        value: 'Explain and diagnose data movement from source systems through Splunk consumers.',
        data: 'source, forwarder, indexer, index, consumer, event_count, drop_count',
        first: 'Flow diagram with volume and loss thickness.',
    },
    {
        name: 'Alert Noise Map',
        type: 'Noise heatmap',
        value: 'Reduce fatigue by showing noisy, recurring, suppressed, and low-value alerts.',
        data: 'alert, owner, severity, count, false_positive_pct, suppressed',
        first: 'Owner-by-alert heatmap with recurrence trend.',
    },
    {
        name: 'Entity Relationship Graph',
        type: 'Network graph',
        value: 'Reveal relationships between users, hosts, IPs, processes, services, and accounts.',
        data: 'src_entity, dest_entity, relationship, weight, risk',
        first: 'Force graph with type filters and risk coloring.',
    },
    {
        name: 'Service Dependency Impact Map',
        type: 'Dependency graph',
        value: 'Show service dependencies and likely blast radius during incidents.',
        data: 'service, depends_on, health, traffic, error_rate',
        first: 'Directed graph with impacted downstream nodes.',
    },
    {
        name: 'Anomaly Storyline View',
        type: 'Incident storyline',
        value: 'Collect scattered anomalies into one chronological narrative for responders.',
        data: 'time, entity, signal, severity, evidence, search_link',
        first: 'Timeline lanes for metrics, logs, alerts, and deploys.',
    },
    {
        name: 'Log Pattern Evolution View',
        type: 'Pattern clusters',
        value: 'Surface new or changing log patterns after deployments and configuration changes.',
        data: 'pattern_id, example, count, first_seen, trend, service',
        first: 'Cluster list with before-and-after frequency sparkline.',
    },
    {
        name: 'Cardinality Risk Monitor',
        type: 'Risk leaderboard',
        value: 'Catch high-cardinality fields that damage performance and storage efficiency.',
        data: 'index, sourcetype, field, distinct_count, growth_rate, sample_values',
        first: 'Ranked table with growth badges and field examples.',
    },
    {
        name: 'Search Performance Flame Chart',
        type: 'Flame chart',
        value: 'Make slow SPL searches explainable by showing expensive phases and commands.',
        data: 'search_id, command, parent, duration_ms, scanned_events',
        first: 'Nested duration chart with optimization hints.',
    },
    {
        name: 'Dashboard Usage Intelligence Map',
        type: 'Usage matrix',
        value: 'Identify high-value, unused, slow, or broken dashboards across the app estate.',
        data: 'dashboard, owner, views, users, p95_load_ms, panel_errors',
        first: 'Dashboard grid by usage and performance.',
    },
    {
        name: 'Knowledge Object Dependency Graph',
        type: 'Dependency graph',
        value: 'Map saved searches, macros, lookups, tags, dashboards, alerts, and apps before refactors.',
        data: 'object, object_type, depends_on, owner, app, orphaned',
        first: 'Object graph with orphan and owner filters.',
    },
    {
        name: 'CIM Coverage Visualizer',
        type: 'Compliance matrix',
        value: 'Show how well data sources map to expected Splunk CIM data models and fields.',
        data: 'dataset, data_model, field, mapped_pct, acceleration_status',
        first: 'CIM model matrix with gap drilldowns.',
    },
    {
        name: 'Detection Coverage Matrix',
        type: 'ATT&CK matrix',
        value: 'Expose detection coverage against tactics, techniques, data sources, and outcomes.',
        data: 'tactic, technique, detection, data_source, status, outcome',
        first: 'MITRE-style matrix with status and evidence.',
    },
    {
        name: 'Incident Timeline Composer',
        type: 'Curated timeline',
        value: 'Let analysts assemble alerts, events, comments, and search results into a shareable review.',
        data: 'time, event_type, title, entity, analyst_note, source_search',
        first: 'Pinned event timeline with export-ready summary.',
    },
    {
        name: 'Data Onboarding Scorecard',
        type: 'Scorecard',
        value: 'Grade every new source on freshness, parsing, fields, ownership, volume, and CIM readiness.',
        data: 'dataset, dimension, score, owner, blocker, next_action',
        first: 'Weighted scorecard with pass/fail gates.',
    },
    {
        name: 'Environment Drift Comparator',
        type: 'Comparator',
        value: 'Compare prod, stage, dev, and regions to explain environment-only failures.',
        data: 'environment, service, version, config_hash, metric, difference',
        first: 'Side-by-side drift table with severity coloring.',
    },
    {
        name: 'SLO/Error Budget Burn Visualizer',
        type: 'Burn chart',
        value: 'Show error budget health, burn rate, projected exhaustion, and contributing services.',
        data: 'service, slo, window, burn_rate, remaining_budget, contributor',
        first: 'Forecast band with fast-burn and slow-burn overlays.',
    },
    {
        name: 'Lookup Health Explorer',
        type: 'Lookup monitor',
        value: 'Track lookup freshness, row changes, failed joins, key coverage, and consumers.',
        data: 'lookup, owner, last_updated, rows, key_coverage, failed_joins',
        first: 'Lookup inventory with health indicators.',
    },
    {
        name: 'Ownership Coverage Map',
        type: 'Governance map',
        value: 'Find orphaned indexes, alerts, dashboards, reports, lookups, and data sources.',
        data: 'asset, asset_type, owner, team, last_used, criticality',
        first: 'Owner-by-asset matrix with orphan queue.',
    },
    {
        name: 'Event Volume Forecast Cone',
        type: 'Forecast cone',
        value: 'Predict ingest volume and call out spikes or drops before license and capacity surprises.',
        data: 'time, actual_gb, forecast_gb, lower_bound, upper_bound, source',
        first: 'Actual-vs-forecast chart with confidence band.',
    },
    {
        name: 'Noisy Source Fingerprint View',
        type: 'Noise fingerprint',
        value: 'Find repetitive low-value logs and estimate savings from filtering or routing changes.',
        data: 'source, pattern, count, bytes, duplicate_pct, estimated_savings',
        first: 'Fingerprint list with savings and risk notes.',
    },
    {
        name: 'Executive Data Trust Score',
        type: 'Executive score',
        value: 'Condense quality, freshness, ownership, cost, and usage into leadership-ready trust signals.',
        data: 'dataset, trust_score, freshness, completeness, ownership, cost, usage',
        first: 'Ranked trust score with dimension breakdown.',
    },
];

// Splunk page shell: wait for user theme, then mount the React tree.
getUserTheme()
    .then((theme) => {
        function ParagraphHint() {
            return (
                <p style={{ color: '#333', marginBottom: 20, maxWidth: 720 }}>
                    The <strong>Line chart (no overlay)</strong> sample is at the top—then
                    use the <strong>Props playground</strong> to tune colors and spark options;
                    use <strong>Datasets</strong> on the right to edit value series for the
                    cards below.
                </p>
            );
        }

        const DemoPage = () => {
            // String state for each dataset textarea (parsed to numbers in useMemo)
            const [totalStr, setTotalStr] = useState(
                formatInitial(totalRequestsFeed.values)
            );
            const [tooltipsStr, setTooltipsStr] = useState(
                formatInitial(tooltipsDemoFeed.values)
            );
            const [annotationStr, setAnnotationStr] = useState(
                formatInitial(annotationDemoFeed.values)
            );
            const [customStr, setCustomStr] = useState(
                formatInitial(customTooltipsDemoFeed.values)
            );
            const [latencyStr, setLatencyStr] = useState(
                formatInitial(latencyRequests.values)
            );

            // Props playground: drives the first NewSingleValue card only
            const [playProps, setPlayProps] = useState({
                goodColor: '#01417F',
                badColor: '#DFA611',
                textColor: '#FFFFFF',
                sparkStroke: '#ffffff',
                sparkMin: 0,
                sparkMax: 100,
                sparkHeight: 36,
                sparkStrokeWidth: 2,
                invert: false,
                sparklineLayout: 'overlay',
                unit: '%',
            });
            const [playDataStr, setPlayDataStr] = useState('10, 25, 15, 40, 30, 20');

            const setPlay = (patch) => {
                setPlayProps((prev) => ({ ...prev, ...patch }));
            };

            // Feeds: static metadata from `singleValueFeed` + user-edited `values` / `times`
            const feedPlayground = useMemo(() => {
                const v = coerceSeries(
                    parseValues(playDataStr),
                    [10, 25, 15, 40, 30, 20]
                );
                return {
                    subheader: 'Props playground',
                    tooltipText: 'Adjust fields beside this card to see the viz update.',
                    values: v,
                    times: buildTimes(v.length),
                };
            }, [playDataStr]);

            const feedTotal = useMemo(() => {
                const v = coerceSeries(parseValues(totalStr), totalRequestsFeed.values);
                return {
                    ...totalRequestsFeed,
                    values: v,
                    times: buildTimes(v.length),
                };
            }, [totalStr]);

            const feedTooltips = useMemo(() => {
                const v = coerceSeries(parseValues(tooltipsStr), tooltipsDemoFeed.values);
                return {
                    ...tooltipsDemoFeed,
                    values: v,
                    times: buildTimes(v.length),
                };
            }, [tooltipsStr]);

            const feedAnnotation = useMemo(() => {
                const v = coerceSeries(
                    parseValues(annotationStr),
                    annotationDemoFeed.values
                );
                return {
                    ...annotationDemoFeed,
                    values: v,
                    times: buildTimes(v.length),
                };
            }, [annotationStr]);

            const feedCustom = useMemo(() => {
                const v = coerceSeries(
                    parseValues(customStr),
                    customTooltipsDemoFeed.values
                );
                return {
                    ...customTooltipsDemoFeed,
                    values: v,
                    times: buildLetterLabels(v.length),
                };
            }, [customStr]);

            const feedLatency = useMemo(() => {
                const v = coerceSeries(parseValues(latencyStr), latencyRequests.values);
                return {
                    ...latencyRequests,
                    values: v,
                    times: buildTimes(v.length),
                };
            }, [latencyStr]);

            const [radialOpts, setRadialOpts] = useState({
                value: 73,
                maxValue: 100,
                mainColor: '#f7bc38',
                backgroundColor: '#ffffff',
            });

            const [pieOpts, setPieOpts] = useState({
                topN: 5,
                otherLabel: 'Other',
                showPercent: true,
                title: 'Top 5 + Other (demo)',
                background: '#1B2A41',
                textColor: '#FFFFFF',
            });

            const [lineOpts, setLineOpts] = useState({
                multi: false,
                comparison: false,
                chartMin: 0,
                chartMax: 100,
                smoothing: 'none',
                smaWindow: 3,
                maxPoints: 0,
                threshold: false,
                thresholdMin: 20,
                thresholdMax: 80,
                target: 50,
                anomalies: 'none',
                anomalySensitivity: 3,
                drilldown: false,
                showXAxis: false,
            });

            const lineSeries = useMemo(() => {
                const main = {
                    id: 'total',
                    label: 'Total requests',
                    values: feedTotal.values,
                    color: 'rgba(255,255,255,0.95)',
                };
                if (!lineOpts.multi) {
                    return [main];
                }
                const lat = {
                    id: 'latency',
                    label: 'Latency',
                    values: feedLatency.values,
                    color: 'rgba(255,255,255,0.65)',
                };
                return [main, lat];
            }, [feedTotal.values, feedLatency.values, lineOpts.multi]);

            const lineComparison = useMemo(() => {
                if (!lineOpts.comparison) {
                    return null;
                }
                const main = feedTotal.values.map((v, i) => {
                    const base = Number(v);
                    const wiggle = i % 2 === 0 ? -6 : 4;
                    return Number.isFinite(base) ? base + wiggle : base;
                });
                return [
                    {
                        id: 'previous',
                        label: 'Previous period',
                        values: main,
                        color: 'rgba(255,255,255,0.65)',
                    },
                ];
            }, [feedTotal.values, lineOpts.comparison]);

            return (
                <StyledContainer style={{ maxWidth: 1180 }}>
                    <Heading level={1} style={heading}>
                        Demo
                    </Heading>
                    <ParagraphHint />

                    <div style={planShell}>
                        <Heading level={1} style={{ ...heading, marginBottom: 8 }}>
                            Custom Visualization Build Plan
                        </Heading>
                        <p style={{ color: '#333', maxWidth: 900, marginBottom: 18 }}>
                            Roadmap for turning the Splunk data-team visualization ideas
                            into demoable custom visualizations. The plan starts with shared
                            contracts and fixture data, then ships the highest-trust,
                            highest-cost, and highest-response-value visuals in packs.
                        </p>

                        <Heading level={2} style={{ marginTop: 0, marginBottom: 10 }}>
                            Delivery phases
                        </Heading>
                        <div style={{ ...planGrid, marginBottom: 22 }}>
                            {buildPhases.map((phase) => (
                                <div key={phase.phase} style={phaseTile}>
                                    <span style={planLabel}>Phase {phase.phase}</span>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            color: '#111827',
                                            marginBottom: 6,
                                        }}
                                    >
                                        {phase.title}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#3c444d' }}>
                                        {phase.scope}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Heading level={2} style={{ marginTop: 0, marginBottom: 10 }}>
                            Shared implementation tracks
                        </Heading>
                        <ol
                            style={{
                                marginTop: 0,
                                marginBottom: 22,
                                paddingLeft: 20,
                                color: '#333',
                                maxWidth: 960,
                            }}
                        >
                            {implementationTracks.map((track) => (
                                <li key={track} style={{ marginBottom: 6 }}>
                                    {track}
                                </li>
                            ))}
                        </ol>

                        <Heading level={2} style={{ marginTop: 0, marginBottom: 10 }}>
                            Visualization backlog
                        </Heading>
                        <div style={vizPlanGrid}>
                            {visualizationPlan.map((viz, index) => (
                                <div key={viz.name} style={vizPlanCard}>
                                    <span style={planLabel}>
                                        #{String(index + 1).padStart(2, '0')} | {viz.type}
                                    </span>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            fontSize: 15,
                                            color: '#111827',
                                            marginBottom: 8,
                                        }}
                                    >
                                        {viz.name}
                                    </div>
                                    <div style={planMeta}>
                                        <strong>Value</strong>
                                        <span>{viz.value}</span>
                                        <strong>Data</strong>
                                        <code
                                            style={{
                                                fontFamily:
                                                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                            }}
                                        >
                                            {viz.data}
                                        </code>
                                        <strong>First demo</strong>
                                        <span>{viz.first}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <Heading level={1} style={heading}>
                            Radial meter — Splunk tutorial
                        </Heading>
                        <p style={{ color: '#333', maxWidth: 800, marginBottom: 12 }}>
                            Port of the{' '}
                            <a
                                href="https://help.splunk.com/en/splunk-enterprise/developing-views-and-apps-for-splunk-web/9.4/custom-visualizations/build-a-custom-visualization"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Splunk 9.4 radial meter tutorial
                            </a>
                            . Same formatter props as <strong>radial_meter</strong> in the
                            gallery (<code>mainColor</code>, <code>maxValue</code>).
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: 20,
                                flexWrap: 'wrap',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div
                                style={{
                                    ...piePanel,
                                    height: 240,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: radialOpts.backgroundColor,
                                }}
                            >
                                <RadialMeter
                                    value={radialOpts.value}
                                    maxValue={radialOpts.maxValue}
                                    mainColor={radialOpts.mainColor}
                                    backgroundColor={radialOpts.backgroundColor}
                                />
                            </div>
                            <div style={playForm}>
                                <div style={playField}>
                                    <span style={playLabel}>Value (count)</span>
                                    <input
                                        type="number"
                                        value={radialOpts.value}
                                        onChange={(e) =>
                                            setRadialOpts((p) => ({
                                                ...p,
                                                value: Number(e.target.value) || 0,
                                            }))
                                        }
                                        style={playInput}
                                    />
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Maximum dial value</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={radialOpts.maxValue}
                                        onChange={(e) =>
                                            setRadialOpts((p) => ({
                                                ...p,
                                                maxValue: Number(e.target.value) || 100,
                                            }))
                                        }
                                        style={playInput}
                                    />
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Dial color</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={radialOpts.mainColor}
                                            onChange={(e) =>
                                                setRadialOpts((p) => ({
                                                    ...p,
                                                    mainColor: e.target.value,
                                                }))
                                            }
                                            style={{
                                                width: 44,
                                                height: 32,
                                                padding: 0,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={radialOpts.mainColor}
                                            onChange={(e) =>
                                                setRadialOpts((p) => ({
                                                    ...p,
                                                    mainColor: e.target.value,
                                                }))
                                            }
                                            style={{
                                                ...playInput,
                                                flex: 1,
                                                fontFamily: 'monospace',
                                                fontSize: 12,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Background</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={radialOpts.backgroundColor}
                                            onChange={(e) =>
                                                setRadialOpts((p) => ({
                                                    ...p,
                                                    backgroundColor: e.target.value,
                                                }))
                                            }
                                            style={{
                                                width: 44,
                                                height: 32,
                                                padding: 0,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <Heading level={1} style={heading}>
                            Data pie — Top N + Other
                        </Heading>
                        <p style={{ color: '#333', maxWidth: 800, marginBottom: 12 }}>
                            Same behavior as the Splunk{' '}
                            <strong>splunkstuff_pie_chart</strong> custom viz (Top N, Other
                            bucket, legend percents, title, colors). Gallery panel uses the
                            matching search.
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: 20,
                                flexWrap: 'wrap',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div style={piePanel}>
                                <PieChart
                                    slices={DEFAULT_PIE_SLICES}
                                    topN={pieOpts.topN}
                                    otherLabel={pieOpts.otherLabel}
                                    showPercent={pieOpts.showPercent}
                                    title={pieOpts.title}
                                    background={pieOpts.background}
                                    textColor={pieOpts.textColor}
                                    width={400}
                                    height={220}
                                />
                            </div>
                            <div style={playForm}>
                                <div style={{ ...playField, marginBottom: 16 }}>
                                    <span style={playLabel}>Pie chart options</span>
                                    <div style={{ fontSize: 12, color: '#444' }}>
                                        Mirrors formatter: topN, otherLabel, showPercent, title,
                                        background, textColor.
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Top N slices (0 = all)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={pieOpts.topN}
                                        onChange={(e) =>
                                            setPieOpts((p) => ({
                                                ...p,
                                                topN: Number(e.target.value) || 0,
                                            }))
                                        }
                                        style={playInput}
                                    />
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Other bucket label</span>
                                    <input
                                        type="text"
                                        value={pieOpts.otherLabel}
                                        onChange={(e) =>
                                            setPieOpts((p) => ({
                                                ...p,
                                                otherLabel: e.target.value,
                                            }))
                                        }
                                        style={playInput}
                                    />
                                </div>
                                <div style={{ ...playField, marginBottom: 8 }}>
                                    <label
                                        htmlFor="demo-pie-show-percent"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: 12,
                                        }}
                                    >
                                        <input
                                            id="demo-pie-show-percent"
                                            type="checkbox"
                                            checked={pieOpts.showPercent}
                                            onChange={(e) =>
                                                setPieOpts((p) => ({
                                                    ...p,
                                                    showPercent: e.target.checked,
                                                }))
                                            }
                                        />
                                        show percent in legend
                                    </label>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Title</span>
                                    <input
                                        type="text"
                                        value={pieOpts.title}
                                        onChange={(e) =>
                                            setPieOpts((p) => ({ ...p, title: e.target.value }))
                                        }
                                        style={playInput}
                                    />
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Background</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={pieOpts.background}
                                            onChange={(e) =>
                                                setPieOpts((p) => ({
                                                    ...p,
                                                    background: e.target.value,
                                                }))
                                            }
                                            style={{
                                                width: 44,
                                                height: 32,
                                                padding: 0,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={pieOpts.background}
                                            onChange={(e) =>
                                                setPieOpts((p) => ({
                                                    ...p,
                                                    background: e.target.value,
                                                }))
                                            }
                                            style={{
                                                ...playInput,
                                                flex: 1,
                                                fontFamily: 'monospace',
                                                fontSize: 12,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Text color</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={pieOpts.textColor}
                                            onChange={(e) =>
                                                setPieOpts((p) => ({
                                                    ...p,
                                                    textColor: e.target.value,
                                                }))
                                            }
                                            style={{
                                                width: 44,
                                                height: 32,
                                                padding: 0,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={pieOpts.textColor}
                                            onChange={(e) =>
                                                setPieOpts((p) => ({
                                                    ...p,
                                                    textColor: e.target.value,
                                                }))
                                            }
                                            style={{
                                                ...playInput,
                                                flex: 1,
                                                fontFamily: 'monospace',
                                                fontSize: 12,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line chart: same Total requests series as the sidebar "Total requests" textarea */}
                    <div style={{ marginBottom: 32 }}>
                        <Heading level={1} style={heading}>
                            Line chart (no overlay)
                        </Heading>
                        <p style={{ color: '#333', maxWidth: 800, marginBottom: 12 }}>
                            Simple SVG line chart of the{' '}
                            <strong>Total requests</strong> dataset (edit it in{' '}
                            <strong>Datasets</strong> on the right once you scroll to that
                            section)—not Splunk Search&apos;s Visualization menu.
                        </p>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={panel}>
                                <LineChart
                                    series={lineSeries}
                                    comparisonSeries={lineComparison || undefined}
                                    times={feedTotal.times}
                                    width={400}
                                    height={105}
                                    min={lineOpts.chartMin}
                                    max={lineOpts.chartMax}
                                    stroke="rgba(255,255,255,0.95)"
                                    strokeWidth={2}
                                    background="#0B1F3B"
                                    showMajor
                                    goodColor={palette.goodColor}
                                    badColor={palette.badColor}
                                    textColor={palette.textColor}
                                    unit="%"
                                    subheader={feedTotal.subheader}
                                    centerMajor
                                    colorPlacement="full"
                                    smoothing={lineOpts.smoothing}
                                    smaWindow={lineOpts.smaWindow}
                                    maxPoints={lineOpts.maxPoints || undefined}
                                    thresholdMin={lineOpts.threshold ? lineOpts.thresholdMin : undefined}
                                    thresholdMax={lineOpts.threshold ? lineOpts.thresholdMax : undefined}
                                    target={lineOpts.threshold ? lineOpts.target : undefined}
                                    anomalyMode={lineOpts.anomalies}
                                    anomalySensitivity={lineOpts.anomalySensitivity}
                                    drilldown={lineOpts.drilldown}
                                    drilldownQuery="search index=_internal | stats count"
                                    showXAxis={lineOpts.showXAxis}
                                />
                            </div>

                            <div style={playForm}>
                                <div style={{ ...playField, marginBottom: 16 }}>
                                    <span style={playLabel}>Line chart options</span>
                                    <div style={{ fontSize: 12, color: '#444' }}>
                                        Toggle features to demonstrate drilldown, thresholds, overlays, and anomalies.
                                    </div>
                                </div>

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <span style={playLabel}>Y-axis minimum</span>
                                    <input
                                        type="number"
                                        value={lineOpts.chartMin}
                                        onChange={(e) =>
                                            setLineOpts((p) => ({
                                                ...p,
                                                chartMin: Number(e.target.value) || 0,
                                            }))
                                        }
                                        style={playInput}
                                    />
                                </div>
                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <span style={playLabel}>Y-axis maximum</span>
                                    <input
                                        type="number"
                                        value={lineOpts.chartMax}
                                        onChange={(e) =>
                                            setLineOpts((p) => ({
                                                ...p,
                                                chartMax: Number(e.target.value) || 100,
                                            }))
                                        }
                                        style={playInput}
                                    />
                                    <div style={{ fontSize: 11, color: '#666' }}>
                                        LineChart min / max—the fixed scale for drawing the sparkline (not downsampling).
                                    </div>
                                </div>

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <label
                                        htmlFor="demo-line-multi"
                                        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <input
                                            id="demo-line-multi"
                                            type="checkbox"
                                            checked={lineOpts.multi}
                                            onChange={(e) => setLineOpts((p) => ({ ...p, multi: e.target.checked }))}
                                        />
                                        multi-series (adds Latency)
                                    </label>
                                </div>

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <label
                                        htmlFor="demo-line-comparison"
                                        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <input
                                            id="demo-line-comparison"
                                            type="checkbox"
                                            checked={lineOpts.comparison}
                                            onChange={(e) => setLineOpts((p) => ({ ...p, comparison: e.target.checked }))}
                                        />
                                        compare vs previous period (overlay)
                                    </label>
                                </div>

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <span style={playLabel}>smoothing</span>
                                    <select
                                        value={lineOpts.smoothing}
                                        onChange={(e) => setLineOpts((p) => ({ ...p, smoothing: e.target.value }))}
                                        style={playInput}
                                    >
                                        <option value="none">none</option>
                                        <option value="sma">SMA</option>
                                    </select>
                                </div>
                                {lineOpts.smoothing === 'sma' ? (
                                    <div style={{ ...playField, marginBottom: 10 }}>
                                        <span style={playLabel}>SMA window</span>
                                        <input
                                            type="number"
                                            value={lineOpts.smaWindow}
                                            min={1}
                                            max={15}
                                            onChange={(e) =>
                                                setLineOpts((p) => ({ ...p, smaWindow: Number(e.target.value) || 3 }))
                                            }
                                            style={playInput}
                                        />
                                    </div>
                                ) : null}

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <span style={playLabel}>maxPoints (downsample)</span>
                                    <input
                                        type="number"
                                        value={lineOpts.maxPoints}
                                        min={0}
                                        onChange={(e) =>
                                            setLineOpts((p) => ({ ...p, maxPoints: Number(e.target.value) || 0 }))
                                        }
                                        style={playInput}
                                    />
                                    <div style={{ fontSize: 11, color: '#666' }}>0 = no downsampling</div>
                                </div>

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <span style={playLabel}>anomalies</span>
                                    <select
                                        value={lineOpts.anomalies}
                                        onChange={(e) => setLineOpts((p) => ({ ...p, anomalies: e.target.value }))}
                                        style={playInput}
                                    >
                                        <option value="none">none</option>
                                        <option value="deltaZscore">delta z-score</option>
                                        <option value="pctChange">% change</option>
                                    </select>
                                </div>
                                {lineOpts.anomalies !== 'none' ? (
                                    <div style={{ ...playField, marginBottom: 10 }}>
                                        <span style={playLabel}>anomaly sensitivity</span>
                                        <input
                                            type="number"
                                            value={lineOpts.anomalySensitivity}
                                            min={1}
                                            max={10}
                                            onChange={(e) =>
                                                setLineOpts((p) => ({
                                                    ...p,
                                                    anomalySensitivity: Number(e.target.value) || 3,
                                                }))
                                            }
                                            style={playInput}
                                        />
                                    </div>
                                ) : null}

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <label
                                        htmlFor="demo-line-threshold"
                                        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <input
                                            id="demo-line-threshold"
                                            type="checkbox"
                                            checked={lineOpts.threshold}
                                            onChange={(e) => setLineOpts((p) => ({ ...p, threshold: e.target.checked }))}
                                        />
                                        thresholds + target
                                    </label>
                                </div>
                                {lineOpts.threshold ? (
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                        <input
                                            type="number"
                                            value={lineOpts.thresholdMin}
                                            onChange={(e) =>
                                                setLineOpts((p) => ({ ...p, thresholdMin: Number(e.target.value) || 0 }))
                                            }
                                            style={{ ...playInput, width: 90 }}
                                        />
                                        <input
                                            type="number"
                                            value={lineOpts.thresholdMax}
                                            onChange={(e) =>
                                                setLineOpts((p) => ({ ...p, thresholdMax: Number(e.target.value) || 100 }))
                                            }
                                            style={{ ...playInput, width: 90 }}
                                        />
                                        <input
                                            type="number"
                                            value={lineOpts.target}
                                            onChange={(e) =>
                                                setLineOpts((p) => ({ ...p, target: Number(e.target.value) || 50 }))
                                            }
                                            style={{ ...playInput, width: 90 }}
                                        />
                                    </div>
                                ) : null}

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <label
                                        htmlFor="demo-line-show-x-axis"
                                        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <input
                                            id="demo-line-show-x-axis"
                                            type="checkbox"
                                            checked={lineOpts.showXAxis}
                                            onChange={(e) =>
                                                setLineOpts((p) => ({ ...p, showXAxis: e.target.checked }))
                                            }
                                        />
                                        show x-axis ticks
                                    </label>
                                </div>

                                <div style={{ ...playField, marginBottom: 10 }}>
                                    <label
                                        htmlFor="demo-line-drilldown"
                                        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <input
                                            id="demo-line-drilldown"
                                            type="checkbox"
                                            checked={lineOpts.drilldown}
                                            onChange={(e) =>
                                                setLineOpts((p) => ({ ...p, drilldown: e.target.checked }))
                                            }
                                        />
                                        drilldown click (opens Search)
                                    </label>
                                </div>

                                <div style={{ fontSize: 11, color: '#666' }}>
                                    Legend: {lineSeries.map((s) => s.label).filter(Boolean).join(' • ') || '—'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* One card + form: try props without touching the Start-style section */}
                    <div style={{ marginBottom: 32 }}>
                        <Heading level={1} style={heading}>
                            Props playground
                        </Heading>
                        <p style={{ color: '#333', maxWidth: 800, marginBottom: 12 }}>
                            Edit visualization props and the data series; the card updates
                            immediately. Trend background uses good / bad color; spark Y
                            scale uses min / max.
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: 20,
                                flexWrap: 'wrap',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div style={panel}>
                                <NewSingleValue
                                    feed={feedPlayground}
                                    {...widgetDemo}
                                    goodColor={playProps.goodColor}
                                    badColor={playProps.badColor}
                                    textColor={playProps.textColor}
                                    sparkStroke={playProps.sparkStroke}
                                    sparkMin={playProps.sparkMin}
                                    sparkMax={playProps.sparkMax}
                                    sparkHeight={playProps.sparkHeight}
                                    sparkStrokeWidth={playProps.sparkStrokeWidth}
                                    invert={playProps.invert}
                                    sparklineLayout={playProps.sparklineLayout}
                                    options={{ unit: playProps.unit }}
                                />
                            </div>
                            <div style={playForm}>
                                <div style={playField}>
                                    <span style={playLabel}>Series (values)</span>
                                    <textarea
                                        value={playDataStr}
                                        onChange={(e) => setPlayDataStr(e.target.value)}
                                        rows={2}
                                        style={{ ...playInput, fontFamily: 'monospace', fontSize: 12 }}
                                    />
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Unit (major value)</span>
                                    <input
                                        type="text"
                                        value={playProps.unit}
                                        onChange={(e) => setPlay({ unit: e.target.value })}
                                        style={playInput}
                                    />
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Good trend color</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={playProps.goodColor}
                                            onChange={(e) =>
                                                setPlay({ goodColor: e.target.value })
                                            }
                                            style={{ width: 44, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            value={playProps.goodColor}
                                            onChange={(e) => setPlay({ goodColor: e.target.value })}
                                            style={{ ...playInput, flex: 1, minWidth: 100, fontFamily: 'monospace', fontSize: 12 }}
                                        />
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Bad trend color</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={playProps.badColor}
                                            onChange={(e) =>
                                                setPlay({ badColor: e.target.value })
                                            }
                                            style={{ width: 44, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            value={playProps.badColor}
                                            onChange={(e) => setPlay({ badColor: e.target.value })}
                                            style={{ ...playInput, flex: 1, minWidth: 100, fontFamily: 'monospace', fontSize: 12 }}
                                        />
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Text / trend color</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={playProps.textColor}
                                            onChange={(e) =>
                                                setPlay({ textColor: e.target.value })
                                            }
                                            style={{ width: 44, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            value={playProps.textColor}
                                            onChange={(e) => setPlay({ textColor: e.target.value })}
                                            style={{ ...playInput, flex: 1, minWidth: 100, fontFamily: 'monospace', fontSize: 12 }}
                                        />
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>Sparkline stroke</span>
                                    <div style={playRow}>
                                        <input
                                            type="color"
                                            value={playProps.sparkStroke}
                                            onChange={(e) =>
                                                setPlay({ sparkStroke: e.target.value })
                                            }
                                            style={{ width: 44, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            value={playProps.sparkStroke}
                                            onChange={(e) => setPlay({ sparkStroke: e.target.value })}
                                            style={{ ...playInput, flex: 1, minWidth: 100, fontFamily: 'monospace', fontSize: 12 }}
                                        />
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>sparkMin / sparkMax</span>
                                    <div style={playRow}>
                                        <input
                                            type="number"
                                            value={playProps.sparkMin}
                                            onChange={(e) =>
                                                setPlay({
                                                    sparkMin: Number(e.target.value) || 0,
                                                })
                                            }
                                            style={{ ...playInput, width: 100 }}
                                        />
                                        <input
                                            type="number"
                                            value={playProps.sparkMax}
                                            onChange={(e) =>
                                                setPlay({
                                                    sparkMax: Number(e.target.value) || 100,
                                                })
                                            }
                                            style={{ ...playInput, width: 100 }}
                                        />
                                    </div>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>
                                        sparkHeight / sparkStrokeWidth
                                    </span>
                                    <div style={playRow}>
                                        <input
                                            type="number"
                                            value={playProps.sparkHeight}
                                            onChange={(e) =>
                                                setPlay({
                                                    sparkHeight: Math.max(
                                                        8,
                                                        Number(e.target.value) || 36
                                                    ),
                                                })
                                            }
                                            style={{ ...playInput, width: 100 }}
                                        />
                                        <input
                                            type="number"
                                            value={playProps.sparkStrokeWidth}
                                            onChange={(e) =>
                                                setPlay({
                                                    sparkStrokeWidth: Math.max(
                                                        0.5,
                                                        Number(e.target.value) || 2
                                                    ),
                                                })
                                            }
                                            style={{ ...playInput, width: 100 }}
                                        />
                                    </div>
                                </div>
                                <div style={{ ...playField, marginBottom: 8 }}>
                                    <label
                                        htmlFor="demo-play-invert"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: 12,
                                            color: '#333',
                                        }}
                                    >
                                        <input
                                            id="demo-play-invert"
                                            type="checkbox"
                                            checked={playProps.invert}
                                            onChange={(e) =>
                                                setPlay({ invert: e.target.checked })
                                            }
                                        />
                                        invert (swap good / bad trend)
                                    </label>
                                </div>
                                <div style={playField}>
                                    <span style={playLabel}>sparklineLayout</span>
                                    <select
                                        value={playProps.sparklineLayout}
                                        onChange={(e) =>
                                            setPlay({ sparklineLayout: e.target.value })
                                        }
                                        style={playInput}
                                    >
                                        <option value="below">below (under numbers)</option>
                                        <option value="overlay">overlay</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Start-parity cards (left) + dataset editor sidebar (right) */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 28,
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
                            <Heading level={1} style={heading}>
                                Single Value Widget
                            </Heading>
                            <div style={panel}>
                                <NewSingleValue
                                    feed={feedTotal}
                                    {...totalRequestsWidget}
                                />
                            </div>

                            <Heading level={1} style={heading}>
                                Single Value Widget w/ Tooltips
                            </Heading>
                            <div style={panel}>
                                <NewSingleValue
                                    feed={feedTooltips}
                                    {...totalRequestsWidget}
                                />
                            </div>

                            <Heading level={1} style={heading}>
                                Single Value Widget w/ Annotation
                            </Heading>
                            <div style={panel}>
                                <NewSingleValue
                                    feed={feedAnnotation}
                                    {...totalRequestsWidget}
                                />
                            </div>

                            <Heading level={1} style={heading}>
                                Single Value Widget w/ Custom Tooltips
                            </Heading>
                            <div style={panel}>
                                <NewSingleValue
                                    feed={feedCustom}
                                    {...totalRequestsWidget}
                                />
                            </div>

                            <Heading level={1} style={heading}>
                                Latency
                            </Heading>
                            <div style={panel}>
                                <NewSingleValueTwo
                                    feed={feedLatency}
                                    {...latencyWidget}
                                />
                            </div>
                        </div>

                        <div style={sidebarStyle}>
                            <Heading level={2} style={{ marginTop: 0, marginBottom: 16 }}>
                                Datasets (values)
                            </Heading>
                            <DatasetField
                                label="Total requests"
                                value={totalStr}
                                onChange={setTotalStr}
                            />
                            <DatasetField
                                label="Tooltips demo"
                                value={tooltipsStr}
                                onChange={setTooltipsStr}
                            />
                            <DatasetField
                                label="Annotation demo"
                                value={annotationStr}
                                onChange={setAnnotationStr}
                            />
                            <DatasetField
                                label="Custom tooltips demo"
                                value={customStr}
                                onChange={setCustomStr}
                            />
                            <DatasetField
                                label="Latency"
                                value={latencyStr}
                                onChange={setLatencyStr}
                            />
                        </div>
                    </div>
                </StyledContainer>
            );
        };

        layout(<DemoPage />, { theme });
    })
    .catch((e) => {
        // Theme/bootstrap failure: surface without React tree
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
