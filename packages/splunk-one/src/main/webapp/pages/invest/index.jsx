import React, { useEffect } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Paragraph from '@splunk/react-ui/Paragraph';
import Button from '@splunk/react-ui/Button';

import { Page, PageHeader, PAGE_BLUE } from '../profile/ProfileStyles';

function InvestPage() {
    useEffect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-invest-page-bg', '1');
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
            <PageHeader title="Invest" />
            <Paragraph style={{ color: 'rgba(255,255,255,0.88)', maxWidth: 560 }}>
                Invest landing page — replace this content with your product flow, links, or
                embedded dashboards.
            </Paragraph>
            <div style={{ marginTop: 16 }}>
                <Button
                    label="Back to Profile"
                    appearance="secondary"
                    to="/app/so_BUI_pickulationts/profile"
                />
            </div>
        </Page>
    );
}

getUserTheme()
    .then((theme) => {
        const themed = {
            ...theme,
            backgroundColorPage: PAGE_BLUE,
            backgroundColorSection: PAGE_BLUE,
            backgroundColorPopup: '#73A4CF',
        };
        layout(<InvestPage />, { theme: themed });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
