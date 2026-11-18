import React, { useEffect, useMemo, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Button from '@splunk/react-ui/Button';
import TextArea from '@splunk/react-ui/TextArea';
import Text from '@splunk/react-ui/Text';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Message from '@splunk/react-ui/Message';

import {
    Page,
    PageHeader,
    PAGE_BLUE,
    CARD_NAVY,
    ACCENT_GOLD,
    BORDER,
    MUTED,
} from '../profile/ProfileStyles';
import { DEMO_ASSETS as ASSET_ROWS } from '../profile/data/cybersecurityDemoFeeds';

const PROFILE_URL = '/app/so_cyber_profile/profile';

const fieldStyle = {
    background: PAGE_BLUE,
    color: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.28)',
};

function readPrefillAssets() {
    const params =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const idsParam = params ? String(params.get('assets') || '').trim() : '';
    let fromStorage = [];
    try {
        const raw =
            typeof sessionStorage !== 'undefined'
                ? sessionStorage.getItem('ss_profile_feedback_assets')
                : null;
        if (raw) {
            fromStorage = JSON.parse(raw);
        }
    } catch (e) {
        fromStorage = [];
    }

    if (Array.isArray(fromStorage) && fromStorage.length) {
        return fromStorage;
    }

    if (!idsParam) {
        return [];
    }
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    return ASSET_ROWS.filter((row) => ids.includes(row.id)).map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
    }));
}

function buildPrefillMessage(assets) {
    if (!assets.length) {
        return '';
    }
    const lines = assets.map((a) => `- ${a.name} (${a.id})${a.category ? ` · ${a.category}` : ''}`);
    return [
        'ServiceNow ticket request — feedback on checked profile assets:',
        '',
        ...lines,
        '',
        'Additional notes:',
        '',
    ].join('\n');
}

function FeedbackForm() {
    const prefillAssets = useMemo(() => readPrefillAssets(), []);
    const [name, setName] = useState('');
    const [message, setMessage] = useState(() => buildPrefillMessage(prefillAssets));
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div
            className="ss-feedback-card"
            style={{
                marginTop: 20,
                maxWidth: 560,
                padding: 24,
                borderRadius: 8,
                background: CARD_NAVY,
                border: `1px solid ${BORDER}`,
                color: '#FFFFFF',
            }}
        >
            {prefillAssets.length ? (
                <Message type="info" appearance="fill" style={{ marginBottom: 14 }}>
                    Prefilling from {prefillAssets.length} checked asset
                    {prefillAssets.length === 1 ? '' : 's'} on Profile.
                </Message>
            ) : null}
            {submitted ? (
                <Message type="success" appearance="fill">
                    Thanks — your feedback was recorded locally (placeholder SNOW ticket draft).
                </Message>
            ) : null}
            <form onSubmit={handleSubmit}>
                <ControlGroup label="Name" labelPosition="top">
                    <Text
                        value={name}
                        onChange={(e, { value }) => setName(value)}
                        placeholder="Your name"
                        style={fieldStyle}
                    />
                </ControlGroup>
                <ControlGroup label="Feedback" labelPosition="top">
                    <TextArea
                        value={message}
                        onChange={(e, { value }) => setMessage(value)}
                        placeholder="Tell us what you think…"
                        rows={8}
                        style={fieldStyle}
                    />
                </ControlGroup>
                <div className="ss-profile-feedback-actions">
                    <Button
                        className="ss-feedback-submit"
                        appearance="primary"
                        label="Submit"
                        type="submit"
                        style={{
                            background: ACCENT_GOLD,
                            borderColor: ACCENT_GOLD,
                            color: PAGE_BLUE,
                        }}
                    />
                    <Button appearance="secondary" label="Back to Profile" to={PROFILE_URL} />
                </div>
            </form>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 16, marginBottom: 0 }}>
                Placeholder feedback page (SNOW ticket draft). Wire to a Splunk collection or
                ServiceNow webhook when ready.
            </p>
        </div>
    );
}

function FeedbackPage() {
    useEffect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-feedback-page-bg', '1');
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
            <PageHeader title="Feedback" />
            <FeedbackForm />
        </Page>
    );
}

getUserTheme()
    .then((theme) => {
        const themed = {
            ...theme,
            backgroundColorPage: PAGE_BLUE,
            backgroundColorSection: PAGE_BLUE,
            backgroundColorPopup: CARD_NAVY,
        };
        layout(<FeedbackPage />, { theme: themed });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
