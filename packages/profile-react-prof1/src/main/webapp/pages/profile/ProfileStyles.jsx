import React, { useEffect } from 'react';

export const PAGE_BLUE = '#0B1F3B';
export const PANEL_BLUE = '#122a4d';
export const MUTED = 'rgba(255,255,255,0.72)';
export const BORDER = 'rgba(255,255,255,0.14)';

const RESPONSIVE_STYLE_ID = 'ss-profile-responsive';

const RESPONSIVE_CSS = `
.ss-profile-page {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  background: ${PAGE_BLUE};
  color: #FFFFFF;
  padding: 28px 32px 48px;
}
.ss-profile-page__inner {
  max-width: 1100px;
  margin: 0 auto;
}
.ss-profile-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid ${BORDER};
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

/** Compact brand mark for the Profile header (no image asset in the app yet). */
export function ProfileLogo({ size = 40, ...rest }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            role="img"
            aria-label="Profile logo"
            {...rest}
        >
            <rect width="40" height="40" rx="10" fill="#01417F" />
            <path
                d="M10 27V13h7.2c3.4 0 5.5 1.8 5.5 4.5 0 1.8-1 3.2-2.6 3.9L26 27h-4.2l-5-5.2H14.2V27H10zm4.2-8.8h2.8c1.5 0 2.4-.8 2.4-2s-.9-2-2.4-2h-2.8v4z"
                fill="#FFFFFF"
            />
            <circle cx="30" cy="12" r="3" fill="#DFA611" />
        </svg>
    );
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
            <ProfileLogo />
            <h1
                style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
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
                    columns === 2 ? 280 : 220
                }px), 1fr))`,
                gap: 16,
                marginBottom: 20,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function SummaryCard({ title, children, ...rest }) {
    return (
        <div
            style={{
                background: PANEL_BLUE,
                border: `1px solid ${BORDER}`,
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
                    color: MUTED,
                    marginBottom: 8,
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}

export function VizCard({ title, children, ...rest }) {
    return (
        <div
            style={{
                background: PANEL_BLUE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}
            {...rest}
        >
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: MUTED,
                    padding: '12px 14px 8px',
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}

export function VizPanel({ children, height = 168, ...rest }) {
    return (
        <div
            style={{
                background: PAGE_BLUE,
                width: '100%',
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
