/**
 * PROF-1 Profile page — Studio → React cutover scaffold.
 *
 * In scope (TDD PROF-1):
 * - Boot with @splunk/react-page/18 + getUserTheme()
 * - Navy page shell + header
 * - Filter Select (All / Region A / Region B)
 * - Embedded original Profile content: KPI summary cards + viz panels
 *
 * Out of scope (follow-on stories): Metric tab, action modals/nav, live Splunk REST.
 */
import React, { useEffect, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Select from '@splunk/react-ui/Select';

import LineChart from '../../components/visualizations/LineChart';
import { useContainerSize } from '../../hooks/useContainerSize';

import { FILTER_OPTIONS, getProfileFeed } from './profileFeeds';
import {
    Page,
    PageHeader,
    FilterRow,
    FilterCluster,
    FilterLabel,
    CardGrid,
    SummaryCard,
    KpiValue,
    KpiDelta,
    VizCard,
    VizPanel,
    PAGE_BLUE,
} from './ProfileStyles';

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

const VIZ_HEIGHT_DESKTOP = 168;
const VIZ_HEIGHT_NARROW = 140;

function useVizPanelHeight() {
    const [height, setHeight] = useState(
        typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
            ? VIZ_HEIGHT_NARROW
            : VIZ_HEIGHT_DESKTOP
    );

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        const mq = window.matchMedia('(max-width: 768px)');
        const apply = () => setHeight(mq.matches ? VIZ_HEIGHT_NARROW : VIZ_HEIGHT_DESKTOP);
        apply();
        if (mq.addEventListener) {
            mq.addEventListener('change', apply);
            return () => mq.removeEventListener('change', apply);
        }
        mq.addListener(apply);
        return () => mq.removeListener(apply);
    }, []);

    return height;
}

function FullBleedChart({ feed, panelHeight }) {
    const { hostRef, width: chartWidth, height: chartHeight } = useContainerSize({
        minWidth: 160,
        minHeight: 96,
        defaultWidth: 420,
        defaultHeight: panelHeight || VIZ_HEIGHT_DESKTOP,
    });

    return (
        <div ref={hostRef} style={{ width: '100%', height: '100%' }}>
            <LineChart
                values={feed.values}
                times={feed.times}
                width={chartWidth}
                height={chartHeight || panelHeight || VIZ_HEIGHT_DESKTOP}
                fillContainer
                stroke="rgba(255,255,255,0.95)"
                strokeWidth={2}
                background={PAGE_BLUE}
                showMajor
                goodColor={palette.goodColor}
                badColor={palette.badColor}
                textColor={palette.textColor}
                unit=""
                subheader={feed.subheader}
                centerMajor
                colorPlacement="full"
                padLeft={8}
                padRight={8}
                padTop={4}
                padBottom={10}
            />
        </div>
    );
}

function ProfileContent() {
    const [filter, setFilter] = useState('all');
    const vizHeight = useVizPanelHeight();
    const data = getProfileFeed(filter);
    const cards = Array.isArray(data.cards) ? data.cards : [];
    const viz = Array.isArray(data.viz) ? data.viz : [];

    return (
        <>
            <FilterRow>
                <FilterCluster>
                    <FilterLabel>Filter</FilterLabel>
                    <Select
                        value={filter}
                        onChange={(e, { value }) => setFilter(value)}
                        style={{ minWidth: 160, maxWidth: '100%' }}
                    >
                        {FILTER_OPTIONS.map((opt) => (
                            <Select.Option
                                key={opt.value}
                                label={opt.label}
                                value={opt.value}
                            />
                        ))}
                    </Select>
                </FilterCluster>
            </FilterRow>

            <CardGrid columns={3}>
                {cards.map((card) => (
                    <SummaryCard key={`${filter}-${card.title}`} title={card.title}>
                        <KpiValue>{card.value}</KpiValue>
                        <KpiDelta>{card.delta}</KpiDelta>
                    </SummaryCard>
                ))}
            </CardGrid>

            <CardGrid columns={3}>
                {viz.map((vizFeed, index) => (
                    <VizCard key={`${filter}-viz-${index}`} title={vizFeed.subheader || `card ${index + 1}`}>
                        <VizPanel height={vizHeight}>
                            <FullBleedChart feed={vizFeed} panelHeight={vizHeight} />
                        </VizPanel>
                    </VizCard>
                ))}
            </CardGrid>
        </>
    );
}

function ProfilePage() {
    useEffect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-profile-page-bg', '1');
        style.textContent = `
            html, body {
                background-color: ${PAGE_BLUE} !important;
            }
            body > div,
            body > div > div {
                background-color: ${PAGE_BLUE} !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            style.remove();
        };
    }, []);

    return (
        <Page>
            <PageHeader title="Profile" />
            <ProfileContent />
        </Page>
    );
}

getUserTheme()
    .then((theme) => {
        const themed = {
            ...theme,
            backgroundColorPage: PAGE_BLUE,
            backgroundColorSection: PAGE_BLUE,
            backgroundColorPopup: '#122a4d',
        };
        layout(<ProfilePage />, { theme: themed });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
