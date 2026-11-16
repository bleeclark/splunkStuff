import React, { useEffect } from 'react';

/** Closer to Dashboard Studio navy from reference photos */
export const PAGE_BLUE = '#0A274F';
export const PANEL_BLUE = '#6FA0C8';
export const CARD_NAVY = '#0E3A6B';
export const ACCENT_GOLD = '#DFA611';
export const MUTED = 'rgba(255,255,255,0.78)';
export const BORDER = 'rgba(255,255,255,0.16)';
export const VIZ_HEADER = '#7AA8CC';
export const VIZ_BODY = '#0C2E57';
export const VIZ_BORDER = 'rgba(122, 168, 204, 0.45)';
export const INSTRUCTION_BTN = {
    background: '#FFFFFF',
    color: '#1D2733',
    borderColor: '#FFFFFF',
};

const RESPONSIVE_STYLE_ID = 'ss-profile-responsive';

const RESPONSIVE_CSS = `
.ss-profile-page {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  background: ${PAGE_BLUE};
  color: #FFFFFF;
  padding: 16px 20px 36px;
}
.ss-profile-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}
.ss-profile-kpi-card {
  background: ${VIZ_BODY};
  border: 1px solid ${VIZ_BORDER};
  border-radius: 10px;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 148px;
  display: flex;
  flex-direction: column;
}
.ss-profile-kpi-card__title {
  display: block;
  width: 100%;
  text-align: left;
  background: ${VIZ_HEADER};
  border: 0;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #FFFFFF;
  cursor: pointer;
  font-family: 'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.ss-profile-kpi-card__title:hover,
.ss-profile-kpi-card__title:focus {
  background: #8BB4D4;
  outline: none;
}
.ss-profile-kpi-card__title[disabled] {
  cursor: default;
  opacity: 0.95;
}
.ss-profile-kpi-card__body {
  flex: 1 1 auto;
  padding: 12px 14px 14px;
  background: ${VIZ_BODY};
}
.ss-profile-entity-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 14px;
  margin-bottom: 12px;
  padding-bottom: 0;
  border-bottom: none;
}
.ss-profile-asset-details {
  margin-top: 10px;
  padding: 12px 14px 16px;
  border: 1px solid ${BORDER};
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.16);
}
.ss-profile-asset-details h3 {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
  color: #FFFFFF;
}
.ss-profile-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ss-profile-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #FFFFFF;
  cursor: pointer;
  user-select: none;
}
.ss-profile-radio input {
  accent-color: #5B9BD5;
  width: 14px;
  height: 14px;
  margin: 0;
}
.ss-profile-mode-tabs {
  display: inline-flex;
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 4px;
  overflow: hidden;
}
.ss-profile-mode-tabs button {
  border-radius: 0 !important;
  margin: 0 !important;
}
.ss-profile-results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.ss-profile-results-table th,
.ss-profile-results-table td {
  padding: 8px 10px;
  border-bottom: 1px solid ${BORDER};
  text-align: left;
}
.ss-profile-results-table th {
  color: ${MUTED};
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ss-profile-results-empty {
  padding: 28px 12px;
  text-align: center;
  color: ${MUTED};
  font-size: 13px;
}
.ss-profile-page button,
.ss-profile-page [role="tab"],
.ss-profile-page a {
  color: #FFFFFF !important;
}
/* Must follow the page-wide white text rule so labels stay readable on white pills */
.ss-profile-page .ss-profile-instruction-btn button,
.ss-profile-page .ss-profile-instruction-btn [role="button"],
.ss-profile-page .ss-profile-instruction-btn a {
  background: #FFFFFF !important;
  color: #1D2733 !important;
  border-color: #E8EAED !important;
}
.ss-profile-standard-viz text {
  fill: #FFFFFF;
}
.ss-profile-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  padding: 8px 0 16px;
  background: transparent;
  border: none;
}
.ss-profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.ss-profile-feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}
.ss-feedback-card {
  color: #FFFFFF;
}
.ss-feedback-card label,
.ss-feedback-card [class*="ControlGroup"] {
  color: #FFFFFF !important;
}
.ss-feedback-submit {
  background: ${ACCENT_GOLD} !important;
  border-color: ${ACCENT_GOLD} !important;
  color: ${PAGE_BLUE} !important;
}
.ss-profile-modal {
  max-width: min(480px, calc(100vw - 24px)) !important;
  width: 100%;
  box-sizing: border-box;
}
@media (max-width: 768px) {
  .ss-profile-page {
    padding: 16px 14px 32px;
  }
  .ss-profile-filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .ss-profile-actions {
    width: 100%;
  }
  .ss-profile-actions > * {
    flex: 1 1 auto;
    min-width: 0;
  }
  .ss-profile-feedback-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .ss-profile-page h1 {
    font-size: 22px !important;
  }
}
@media (max-width: 400px) {
  .ss-profile-page {
    padding: 12px 10px 28px;
  }
}
`;

