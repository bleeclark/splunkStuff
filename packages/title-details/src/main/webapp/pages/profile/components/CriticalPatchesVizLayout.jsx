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

function VizKpiCard({ feed, zeroed = false }) {
    const { hostRef, width, height } = useContainerSize({
        minWidth: 100,
        minHeight: 56,
        defaultWidth: 160,
        defaultHeight: 64,
    });
    const last = zeroed ? 0 : feed.last;
    const delta = zeroed ? -100 : feed.delta;
    const display =
        feed.unit === '%' || zeroed
            ? `${last}%`
            : Number.isFinite(last)
              ? feed.last.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : '—';

    return (
        <StudioVizShell height={168}>
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: '#FFFFFF' }}>
                        {display}
                    </span>
                    <span style={{ fontSize: 12, color: MUTED }}>
                        {delta < 0 ? '▼' : '▲'} {delta}
                    </span>
                </div>
                <div ref={hostRef} style={{ width: '100%', height: 52, marginBottom: 6 }}>
                    <LineChart
                        values={zeroed ? [20, 40, 55, 45, 35, 25, 15] : feed.values}
                        times={feed.times}
                        width={width}
                        height={height || 52}
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
                <div style={{ fontSize: 12, color: MUTED }}>{feed.title || 'Assets'}</div>
            </div>
        </StudioVizShell>
    );
}

export default function CriticalPatchesVizLayout({ zeroed = false }) {
    const feeds = [
        ...PROFILE_DRILLDOWNS.map((d) => d.feed),
        ...PROFILE_EXTRA_KPIS,
    ].slice(0, 6);

    return (
        <div
            className="ss-critical-kpi-row"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, minmax(110px, 1fr))',
                gap: 10,
                marginBottom: 16,
            }}
        >
            {feeds.map((feed, index) => (
                <VizKpiCard key={`${feed.title}-${index}`} feed={feed} zeroed={zeroed} />
            ))}
            <style>{`
              @media (max-width: 1100px) {
                .ss-critical-kpi-row {
                  grid-template-columns: repeat(3, minmax(140px, 1fr)) !important;
                }
              }
              @media (max-width: 640px) {
                .ss-critical-kpi-row {
                  grid-template-columns: repeat(2, minmax(140px, 1fr)) !important;
                }
              }
            `}</style>
        </div>
    );
}
