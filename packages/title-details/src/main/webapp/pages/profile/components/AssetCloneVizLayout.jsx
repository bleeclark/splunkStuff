import React from 'react';

import LineChart from '../../../components/visualizations/LineChart';
import { useContainerSize } from '../../../hooks/useContainerSize';
import { PROFILE_DRILLDOWNS, PROFILE_EXTRA_KPIS } from '../data/cybersecurityDemoFeeds';
import { MUTED } from '../ProfileStyles';
import StudioVizShell from './StudioVizShell';

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

/** Small sparkline panel on the Asset Details layout. Works with LineChart and StudioVizShell. */
function MiniSpark({ feed, waiting }) {
    const { hostRef, width, height } = useContainerSize({
        minWidth: 100,
        minHeight: 64,
        defaultWidth: 180,
        defaultHeight: 80,
    });

    return (
        <StudioVizShell height={118} waiting={waiting}>
            <div style={{ width: '100%' }}>
                <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 2, lineHeight: 1.1 }}>
                    {feed.unit === '%' ? `${feed.last}%` : feed.last}
                    <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 8, color: MUTED }}>
                        {feed.delta < 0 ? '▼' : '▲'} {feed.delta}
                    </span>
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{feed.title}</div>
                <div ref={hostRef} style={{ width: '100%', height: 48 }}>
                    <LineChart
                        values={feed.values}
                        times={feed.times}
                        width={width}
                        height={height || 48}
                        fillContainer
                        stroke="rgba(255,255,255,0.92)"
                        strokeWidth={2}
                        background="transparent"
                        showMajor={false}
                        goodColor={palette.goodColor}
                        badColor={palette.badColor}
                        textColor={palette.textColor}
                        colorPlacement="none"
                        padLeft={2}
                        padRight={2}
                        padTop={2}
                        padBottom={2}
                    />
                </div>
            </div>
        </StudioVizShell>
    );
}

/** Large chart panel on the Asset Details layout. Works with LineChart and StudioVizShell. */
function LargePanel({ feed, waiting }) {
    const { hostRef, width, height } = useContainerSize({
        minWidth: 160,
        minHeight: 160,
        defaultWidth: 360,
        defaultHeight: 340,
    });

    return (
        <StudioVizShell height={380} waiting={waiting}>
            <div style={{ width: '100%', height: '100%' }}>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>{feed.title}</div>
                <div ref={hostRef} style={{ width: '100%', height: 300 }}>
                    <LineChart
                        values={feed.values}
                        times={feed.times}
                        width={width}
                        height={height || 300}
                        fillContainer
                        stroke="rgba(255,255,255,0.92)"
                        strokeWidth={2}
                        background="transparent"
                        showMajor
                        goodColor={palette.goodColor}
                        badColor={palette.badColor}
                        textColor={palette.textColor}
                        colorPlacement="none"
                        padLeft={2}
                        padRight={2}
                        padTop={4}
                        padBottom={4}
                    />
                </div>
            </div>
        </StudioVizShell>
    );
}

/** Visualization grid on the Asset Details page. Works with MiniSpark, LargePanel, and demo feeds. */
export default function AssetCloneVizLayout({ waiting = true }) {
    const leftFeeds = PROFILE_DRILLDOWNS.slice(0, 3).map((d) => d.feed);
    const midFeed = PROFILE_DRILLDOWNS[3]?.feed || PROFILE_EXTRA_KPIS[0];
    const rightFeed = PROFILE_EXTRA_KPIS[1] || PROFILE_EXTRA_KPIS[0];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 0.9fr) minmax(240px, 1.35fr) minmax(240px, 1.35fr)',
                gap: 12,
                marginBottom: 16,
                alignItems: 'stretch',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leftFeeds.map((feed) => (
                    <MiniSpark key={feed.title} feed={feed} waiting={waiting} />
                ))}
            </div>
            <LargePanel feed={midFeed} waiting={waiting} />
            <LargePanel feed={rightFeed} waiting={waiting} />
        </div>
    );
}