/** Inject shared Profile/Feedback responsive CSS once per document. */
export function ensureProfileResponsiveStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(RESPONSIVE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = RESPONSIVE_STYLE_ID;
    style.textContent = RESPONSIVE_CSS;
    document.head.appendChild(style);
}

export function Page({ children, ...rest }) {
    useEffect(() => {
        ensureProfileResponsiveStyles();
    }, []);

    return (
        <div className="ss-profile-page" {...rest}>
            <div className="ss-profile-page__inner">{children}</div>
        </div>
    );
}

export function PageHeader({ title, ...rest }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 14,
                marginBottom: 20,
            }}
            {...rest}
        >
            <h1
                style={{
                    margin: 0,
                    fontSize: 30,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: '#FFFFFF',
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

export function FilterRow({ children, ...rest }) {
    return (
        <div className="ss-profile-filter-row" {...rest}>
            {children}
        </div>
    );
}

export function FilterCluster({ children, ...rest }) {
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function FilterLabel({ children, ...rest }) {
    return (
        <span
            style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: MUTED,
            }}
            {...rest}
        >
            {children}
        </span>
    );
}

export function ButtonRow({ children, className = '', ...rest }) {
    const classes = ['ss-profile-actions', className].filter(Boolean).join(' ');
    return (
        <div className={classes} {...rest}>
            {children}
        </div>
    );
}

export function CardGrid({ children, columns = 3, ...rest }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${
                    columns === 2 ? 280 : 260
                }px), 1fr))`,
                gap: 20,
                marginBottom: 24,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function SectionHeading({ children, subtitle, tone = 'kpi', ...rest }) {
    const accent = tone === 'viz' ? '#5B9BD5' : '#DFA611';
    return (
        <div style={{ marginBottom: 12, marginTop: tone === 'viz' ? 8 : 0 }} {...rest}>
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: accent,
                }}
            >
                {children}
            </div>
            {subtitle ? (
                <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{subtitle}</div>
            ) : null}
        </div>
    );
}

export function SummaryCard({ title, children, ...rest }) {
    return (
        <div
            style={{
                background: PANEL_BLUE,
                border: `1px solid ${BORDER}`,
                borderLeft: '3px solid #DFA611',
                borderRadius: 8,
                padding: '16px 18px',
                boxSizing: 'border-box',
                minHeight: 104,
            }}
            {...rest}
        >
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PAGE_BLUE,
                    marginBottom: 8,
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}

export function VizCard({ title, subheader, headerBlue = false, href, children, ...rest }) {
    const name = title || subheader;
    const caption = title && subheader ? subheader : null;
    const titleStyle = {
        display: 'block',
                        background: headerBlue ? VIZ_HEADER : 'transparent',
        padding: headerBlue ? '8px 12px' : '4px 4px 8px',
        borderRadius: headerBlue ? 10 : 0,
        fontSize: 14,
        fontWeight: 600,
        color: '#FFFFFF',
        letterSpacing: '-0.01em',
        fontFamily: "'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        lineHeight: 1.3,
        textDecoration: 'none',
        cursor: href ? 'pointer' : 'default',
    };
    return (
        <div
            style={{
                background: 'transparent',
                border: 'none',
                borderRadius: 14,
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}
            {...rest}
        >
            {name ? (
                href ? (
                    <a href={href} title={name} style={titleStyle}>
                        {name}
                    </a>
                ) : (
                    <div title={name} style={titleStyle}>
                        {name}
                    </div>
                )
            ) : null}
            {caption ? (
                <div
                    title={caption}
                    style={{
                        background: 'transparent',
                        fontSize: 12,
                        fontWeight: 400,
                        color: MUTED,
                        padding: headerBlue ? '8px 16px 4px' : '0 4px 8px',
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        fontFamily:
                            "'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                    }}
                >
                    {caption}
                </div>
            ) : null}
            <div style={{ padding: headerBlue ? '8px 12px 12px' : '0 4px 8px' }}>{children}</div>
        </div>
    );
}

export function VizPanel({ children, width = '100%', height = 200, background = 'transparent', ...rest }) {
    return (
        <div
            style={{
                background,
                width,
                height,
                color: '#FFFFFF',
                padding: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
                position: 'relative',
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function KpiValue({ children, ...rest }) {
    return (
        <div
            style={{
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#FFFFFF',
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function KpiDelta({ children, ...rest }) {
    return (
        <div
            style={{
                fontSize: 13,
                color: MUTED,
                marginTop: 6,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function TabPanel({ children, ...rest }) {
    return (
        <div style={{ paddingTop: 18 }} {...rest}>
            {children}
        </div>
    );
}

/** Modal dialog max-width helper for narrow viewports. */
export const profileModalStyle = {
    maxWidth: 'min(480px, calc(100vw - 24px))',
    width: '100%',
    boxSizing: 'border-box',
};
