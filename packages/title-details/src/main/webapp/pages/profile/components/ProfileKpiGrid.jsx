import React from 'react';

import LineChart from '../../../components/visualizations/LineChart';
import { useContainerSize } from '../../../hooks/useContainerSize';
import { PROFILE_DRILLDOWNS, PROFILE_EXTRA_KPIS } from '../data/cybersecurityDemoFeeds';

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

function KpiTile({ feed, href, drillable }) {
    const { hostRef, width, height } = useContainerSize({
        minWidth: 120,
        minHeight: 72,
        defaultWidth: 200,
        defaultHeight: 88,
    });
    const last = feed.last;
    const delta = feed.delta;
    const unit = feed.unit || '';
    const display =
        unit === '%'
            ? `${last}%`
            : Number.isFinite(last)
              ? last.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : '—';

    return (
        <div className="ss-profile-kpi-card">
            {drillable ? (
                <a className="ss-profile-kpi-card__title" href={href}>
                    {feed.title}
                </a>
            ) : (
                <div className="ss-profile-kpi-card__title" disabled>
                    {feed.title}
                </div>
            )}
            <div className="ss-profile-kpi-card__body">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{display}</span>
                    <span style={{ fontSize: 13, opacity: 0.75 }}>
                        {delta < 0 ? '▼' : '▲'} {delta}
                    </span>
                </div>
                <div ref={hostRef} style={{ width: '100%', height: 72 }}>
                    <LineChart
                        values={feed.values}
                        times={feed.times}
                        width={width}
                        height={height || 72}
                        fillContainer
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth={2}
                        background="transparent"
                        showMajor={false}
                        goodColor={palette.goodColor}
                        badColor={palette.badColor}
                        textColor={palette.textColor}
                        colorPlacement="none"
                        showArea
                        showXAxis={false}
                        showYAxis={false}
                        padLeft={2}
                        padRight={2}
                        padTop={2}
                        padBottom={2}
                    />
                </div>
            </div>
        </div>
    );
}

export default function ProfileKpiGrid() {
    const tiles = [
        ...PROFILE_DRILLDOWNS.map((d) => ({ feed: d.feed, href: d.href, drillable: true })),
        ...PROFILE_EXTRA_KPIS.map((feed) => ({ feed, href: '', drillable: false })),
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
                marginBottom: 18,
            }}
        >
            {tiles.map((tile) => (
                <KpiTile
                    key={tile.feed.title}
                    feed={tile.feed}
                    href={tile.href}
                    drillable={tile.drillable}
                />
            ))}
        </div>
    );
}
