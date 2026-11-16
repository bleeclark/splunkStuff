import React, { useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';

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

const PROFILE_URL = '/app/so_BUI_pickulationts/profile';
const FEEDBACK_URL = '/app/so_BUI_pickulationts/feedback';

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
                        badColor="#DFA611"
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

export function DrilldownApp({ pageId, title }) {
    const [host, setHost] = useState('*');
    const [label, setLabel] = useState('any');
    const metrics = getDrilldownMetrics(pageId);

    return (
        <LightPage>
            <LightPageHeader title={title} />
            <div className="ss-profile-light-filter">
                <div style={{ flex: '1 1 160px' }}>
                    <label htmlFor={`host-${pageId}`}>Enter Host Name</label>
                    <Text
                        id={`host-${pageId}`}
                        value={host}
                        onChange={(e, { value }) => setHost(value)}
                        style={{ width: '100%', background: LIGHT_CARD }}
                    />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                    <label htmlFor={`label-${pageId}`}>Label</label>
                    <Select
                        id={`label-${pageId}`}
                        value={label}
                        onChange={(e, { value }) => setLabel(value)}
                        style={{ minWidth: 140, maxWidth: '100%' }}
                    >
                        <Select.Option label="Any" value="any" />
                        <Select.Option label="Prod" value="prod" />
                        <Select.Option label="Non-prod" value="nonprod" />
                    </Select>
                </div>
                <Button label="Submit" appearance="primary" onClick={() => {}} />
                <Button label="Back to Profile" appearance="secondary" to={PROFILE_URL} />
                <Button label="Feedback" appearance="secondary" to={FEEDBACK_URL} />
            </div>

            <p style={{ color: LIGHT_MUTED, fontSize: 13, marginTop: 0, marginBottom: 16 }}>
                Associated metrics for <strong style={{ color: LIGHT_INK }}>{title}</strong>
                {host && host !== '*' ? (
                    <>
                        {' '}
                        · host filter <code>{host}</code>
                    </>
                ) : null}
                {label !== 'any' ? (
                    <>
                        {' '}
                        · label <code>{label}</code>
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
        </LightPage>
    );
}

export function mountDrilldownPage(pageId, title) {
    getUserTheme()
        .then((theme) => {
            const themed = {
                ...theme,
                backgroundColorPage: LIGHT_PAGE_BG,
                backgroundColorSection: LIGHT_PAGE_BG,
                backgroundColorPopup: LIGHT_CARD,
                contentColorDefault: LIGHT_INK,
                colorText: LIGHT_INK,
            };
            layout(<DrilldownApp pageId={pageId} title={title} />, { theme: themed });
        })
        .catch((e) => {
            const errorEl = document.createElement('span');
            errorEl.textContent = String(e);
            document.body.appendChild(errorEl);
        });
}
