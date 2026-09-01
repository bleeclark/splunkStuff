import React, { useEffect, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Paragraph from '@splunk/react-ui/Paragraph';
import TabBar from '@splunk/react-ui/TabBar';
import Select from '@splunk/react-ui/Select';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Message from '@splunk/react-ui/Message';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

import LineChart from '../../components/visualizations/LineChart';
import { useContainerSize } from '../../hooks/useContainerSize';

import { FILTER_OPTIONS } from './profileContract';
import { useProfileData } from './hooks/useProfileData';
import {
    Page,
    PageHeader,
    FilterRow,
    FilterCluster,
    FilterLabel,
    ButtonRow,
    CardGrid,
    SummaryCard,
    KpiValue,
    KpiDelta,
    VizCard,
    VizPanel,
    TabPanel,
    PAGE_BLUE,
    profileModalStyle,
} from './ProfileStyles';

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

const VIZ_HEIGHT_DESKTOP = 168;
const VIZ_HEIGHT_NARROW = 140;

const ACTION_2_URL = '/app/so_BUI_pickulationts/feedback';
const ACTION_3_URL = 'https://dev.splunk.com/';

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

function FullBleedChart({ feed, unit = '', panelHeight }) {
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
                unit={unit}
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

function PanelStatus({ loading, error, empty }) {
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <WaitSpinner size="small" />
                <span style={{ color: 'rgba(255,255,255,0.72)' }}>Running Splunk search…</span>
            </div>
        );
    }
    if (error) {
        return (
            <Message type="error" appearance="fill" style={{ marginBottom: 16 }}>
                {String(error.message || error)}
            </Message>
        );
    }
    if (empty) {
        return (
            <Message type="info" appearance="fill" style={{ marginBottom: 16 }}>
                No results for this filter.
            </Message>
        );
    }
    return null;
}

function ProfileTabContent() {
    const [filter, setFilter] = useState('all');
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const vizHeight = useVizPanelHeight();
    const { data, loading, error } = useProfileData('profile', filter);
    const cards = Array.isArray(data?.cards) ? data.cards : [];
    const viz = Array.isArray(data?.viz) ? data.viz : [];

    return (
        <TabPanel>
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
                <ButtonRow>
                    <Button
                        label="Action 1"
                        appearance="secondary"
                        onClick={() => setActionModalOpen(true)}
                    />
                    <Button label="Action 2" appearance="secondary" to={ACTION_2_URL} />
                    <Button
                        label="Action 3"
                        appearance="secondary"
                        to={ACTION_3_URL}
                        openInNewContext
                    />
                </ButtonRow>
            </FilterRow>

            <Modal
                open={actionModalOpen}
                onRequestClose={() => setActionModalOpen(false)}
                style={profileModalStyle}
            >
                <Modal.Header title="Action 1" />
                <Modal.Body>
                    <Paragraph>
                        Placeholder modal for Action 1. Replace this content when you title the
                        button.
                    </Paragraph>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        label="Close"
                        onClick={() => setActionModalOpen(false)}
                    />
                </Modal.Footer>
            </Modal>

            <PanelStatus
                loading={loading}
                error={error}
                empty={!loading && !error && cards.length === 0 && viz.length === 0}
            />

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
                    <VizCard
                        key={`${filter}-viz-${index}`}
                        title={vizFeed.subheader || `card ${index + 1}`}
                    >
                        <VizPanel height={vizHeight}>
                            <FullBleedChart feed={vizFeed} panelHeight={vizHeight} />
                        </VizPanel>
                    </VizCard>
                ))}
            </CardGrid>
        </TabPanel>
    );
}

function MetricTabContent() {
    const [metricModalOpen, setMetricModalOpen] = useState(false);
    const vizHeight = useVizPanelHeight();
    const { data, loading, error } = useProfileData('metric', 'all');
    const metrics = Array.isArray(data?.cards) ? data.cards : [];

    return (
        <TabPanel>
            <FilterRow>
                <FilterLabel>Metrics</FilterLabel>
                <ButtonRow>
                    <Button label="Metric A" appearance="secondary" to={ACTION_2_URL} />
                    <Button
                        label="Metric B"
                        appearance="secondary"
                        onClick={() => setMetricModalOpen(true)}
                    />
                </ButtonRow>
            </FilterRow>

            <Modal
                open={metricModalOpen}
                onRequestClose={() => setMetricModalOpen(false)}
                style={profileModalStyle}
            >
                <Modal.Header title="Metric B" />
                <Modal.Body>
                    <Paragraph>
                        Placeholder modal for Metric B. Replace this content when you title the
                        button.
                    </Paragraph>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        label="Close"
                        onClick={() => setMetricModalOpen(false)}
                    />
                </Modal.Footer>
            </Modal>

            <PanelStatus
                loading={loading}
                error={error}
                empty={!loading && !error && metrics.length === 0}
            />

            <CardGrid columns={2}>
                {metrics.map((item) => (
                    <VizCard key={item.title} title={item.title}>
                        <VizPanel height={vizHeight}>
                            <FullBleedChart
                                feed={item.feed}
                                unit={item.chart ? 'ms' : ''}
                                panelHeight={vizHeight}
                            />
                        </VizPanel>
                    </VizCard>
                ))}
            </CardGrid>
        </TabPanel>
    );
}

function ProfilePage() {
    const [activeTabId, setActiveTabId] = useState('profile');

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
            <TabBar
                activeTabId={activeTabId}
                onChange={(e, { selectedTabId }) => setActiveTabId(selectedTabId)}
            >
                <TabBar.Tab label="Profile" tabId="profile" />
                <TabBar.Tab label="Metric" tabId="metric" />
            </TabBar>
            {activeTabId === 'profile' ? <ProfileTabContent /> : null}
            {activeTabId === 'metric' ? <MetricTabContent /> : null}
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
