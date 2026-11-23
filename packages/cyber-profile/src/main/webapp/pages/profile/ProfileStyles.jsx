import React, { useEffect } from 'react';
import VizTools from './components/VizTools';
import { SPLUNK_SANS } from '../../components/visualizations/chartModel';

export { SPLUNK_SANS };

/** Modern SOC / cybersecurity ops surface */
export const PAGE_BLUE = '#050B14';
export const PANEL_BLUE = '#0E1A2B';
export const CARD_NAVY = '#0A1524';
export const ACCENT_GOLD = '#3DDCFF';
export const ACCENT_TEAL = '#00D4AA';
export const MUTED = 'rgba(186, 210, 230, 0.72)';
export const BORDER = 'rgba(61, 220, 255, 0.18)';
export const VIZ_HEADER = '#102033';
export const VIZ_BODY = '#07111F';
export const VIZ_BORDER = 'rgba(61, 220, 255, 0.28)';
export const INSTRUCTION_BTN = {
    background: 'rgba(61, 220, 255, 0.12)',
    color: '#E8F7FF',
    borderColor: 'rgba(61, 220, 255, 0.45)',
};

const RESPONSIVE_STYLE_ID = 'ss-cyber-profile-responsive';

const RESPONSIVE_CSS = `
.ss-profile-page {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  color: #E8F7FF;
  padding: 18px 22px 40px;
  background:
    radial-gradient(1200px 500px at 12% -10%, rgba(61, 220, 255, 0.14), transparent 55%),
    radial-gradient(900px 420px at 92% 0%, rgba(0, 212, 170, 0.10), transparent 50%),
    linear-gradient(180deg, #07111F 0%, ${PAGE_BLUE} 42%, #03070D 100%);
  font-family: ${SPLUNK_SANS};
}
.ss-profile-page button,
.ss-profile-page input,
.ss-profile-page select,
.ss-profile-page textarea,
.ss-profile-page code {
  font-family: inherit;
}
.ss-profile-standard-viz,
.ss-profile-standard-viz * {
  font-family: ${SPLUNK_SANS} !important;
}
.ss-profile-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}
.ss-profile-kpi-card {
  background: ${VIZ_BODY};
  border: 1px solid ${VIZ_BORDER};
  border-radius: 6px;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 148px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 12px 28px rgba(0, 0, 0, 0.28);
}
.ss-profile-kpi-card__title {
  display: block;
  width: 100%;
  text-align: left;
  background: linear-gradient(90deg, #0F2438 0%, #12304A 100%);
  border: 0;
  border-bottom: 1px solid ${VIZ_BORDER};
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${ACCENT_GOLD};
  cursor: pointer;
  font-family: ${SPLUNK_SANS};
}
.ss-profile-kpi-card__title:hover,
.ss-profile-kpi-card__title:focus {
  background: linear-gradient(90deg, #14304A 0%, #18405F 100%);
  color: #FFFFFF;
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
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid ${BORDER};
  border-radius: 6px;
  background: rgba(8, 18, 32, 0.72);
  backdrop-filter: blur(8px);
}
.ss-profile-asset-details {
  margin-top: 10px;
  padding: 14px 16px 18px;
  border: 1px solid ${BORDER};
  border-radius: 6px;
  background: rgba(7, 17, 31, 0.88);
  box-shadow: inset 0 1px 0 rgba(61, 220, 255, 0.08);
}
.ss-profile-asset-details h3 {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${ACCENT_TEAL};
  font-family: ${SPLUNK_SANS};
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
  color: #E8F7FF;
  cursor: pointer;
  user-select: none;
}
.ss-profile-radio input {
  accent-color: ${ACCENT_TEAL};
  width: 14px;
  height: 14px;
  margin: 0;
}
.ss-profile-mode-tabs {
  display: inline-flex;
  border: 1px solid rgba(61, 220, 255, 0.35);
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
  padding: 9px 10px;
  border-bottom: 1px solid rgba(61, 220, 255, 0.12);
  text-align: left;
}
.ss-profile-results-table th {
  color: ${ACCENT_GOLD};
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: ${SPLUNK_SANS};
}
.ss-profile-results-empty {
  padding: 28px 12px;
  text-align: center;
  color: ${MUTED};
  font-size: 13px;
}
.ss-profile-results-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.ss-profile-results-actions button,
.ss-profile-results-actions a {
  flex: 0 0 auto !important;
  width: auto !important;
  max-width: 100%;
  align-self: center;
}
.ss-profile-results-count {
  color: ${MUTED};
  font-size: 13px;
}
.ss-profile-page button,
.ss-profile-page [role="tab"],
.ss-profile-page a {
  color: #E8F7FF !important;
}
.ss-profile-page .ss-profile-instruction-btn button,
.ss-profile-page .ss-profile-instruction-btn [role="button"],
.ss-profile-page .ss-profile-instruction-btn a {
  background: rgba(61, 220, 255, 0.12) !important;
  color: #E8F7FF !important;
  border-color: rgba(61, 220, 255, 0.4) !important;
}
.ss-profile-standard-viz {
  width: 100%;
  height: 100%;
}
.ss-profile-standard-viz text {
  fill: #E8F7FF !important;
  font-family: ${SPLUNK_SANS} !important;
}
.ss-profile-standard-viz .highcharts-axis-line,
.ss-profile-standard-viz .highcharts-tick {
  stroke: rgba(232, 247, 255, 0.55) !important;
}
.ss-profile-standard-viz .highcharts-grid-line {
  stroke: rgba(232, 247, 255, 0.18) !important;
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
  color: #E8F7FF;
}
.ss-feedback-card label,
.ss-feedback-card [class*="ControlGroup"] {
  color: #E8F7FF !important;
}
.ss-feedback-submit {
  background: ${ACCENT_TEAL} !important;
  border-color: ${ACCENT_TEAL} !important;
  color: #031018 !important;
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

/** Injects the shared profile CSS once into the document. Works with Page, VizCard, charts, and the feedback page. */
export function ensureProfileResponsiveStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(RESPONSIVE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = RESPONSIVE_STYLE_ID;
    style.textContent = RESPONSIVE_CSS;
    document.head.appendChild(style);
}

/** Page shell that applies the profile background and responsive CSS. Works with every profile, drilldown, and feedback view. */
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

/** Renders the page title in the Splunk sans stack. Works with profile, asset, patch, and feedback pages. */
export function PageHeader({ title, ...rest }) {
    return (
        <div style={{ marginBottom: 22 }} {...rest}>
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: ACCENT_TEAL,
                    marginBottom: 8,
                    fontFamily: SPLUNK_SANS,
                }}
            >
                Cyber Profile · Security Operations
            </div>
            <h1
                style={{
                    margin: 0,
                    fontSize: 32,
                    fontWeight: 700,
                    lineHeight: 1.12,
                    color: '#F3FBFF',
                    letterSpacing: '-0.03em',
                    fontFamily: SPLUNK_SANS,
                }}
            >
                {title}
            </h1>
            <div
                style={{
                    marginTop: 12,
                    height: 2,
                    width: 72,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${ACCENT_GOLD}, ${ACCENT_TEAL})`,
                }}
            />
        </div>
    );
}

