import React, { useEffect } from 'react';

export const LIGHT_PAGE_BG = '#F3F4F6';
export const LIGHT_FILTER_BG = '#E8EAED';
export const LIGHT_CARD = '#FFFFFF';
export const LIGHT_INK = '#1D2733';
export const LIGHT_MUTED = '#5C6773';
export const LIGHT_BORDER = '#D5D9DE';
export const LIGHT_ACCENT = '#01417F';

const LIGHT_STYLE_ID = 'ss-profile-light-page';

const LIGHT_CSS = `
.ss-profile-light-page {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  background: ${LIGHT_PAGE_BG};
  color: ${LIGHT_INK};
  padding: 20px 24px 40px;
}
.ss-profile-light-page__inner {
  max-width: 1240px;
  margin: 0 auto;
}
.ss-profile-light-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 14px;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: ${LIGHT_FILTER_BG};
  border: 1px solid ${LIGHT_BORDER};
  border-radius: 8px;
}
.ss-profile-light-filter label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${LIGHT_MUTED};
  margin-bottom: 4px;
}
.ss-profile-light-card {
  background: ${LIGHT_CARD};
  border: 1px solid ${LIGHT_BORDER};
  border-radius: 10px;
  overflow: hidden;
  box-sizing: border-box;
}
.ss-profile-light-card__title {
  padding: 8px 12px;
  background: #DCE6F0;
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
        <div style={{ marginBottom: 16 }} {...rest}>
            <h1
                style={{
                    margin: 0,
                    fontSize: 26,
                    fontWeight: 700,
                    color: LIGHT_INK,
                    letterSpacing: '-0.02em',
                }}
            >
                {title}
            </h1>
        </div>
    );
}
