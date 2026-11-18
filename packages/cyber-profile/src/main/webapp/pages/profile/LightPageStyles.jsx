import React, { useEffect } from 'react';

export const LIGHT_PAGE_BG = '#E8EEF5';
export const LIGHT_FILTER_BG = 'transparent';
export const LIGHT_CARD = '#F7FBFF';
export const LIGHT_INK = '#0A1628';
export const LIGHT_MUTED = '#4A6278';
export const LIGHT_BORDER = '#B7C9DA';
export const LIGHT_ACCENT = '#0B7EA4';
export const LIGHT_SUBMIT = '#00A88A';

const LIGHT_STYLE_ID = 'ss-cyber-profile-light-page';

const LIGHT_CSS = `
.ss-profile-light-page {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  background:
    radial-gradient(900px 360px at 0% 0%, rgba(11, 126, 164, 0.10), transparent 55%),
    ${LIGHT_PAGE_BG};
  color: ${LIGHT_INK};
  padding: 18px 24px 40px;
  font-family: 'IBM Plex Sans', 'Splunk Platform Sans', 'Segoe UI', sans-serif;
}
.ss-profile-light-page__inner {
  max-width: 1280px;
  margin: 0 auto;
}
.ss-profile-light-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 16px;
  padding: 4px 0 18px;
  margin-bottom: 8px;
  background: transparent;
  border: 0;
  border-radius: 0;
}
.ss-profile-light-filter label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  color: ${LIGHT_MUTED};
  margin-bottom: 6px;
}
/* Dark Splunk theme can force white input text — keep typing visible on light fields */
.ss-profile-light-page input,
.ss-profile-light-page textarea,
.ss-profile-light-page [contenteditable="true"],
.ss-profile-light-page .ss-profile-light-filter input,
.ss-profile-light-page .ss-profile-light-filter [role="combobox"],
.ss-profile-light-page .ss-profile-light-filter [role="textbox"] {
  color: ${LIGHT_INK} !important;
  caret-color: ${LIGHT_INK} !important;
  background-color: ${LIGHT_CARD} !important;
  -webkit-text-fill-color: ${LIGHT_INK} !important;
}
.ss-profile-light-page input::placeholder,
.ss-profile-light-page textarea::placeholder {
  color: ${LIGHT_MUTED} !important;
  opacity: 1 !important;
  -webkit-text-fill-color: ${LIGHT_MUTED} !important;
}
.ss-profile-light-page .ss-profile-light-filter button,
.ss-profile-light-page .ss-profile-light-filter [role="button"] {
  color: ${LIGHT_INK} !important;
}
.ss-profile-light-submit button,
.ss-profile-light-submit [role="button"] {
  background: ${LIGHT_SUBMIT} !important;
  border-color: ${LIGHT_SUBMIT} !important;
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
}
.ss-profile-light-card {
  background: ${LIGHT_CARD};
  border: 1px solid ${LIGHT_BORDER};
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.ss-profile-light-card__title {
  padding: 8px 12px;
  background: #EEF2F6;
  font-size: 12px;
  font-weight: 600;
  color: ${LIGHT_ACCENT};
}
.ss-profile-light-card__body {
  padding: 12px 14px 16px;
  min-height: 120px;
}
`;

export function ensureLightPageStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(LIGHT_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = LIGHT_STYLE_ID;
    style.textContent = LIGHT_CSS;
    document.head.appendChild(style);
}

export function LightPage({ children, ...rest }) {
    useEffect(() => {
        ensureLightPageStyles();
        const style = document.createElement('style');
        style.setAttribute('data-profile-light-bg', '1');
        style.textContent = `
            html, body {
                background-color: ${LIGHT_PAGE_BG} !important;
            }
            body > div,
            body > div > div {
                background-color: ${LIGHT_PAGE_BG} !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            style.remove();
        };
    }, []);

    return (
        <div className="ss-profile-light-page" {...rest}>
            <div className="ss-profile-light-page__inner">{children}</div>
        </div>
    );
}

export function LightPageHeader({ title, ...rest }) {
    return (
        <div style={{ marginBottom: 18 }} {...rest}>
            <h1
                style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 700,
                    color: LIGHT_INK,
                    letterSpacing: '-0.02em',
                    fontFamily:
                        "'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
            >
                {title}
            </h1>
        </div>
    );
}
