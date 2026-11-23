import React, { useEffect, useRef, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Paragraph from '@splunk/react-ui/Paragraph';
import TabBar from '@splunk/react-ui/TabBar';
import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Message from '@splunk/react-ui/Message';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Select from '@splunk/react-ui/Select';

import {
    StandardPieChart,
    StandardLineChart,
    StandardColumnChart,
    StandardSingleValueChart,
} from '../../components/visualizations/StandardSplunkViz';
import { useProfileData } from './hooks/useProfileData';
import { getProfileStandardCharts, getTopChartTools, isProfileDemoMode } from './data/profileDemoFeeds';
import { ENTITY_OPTIONS, PROFILE_DRILLDOWNS } from './data/cybersecurityDemoFeeds';
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
import { VIZ_PANEL_HEIGHT } from '../../components/visualizations/chartModel';

const VIZ_HEIGHT = VIZ_PANEL_HEIGHT;
const FEEDBACK_URL = '/app/so_cyber_profile/feedback';

const TOP_LINKS = {
    assets: PROFILE_DRILLDOWNS.find((d) => d.id === 'assets')?.href,
    high_patches: PROFILE_DRILLDOWNS.find((d) => d.id === 'high_patches')?.href,
    critical_patches: PROFILE_DRILLDOWNS.find((d) => d.id === 'critical_patches')?.href,
};

/** Shows a spinner, search error, or empty message for a profile panel. Works with useProfileData on the Profile and Metric tabs. */
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

/** Renders the entity picker plus Instructions, Feedback, and Release Notes. Works with ProfilePage and the profile modals. */
function ProfileChrome({ entity, onEntityChange }) {
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
    const instructionsRef = useRef(null);
    const releaseRef = useRef(null);

    return (
        <>
            <PageHeader title="Cyber Profile" />
            <div className="ss-profile-entity-bar">
                <div style={{ minWidth: 200, flex: '1 1 240px', maxWidth: 320 }}>
                    <FilterLabel>Select an Entity</FilterLabel>
                    <div style={{ marginTop: 6 }}>
                        <Select
                            value={entity}
                            onChange={(e, { value }) => onEntityChange(value)}
                            style={{ minWidth: 200, maxWidth: '100%' }}
                        >
                            {ENTITY_OPTIONS.map((opt) => (
                                <Select.Option
                                    key={opt.value || 'empty'}
                                    label={opt.label}
                                    value={opt.value}
                                />
                            ))}
                        </Select>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                        marginLeft: 'auto',
                    }}
                >
                    <span className="ss-profile-instruction-btn">
                        <Button
                            elementRef={instructionsRef}
                            label="Instructions"
                            appearance="secondary"
                            onClick={() => setInstructionsOpen(true)}
                        />
                    </span>
                    <Button label="Provide Feedback" appearance="secondary" to={FEEDBACK_URL} />
                    <span className="ss-profile-instruction-btn">
                        <Button
                            elementRef={releaseRef}
                            label="Release Notes"
                            appearance="secondary"
                            onClick={() => setReleaseNotesOpen(true)}
                        />
                    </span>
                </div>
            </div>

            <Modal
                open={instructionsOpen}
                returnFocus={instructionsRef}
                onRequestClose={() => setInstructionsOpen(false)}
                style={profileModalStyle}
            >
                <Modal.Header title="Instructions" />
                <Modal.Body>
                    <Paragraph>
                        Use Profile for pie, line, and single-value charts. Click Assets, High
                        Patches, or Critical Patches titles to open the navy Asset Details pages.
                        Provide Feedback opens the ticket form; Release Notes lists app changes.
                    </Paragraph>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        label="Close"
                        onClick={() => setInstructionsOpen(false)}
                    />
                </Modal.Footer>
            </Modal>

            <Modal
                open={releaseNotesOpen}
                returnFocus={releaseRef}
                onRequestClose={() => setReleaseNotesOpen(false)}
                style={profileModalStyle}
            >
                <Modal.Header title="Release Notes" />
                <Modal.Body>
                    <Paragraph>
                        Cyber Profile app (`so_cyber_profile`): modern SOC-styled remake of Title
                        Details — Profile KPI grid, Documentation Asset Details pages, Assets Inv,
                        Feedback form.
                    </Paragraph>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        label="Close"
                        onClick={() => setReleaseNotesOpen(false)}
                    />
                </Modal.Footer>
            </Modal>
        </>
    );
}

