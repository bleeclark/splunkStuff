import React, { useMemo, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';

import { StyledContainer } from '../start/StartStyles';
import NewSingleValue from '../../components/visualizations/NewSingleValue';
import NewSingleValueTwo from '../../components/visualizations/NewSingleValueTwo';
import {
    totalRequestsFeed,
    latencyRequests,
    tooltipsDemoFeed,
    annotationDemoFeed,
    customTooltipsDemoFeed,
} from '../../components/visualizations/singleValueFeed';

const TIME_SLOTS = [
    '2024-06-01T00:00:00Z',
    '2024-06-01T01:00:00Z',
    '2024-06-01T02:00:00Z',
    '2024-06-01T03:00:00Z',
    '2024-06-01T04:00:00Z',
    '2024-06-01T05:00:00Z',
];

function parseValues(text) {
    return text
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter(Number.isFinite);
}

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

function coerceSeries(parsed, fallback) {
    if (parsed.length >= 2) {
        return parsed;
    }
    if (parsed.length === 1) {
        return [parsed[0], parsed[0]];
    }
    return fallback;
}

const heading = { color: '#000000', marginBottom: 12 };
/** Same footprint as Start page panels; top padding only so the inner card sits flush at the bottom. */
const panel = {
    background: '#0B1F3B',
    width: 376,
    marginBottom: 24,
    color: '#FFFFFF',
    padding: '8px 0 0',
    boxSizing: 'border-box',
};

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

const widgetDemo = {
    width: 376,
    height: 148,
    ...palette,
    sparkStroke: 'rgba(255,255,255,0.95)',
    sparkStrokeWidth: 2,
    sparkPadLeft: 10,
    sparkPadRight: 10,
    sparkPadTop: 6,
    sparkPadBottom: 4,
    sparkHeight: 40,
    sparkBottom: 0,
    sparklineLayout: 'below',
    options: {},
};

const totalRequestsWidget = {
    ...widgetDemo,
    sparkMin: 0,
    sparkMax: 100,
};

const latencyWidget = {
    ...widgetDemo,
    sparkMin: 20,
    sparkMax: 40,
    sparkStrokeWidth: 1.5,
};

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

getUserTheme()
    .then((theme) => {
        function ParagraphHint() {
            return (
                <p style={{ color: '#333', marginBottom: 20, maxWidth: 720 }}>
                    Sparklines render <strong>below</strong> the major value. Edit numbers
                    on the right to update each card.
                </p>
            );
        }

        const DemoPage = () => {
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

            return (
                <StyledContainer style={{ maxWidth: 1180 }}>
                    <Heading level={1} style={heading}>
                        Demo
                    </Heading>
                    <ParagraphHint />

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
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
