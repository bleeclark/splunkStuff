import React from 'react';

import LineChart from '../../../components/visualizations/LineChart';
import { useContainerSize } from '../../../hooks/useContainerSize';
import { PROFILE_DRILLDOWNS } from '../data/cybersecurityDemoFeeds';
import { MUTED } from '../ProfileStyles';
import StudioVizShell from './StudioVizShell';

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

function LeftKpi({ feed, showSpark = false, zeroed = false }) {
    const { hostRef, width, height } = useContainerSize({
        minWidth: 120,
        minHeight: 48,
        defaultWidth: 320,
        defaultHeight: 56,
    });
    const last = zeroed ? 0 : feed.last;
    const delta = zeroed ? -100 : feed.delta;
    const display =
        feed.unit === '%'
            ? `${last}%`
            : Number.isFinite(last)
              ? String(last)
              : '—';

    return (
        <StudioVizShell height={showSpark ? 158 : 112}>
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color: '#FFFFFF' }}>
                        {display}
                    </span>
                    {showSpark ? (
                        <span style={{ fontSize: 14, color: MUTED }}>
                            {delta < 0 ? '▼' : '▲'} {delta}
                        </span>
                    ) : null}
                </div>
                {showSpark ? (
                    <div ref={hostRef} style={{ width: '100%', height: 44, margin: '4px 0 8px' }}>
                        <LineChart
                            values={zeroed ? [0, 0, 0, 0, 0, 0, 0] : feed.values}
                            times={feed.times}
                            width={width}
                            height={height || 44}
                            fillContainer
                            stroke="rgba(255,255,255,0.9)"
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
                ) : null}
                <div style={{ fontSize: 13, color: MUTED }}>{feed.title}</div>
            </div>
        </StudioVizShell>
    );
}

export default function HighPatchesVizLayout({ zeroed = false }) {
    const assets = PROFILE_DRILLDOWNS.find((d) => d.id === 'assets')?.feed;
    const high = PROFILE_DRILLDOWNS.find((d) => d.id === 'high_patches')?.feed;
    const critical = PROFILE_DRILLDOWNS.find((d) => d.id === 'critical_patches')?.feed;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1.15fr) minmax(240px, 1fr)',
                gap: 12,
                marginBottom: 16,
                alignItems: 'stretch',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assets ? <LeftKpi feed={assets} showSpark zeroed={zeroed} /> : null}
                {high ? <LeftKpi feed={high} zeroed={zeroed} /> : null}
                {critical ? <LeftKpi feed={critical} zeroed={zeroed} /> : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <StudioVizShell height={200} empty emptyAlign="end" />
                <StudioVizShell height={200} empty emptyAlign="end" />
            </div>
        </div>
    );
}
