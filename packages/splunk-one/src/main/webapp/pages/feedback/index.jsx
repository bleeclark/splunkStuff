import React, { useEffect, useState } from 'react';
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
    PANEL_BLUE,
    BORDER,
    MUTED,
} from '../profile/ProfileStyles';

const FEEDBACK_URL = '/app/so_BUI_pickulationts/profile';

function FeedbackForm() {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div
            style={{
                marginTop: 20,
                maxWidth: 560,
                padding: 20,
                borderRadius: 8,
                background: PANEL_BLUE,
                border: `1px solid ${BORDER}`,
            }}
        >
            {submitted ? (
                <Message type="success" appearance="fill">
                    Thanks — your feedback was recorded locally (placeholder).
                </Message>
            ) : null}
            <form onSubmit={handleSubmit}>
                <ControlGroup label="Name" labelPosition="top">
                    <Text
                        value={name}
                        onChange={(e, { value }) => setName(value)}
                        placeholder="Your name"
                    />
                </ControlGroup>
                <ControlGroup label="Feedback" labelPosition="top">
                    <TextArea
                        value={message}
                        onChange={(e, { value }) => setMessage(value)}
                        placeholder="Tell us what you think…"
                        rows={5}
                    />
                </ControlGroup>
                <div className="ss-profile-feedback-actions">
                    <Button appearance="primary" label="Submit" type="submit" />
                    <Button
                        appearance="secondary"
                        label="Back to Profile"
                        to={FEEDBACK_URL}
                    />
                </div>
            </form>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 16, marginBottom: 0 }}>
                Placeholder feedback page. Wire this to a Splunk collection or webhook
                when you are ready.
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
            backgroundColorPopup: '#122a4d',
        };
        layout(<FeedbackPage />, { theme: themed });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
