import React, { useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import Link from '@splunk/react-ui/Link';

import LineChart from '../../components/visualizations/LineChart';
import { useContainerSize } from '../../hooks/useContainerSize';
import { getDrilldownMetrics } from './data/cybersecurityDemoFeeds';
import {
    LightPage,
    LightPageHeader,
    LIGHT_PAGE_BG,
    LIGHT_CARD,
    LIGHT_INK,
    LIGHT_MUTED,
    LIGHT_ACCENT,
} from './LightPageStyles';

/** Small metric card with a custom line chart. Works with DrilldownApp and LineChart. */
function MetricCard({ feed }) {
    const { hostRef, width, height } = useContainerSize({
        minWidth: 140,
        minHeight: 80,
        defaultWidth: 260,
        defaultHeight: 110,
    });
    const unit = feed.unit || '';
    const display =
        unit === '%'
            ? `${feed.last}%`
            : Number.isFinite(feed.last)
              ? feed.last.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : '—';

    return (
        <div className="ss-profile-light-card">
            <div className="ss-profile-light-card__title">{feed.title}</div>
            <div className="ss-profile-light-card__body">
                <div style={{ fontSize: 26, fontWeight: 700, color: LIGHT_INK, marginBottom: 8 }}>
                    {display}
                </div>
                <div ref={hostRef} style={{ width: '100%', height: 100 }}>
                    <LineChart
                        values={feed.values}
                        times={feed.times}
                        width={width}
                        height={height || 100}
                        fillContainer
                        stroke={LIGHT_ACCENT}
                        strokeWidth={2}
                        background="transparent"
                        showMajor={false}
                        goodColor={LIGHT_ACCENT}
                        badColor="#FFB020"
                        textColor={LIGHT_INK}
                        colorPlacement="none"
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

/** Light drilldown page for endpoints or assets inventory metrics. Works with getDrilldownMetrics and LightPage. */
export function DrilldownApp({ pageId, title }) {
    const [host, setHost] = useState('*');
    const [label1, setLabel1] = useState('');
    const [label2, setLabel2] = useState('');
    const [label3, setLabel3] = useState('any');
    const [filtersVisible, setFiltersVisible] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [applied, setApplied] = useState({
        host: '*',
        label1: '',
        label2: '',
        label3: 'any',
    });

    const metrics = getDrilldownMetrics(pageId);

    const onSubmit = () => {
        setApplied({ host, label1, label2, label3 });
        setSubmitted(true);
    };

    return (
        <LightPage>
            <LightPageHeader title={title} />

            {filtersVisible ? (
                <div className="ss-profile-light-filter">
                    <div style={{ flex: '1 1 160px' }}>
                        <label htmlFor={`host-${pageId}`}>Enter Host Name</label>
                        <Text
                            id={`host-${pageId}`}
                            value={host}
                            onChange={(e, { value }) => {
                                setHost(value);
                                setSubmitted(false);
                            }}
                            style={{
                                width: '100%',
                                background: LIGHT_CARD,
                                color: LIGHT_INK,
                            }}
                        />
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <label htmlFor={`label1-${pageId}`}>Label</label>
                        <Select
                            id={`label1-${pageId}`}
                            value={label1}
                            onChange={(e, { value }) => {
                                setLabel1(value);
                                setSubmitted(false);
                            }}
                            style={{ minWidth: 140, maxWidth: '100%' }}
                        >
                            <Select.Option label="Select…" value="" />
                            <Select.Option label="Region A" value="region_a" />
                            <Select.Option label="Region B" value="region_b" />
                        </Select>
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <label htmlFor={`label2-${pageId}`}>Label</label>
                        <Select
                            id={`label2-${pageId}`}
                            value={label2}
                            onChange={(e, { value }) => {
                                setLabel2(value);
                                setSubmitted(false);
                            }}
                            style={{ minWidth: 140, maxWidth: '100%' }}
                        >
                            <Select.Option label="Select…" value="" />
                            <Select.Option label="Tier 1" value="tier1" />
                            <Select.Option label="Tier 2" value="tier2" />
                        </Select>
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <label htmlFor={`label3-${pageId}`}>Label</label>
                        <Select
                            id={`label3-${pageId}`}
                            value={label3}
                            onChange={(e, { value }) => {
                                setLabel3(value);
                                setSubmitted(false);
                            }}
                            style={{ minWidth: 140, maxWidth: '100%' }}
                        >
                            <Select.Option label="Any" value="any" />
                            <Select.Option label="Prod" value="prod" />
                            <Select.Option label="Non-prod" value="nonprod" />
                        </Select>
                    </div>
                    <span className="ss-profile-light-submit">
                        <Button label="Submit" appearance="primary" onClick={onSubmit} />
                    </span>
                    <Link
                        onClick={(e) => {
                            e.preventDefault();
                            setFiltersVisible(false);
                        }}
                        style={{ alignSelf: 'center', marginLeft: 4, color: LIGHT_ACCENT }}
                    >
                        Hide Filters
                    </Link>
                </div>
            ) : (
                <div style={{ marginBottom: 16 }}>
                    <Link
                        onClick={(e) => {
                            e.preventDefault();
                            setFiltersVisible(true);
                        }}
                    >
                        Show Filters
                    </Link>
                </div>
            )}

            <div style={{ color: LIGHT_MUTED, fontSize: 12, marginBottom: 4 }}>description</div>
            <div
                style={{
                    color: LIGHT_INK,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: submitted ? 16 : 8,
                }}
            >
                Title
            </div>

            {!submitted ? null : (
                <>
                    <p style={{ color: LIGHT_MUTED, fontSize: 13, marginTop: 0, marginBottom: 16 }}>
                        Results for <strong style={{ color: LIGHT_INK }}>{title}</strong>
                        {applied.host ? (
                            <>
                                {' '}
                                · host <code>{applied.host}</code>
                            </>
                        ) : null}
                        {applied.label3 !== 'any' ? (
                            <>
                                {' '}
                                · label <code>{applied.label3}</code>
                            </>
                        ) : null}
                    </p>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 14,
                        }}
                    >
                        {metrics.map((feed) => (
                            <MetricCard key={feed.title} feed={feed} />
                        ))}
                    </div>
                </>
            )}
        </LightPage>
    );
}

/** Mounts a light drilldown page. Works with the endpoints and assets-inventory views. */
export function mountDrilldownPage(pageId, title) {
    getUserTheme()
        .then((theme) => {
            const themed = {
                ...theme,
                fontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontFamilyTitle: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                sansFontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                serifFontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                monoFontFamily: "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                backgroundColorPage: LIGHT_PAGE_BG,
                backgroundColorSection: LIGHT_PAGE_BG,
                backgroundColorPopup: LIGHT_CARD,
                contentColorDefault: LIGHT_INK,
                contentColorActive: LIGHT_INK,
                colorText: LIGHT_INK,
                colorTextDefault: LIGHT_INK,
                interactiveColorText: LIGHT_INK,
                interactiveColorPrimary: LIGHT_ACCENT,
            };
            layout(<DrilldownApp pageId={pageId} title={title} />, { theme: themed });
        })
        .catch((e) => {
            const errorEl = document.createElement('span');
            errorEl.textContent = String(e);
            document.body.appendChild(errorEl);
        });
}