/** Horizontal row for filters and action buttons. Works with the entity picker and the Metric tab. */
export function FilterRow({ children, ...rest }) {
    return (
        <div className="ss-profile-filter-row" {...rest}>
            {children}
        </div>
    );
}

/** Groups filter controls on the left side of a filter row. Works with FilterRow. */
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

/** Small label above a filter control. Works with the entity select and Asset Details filters. */
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

/** Wraps a row of Splunk buttons. Works with Metric A/B and other page actions. */
export function ButtonRow({ children, className = '', ...rest }) {
    const classes = ['ss-profile-actions', className].filter(Boolean).join(' ');
    return (
        <div className={classes} {...rest}>
            {children}
        </div>
    );
}

/** Responsive grid for visualization cards. Works with VizCard on the profile and metric tabs. */
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

/** Section title with an accent bar. Works with KPI and visualization sections. */
export function SectionHeading({ children, subtitle, tone = 'kpi', ...rest }) {
    const accent = tone === 'viz' ? ACCENT_GOLD : ACCENT_TEAL;
    return (
        <div style={{ marginBottom: 12, marginTop: tone === 'viz' ? 8 : 0 }} {...rest}>
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: accent,
                    fontFamily: SPLUNK_SANS,
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

/** Simple titled card for summary text. Works with profile summary sections. */
export function SummaryCard({ title, children, ...rest }) {
    return (
        <div
            style={{
                background: PANEL_BLUE,
                border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${ACCENT_TEAL}`,
                borderRadius: 6,
                padding: '16px 18px',
                boxSizing: 'border-box',
                minHeight: 104,
            }}
            {...rest}
        >
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: ACCENT_GOLD,
                    marginBottom: 8,
                    fontFamily: SPLUNK_SANS,
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}

/** Card chrome around a chart, including the title, text row, and info button. Works with VizTools and the standard charts. */
export function VizCard({ title, subheader, headerBlue = false, href, tools = null, children, ...rest }) {
    const name = title || subheader;
    const caption = title && subheader ? subheader : null;
    const titleStyle = {
        display: 'block',
        background: headerBlue
            ? 'linear-gradient(90deg, #0F2438 0%, #12304A 100%)'
            : 'transparent',
        padding: headerBlue ? '9px 12px' : '4px 4px 8px',
        borderRadius: headerBlue ? 6 : 0,
        border: headerBlue ? `1px solid ${VIZ_BORDER}` : 'none',
        borderBottom: headerBlue ? `1px solid ${VIZ_BORDER}` : 'none',
        fontSize: 12,
        fontWeight: 700,
        color: headerBlue ? ACCENT_GOLD : '#F3FBFF',
        letterSpacing: headerBlue ? '0.06em' : '-0.01em',
        textTransform: headerBlue ? 'uppercase' : 'none',
        fontFamily: SPLUNK_SANS,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        lineHeight: 1.3,
        textDecoration: 'none',
        cursor: href ? 'pointer' : 'default',
        paddingRight:
            tools && tools.showInfo !== false && String(tools.infoText || '').trim() ? 36 : undefined,
    };
    return (
        <div
            style={{
                position: 'relative',
                background: headerBlue ? VIZ_BODY : 'transparent',
                border: headerBlue ? `1px solid ${VIZ_BORDER}` : 'none',
                borderRadius: 6,
                overflow: 'hidden',
                boxSizing: 'border-box',
                boxShadow: headerBlue ? '0 10px 24px rgba(0,0,0,0.28)' : 'none',
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
                        fontFamily: SPLUNK_SANS,
                    }}
                >
                    {caption}
                </div>
            ) : null}
            <VizTools tools={tools} />
            <div style={{ padding: headerBlue ? '8px 12px 12px' : '0 4px 8px' }}>{children}</div>
        </div>
    );
}

/** Fixed-height frame that holds one chart. Works with StandardSplunkViz inside VizCard. */
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

/** Large KPI number. Works with summary and drilldown metric cards. */
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

/** Secondary KPI change text under a value. Works with KpiValue. */
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

/** Content wrapper for the Profile or Metric tab. Works with ProfileTabContent and MetricTabContent. */
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