/** Renders the profile chart grid: pies, area, column, and single values. Works with StandardSplunkViz, VizCard, and demo or live feeds. */
function ProfileTabContent({ entity }) {
    const vizHeight = VIZ_HEIGHT;
    const { data, loading, error, status } = useProfileData('profile', entity || 'all');
    const viz = Array.isArray(data?.viz) ? data.viz : [];
    const standard = getProfileStandardCharts(entity || 'all');
    const topTools = getTopChartTools();
    const demoMode = isProfileDemoMode();

    const topPie = {
        title: 'Assets',
        href: TOP_LINKS.assets,
        slices: standard.pie.slices,
    };
    const topLine = {
        title: 'High Patches',
        href: TOP_LINKS.high_patches,
        values: standard.line.values,
        times: standard.line.times,
    };
    const topSingle = {
        title: 'Critical Patches',
        href: TOP_LINKS.critical_patches,
        values: (standard.singles && standard.singles[0] && standard.singles[0].values) || [],
        times: (standard.singles && standard.singles[0] && standard.singles[0].times) || [],
        unit: '%',
    };

    return (
        <TabPanel>
            {demoMode ? (
                <Message type="info" appearance="fill" style={{ marginBottom: 16 }}>
                    Demo data — remove <code>?data=demo</code> for live Splunk REST.
                </Message>
            ) : null}
            {status === 'demo-fallback' ? (
                <Message type="warning" appearance="fill" style={{ marginBottom: 16 }}>
                    Live Splunk search unavailable — showing demo chart data.
                </Message>
            ) : null}

            <PanelStatus
                loading={loading}
                error={error}
                empty={!loading && !error && viz.length === 0 && !standard.pie}
            />

            <CardGrid columns={3}>
                <VizCard headerBlue title={topPie.title} href={topPie.href} tools={topTools.assets}>
                    <VizPanel height={vizHeight} background="transparent">
                        <StandardPieChart slices={topPie.slices} panelHeight={vizHeight} />
                    </VizPanel>
                </VizCard>
                <VizCard headerBlue title={topLine.title} href={topLine.href} tools={topTools.high}>
                    <VizPanel height={vizHeight} background="transparent">
                        <StandardLineChart
                            values={topLine.values}
                            times={topLine.times}
                            panelHeight={vizHeight}
                            xAxisTitle="Time"
                            yAxisTitle={topLine.unit || 'Count'}
                        />
                    </VizPanel>
                </VizCard>
                <VizCard headerBlue title={topSingle.title} href={topSingle.href} tools={topTools.critical}>
                    <VizPanel height={vizHeight} background="transparent">
                        <StandardSingleValueChart
                            values={topSingle.values}
                            times={topSingle.times}
                            unit={topSingle.unit}
                            panelHeight={vizHeight}
                        />
                    </VizPanel>
                </VizCard>
            </CardGrid>

            <CardGrid columns={3}>
                <VizCard headerBlue title={standard.pie.title} tools={standard.pie.tools}>
                    <VizPanel height={vizHeight} background="transparent">
                        <StandardPieChart slices={standard.pie.slices} panelHeight={vizHeight} />
                    </VizPanel>
                </VizCard>
                <VizCard headerBlue title={standard.line.title} tools={standard.line.tools}>
                    <VizPanel height={vizHeight} background="transparent">
                        <StandardLineChart
                            values={standard.line.values}
                            times={standard.line.times}
                            panelHeight={vizHeight}
                            xAxisTitle="Time"
                            yAxisTitle={standard.line.unit || 'Count'}
                        />
                    </VizPanel>
                </VizCard>
                <VizCard headerBlue title={standard.column.title} tools={standard.column.tools}>
                    <VizPanel height={vizHeight} background="transparent">
                        <StandardColumnChart
                            values={standard.column.values}
                            times={standard.column.times}
                            panelHeight={vizHeight}
                            xAxisTitle="Time"
                            yAxisTitle={standard.column.unit || 'Count'}
                        />
                    </VizPanel>
                </VizCard>
            </CardGrid>

            <CardGrid columns={3}>
                {(standard.singles || []).map((feed) => (
                    <VizCard key={feed.title} headerBlue title={feed.title} tools={feed.tools}>
                        <VizPanel height={vizHeight} background="transparent">
                            <StandardSingleValueChart
                                values={feed.values}
                                times={feed.times}
                                unit={
                                    feed.title === 'Service level' || feed.title === 'SLA' ? '%' : ''
                                }
                                panelHeight={vizHeight}
                            />
                        </VizPanel>
                    </VizCard>
                ))}
            </CardGrid>
        </TabPanel>
    );
}

/** Renders the Metric tab as area charts plus Metric A and Metric B actions. Works with useProfileData('metric') and StandardLineChart. */
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
                    <Button label="Metric A" appearance="secondary" to={FEEDBACK_URL} />
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
                        tools={item.feed?.tools}
                    >
                        <VizPanel height={vizHeight} background="transparent">
                            <StandardLineChart
                                values={item.feed?.values}
                                times={item.feed?.times}
                                panelHeight={vizHeight}
                                xAxisTitle="Time"
                                yAxisTitle={item.chart ? 'ms' : 'Count'}
                            />
                        </VizPanel>
                    </VizCard>
                ))}
            </CardGrid>
        </TabPanel>
    );
}

/** Top-level profile page with Profile and Metric tabs. Works with Splunk react-page layout and the profile theme. */
function ProfilePage() {
    const [activeTabId, setActiveTabId] = useState('profile');
    const [entity, setEntity] = useState('');

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
            <TabBar
                activeTabId={activeTabId}
                onChange={(e, { selectedTabId }) => setActiveTabId(selectedTabId)}
            >
                <TabBar.Tab label="Profile" tabId="profile" />
                <TabBar.Tab label="Metric" tabId="metric" />
            </TabBar>
            <ProfileChrome entity={entity} onEntityChange={setEntity} />
            {activeTabId === 'profile' ? <ProfileTabContent entity={entity} /> : null}
            {activeTabId === 'metric' ? <MetricTabContent /> : null}
        </Page>
    );
}

getUserTheme()
    .then((theme) => {
        const themed = {
            ...theme,
            fontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontFamilyTitle: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            sansFontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            serifFontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            monoFontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
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
