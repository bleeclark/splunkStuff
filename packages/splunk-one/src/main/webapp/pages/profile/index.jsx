import React, { useEffect, useMemo, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Paragraph from '@splunk/react-ui/Paragraph';
import TabBar from '@splunk/react-ui/TabBar';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Message from '@splunk/react-ui/Message';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

import LineChart from '../../components/visualizations/LineChart';
import { useContainerSize } from '../../hooks/useContainerSize';
import { useProfileData } from './hooks/useProfileData';
import { isProfileDemoMode } from './data/profileDemoFeeds';
import {
    assetFiltersActive,
    filterDemoAssets,
} from './data/cybersecurityDemoFeeds';
import EntityFilterBar from './components/EntityFilterBar';
import ProfileKpiGrid from './components/ProfileKpiGrid';
import AssetDetailsFilters from './components/AssetDetailsFilters';
import AssetResultsTable from './components/AssetResultsTable';
import {
    Page,
    PageHeader,
    FilterRow,
    FilterLabel,
    ButtonRow,
    CardGrid,
    VizCard,
    VizPanel,
    TabPanel,
    PAGE_BLUE,
    PANEL_BLUE,
    profileModalStyle,
} from './ProfileStyles';

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

const VIZ_HEIGHT = 200;
const ACTION_2_URL = '/app/so_BUI_pickulationts/feedback';
const ACTION_3_URL = 'https://dev.splunk.com/';

const DEFAULT_ASSET_FILTERS = {
    facing: 'all',
    hosts: 'all',
    devices: 'all',
    category: 'all',
    search: '',
};

function FullBleedChart({ feed, unit = '', panelHeight }) {
    const { hostRef, width: chartWidth, height: chartHeight } = useContainerSize({
        minWidth: 160,
        minHeight: 96,
        defaultWidth: 420,
        defaultHeight: panelHeight || VIZ_HEIGHT,
    });

    return (
        <div ref={hostRef} style={{ width: '100%', height: '100%' }}>
            <LineChart
                values={feed.values}
                times={feed.times}
                width={chartWidth}
                height={chartHeight || panelHeight || VIZ_HEIGHT}
                fillContainer
                stroke="rgba(255,255,255,0.88)"
                strokeWidth={2}
                background="transparent"
                showMajor
                goodColor={palette.goodColor}
                badColor={palette.badColor}
                textColor={palette.textColor}
                unit={unit}
                centerMajor={false}
                colorPlacement="none"
                padLeft={2}
                padRight={2}
                padTop={4}
                padBottom={4}
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
    const [entity, setEntity] = useState('');
    const [filters, setFilters] = useState(DEFAULT_ASSET_FILTERS);
    const [selectedIds, setSelectedIds] = useState([]);

    const entitySelected = Boolean(entity);

    const filterState = useMemo(
        () => ({
            ...filters,
            entity,
            mode: 'assets',
        }),
        [filters, entity]
    );

    const tableActive = entitySelected && assetFiltersActive(filters);
    const rows = useMemo(
        () => (tableActive ? filterDemoAssets(filterState) : []),
        [tableActive, filterState]
    );

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => rows.some((r) => r.id === id)));
    }, [rows]);

    useEffect(() => {
        if (!entitySelected) {
            setSelectedIds([]);
            setFilters(DEFAULT_ASSET_FILTERS);
        }
    }, [entitySelected]);

    const toggleRow = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = (on) => {
        setSelectedIds(on ? rows.map((r) => r.id) : []);
    };

    return (
        <TabPanel>
            <EntityFilterBar entity={entity} onEntityChange={setEntity} />

            {!entitySelected ? (
                <Message type="info" appearance="fill" style={{ marginBottom: 14 }}>
                    Pick an entity to load Profile KPIs and Asset Details.
                </Message>
            ) : (
                <>
                    {isProfileDemoMode() ? (
                        <Message type="info" appearance="fill" style={{ marginBottom: 14 }}>
                            Demo data — add <code>?data=demo</code> intentionally; remove for live REST
                            where wired.
                        </Message>
                    ) : null}

                    <ProfileKpiGrid />

                    <AssetDetailsFilters filters={filters} onChange={setFilters} />

                    <AssetResultsTable
                        active={tableActive}
                        rows={rows}
                        selectedIds={selectedIds}
                        onToggleRow={toggleRow}
                        onToggleAll={toggleAll}
                    />
                </>
            )}
        </TabPanel>
    );
}

function MetricTabContent() {
    const [metricModalOpen, setMetricModalOpen] = useState(false);
    const vizHeight = VIZ_HEIGHT;
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
                    <VizCard
                        key={item.title}
                        title={item.title}
                        subheader={item.feed?.subheader}
                    >
                        <VizPanel height={vizHeight} background="transparent">
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
            <PageHeader title="Title Details" />
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
            backgroundColorPopup: PANEL_BLUE,
            contentColorDefault: '#FFFFFF',
            contentColorActive: '#FFFFFF',
            colorText: '#FFFFFF',
            colorTextDefault: '#FFFFFF',
            interactiveColorText: '#FFFFFF',
        };
        layout(<ProfilePage />, { theme: themed });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
