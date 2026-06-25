/**
 * Shared layout primitives and spacing constants for the risk dashboard page.
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * WHAT: Standard vertical gap between dashboard panels in pixels.
 * WORKS WITH: PanelStack, ScorecardRow, TwoColumnRow.
 */
export const PANEL_GAP = 16;

/**
 * WHAT: Wraps the risk page content with max-width, padding, and background styling.
 * WORKS WITH: index.jsx, GlobalFilterBar, PanelStack.
 */
export function RiskPageContainer({ children, ...rest }) {
    return (
        <div
            style={{
                padding: '20px 24px 32px',
                maxWidth: 1280,
                margin: '0 auto',
                background: '#f4f6f8',
                minHeight: '100vh',
                boxSizing: 'border-box',
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

RiskPageContainer.propTypes = {
    children: PropTypes.node,
};

RiskPageContainer.defaultProps = {
    children: null,
};

/**
 * WHAT: Stacks dashboard panels vertically with consistent gap spacing.
 * WORKS WITH: PANEL_GAP, index.jsx, table and chart panel components.
 */
export function PanelStack({ children }) {
    return (
        <div
            style={{
                display: 'grid',
                gap: PANEL_GAP,
            }}
        >
            {children}
        </div>
    );
}

PanelStack.propTypes = {
    children: PropTypes.node,
};

PanelStack.defaultProps = {
    children: null,
};

/**
 * WHAT: Lays out KPI scorecard tiles in a responsive auto-fit grid row.
 * WORKS WITH: PANEL_GAP, KpiTile, KPI panel components.
 */
export function ScorecardRow({ children }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: PANEL_GAP,
            }}
        >
            {React.Children.map(children, (child) => (
                <div key={child?.key} style={{ minWidth: 0 }}>
                    {child}
                </div>
            ))}
        </div>
    );
}

ScorecardRow.propTypes = {
    children: PropTypes.node,
};

ScorecardRow.defaultProps = {
    children: null,
};

/**
 * WHAT: Arranges two panels side-by-side in a responsive two-column grid.
 * WORKS WITH: PANEL_GAP, index.jsx, RiskTablePanels.
 */
export function TwoColumnRow({ children }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                gap: PANEL_GAP,
                alignItems: 'start',
                marginBottom: 0,
            }}
        >
            {children}
        </div>
    );
}

TwoColumnRow.propTypes = {
    children: PropTypes.node,
};

TwoColumnRow.defaultProps = {
    children: null,
};

/**
 * WHAT: Provides the dark branded container shell for a single KPI sparkline tile.
 * WORKS WITH: ResponsiveKpiValue, NewSingleValue, KPI panel components.
 */
export function KpiTile({ children }) {
    return (
        <div
            style={{
                background: '#0B1F3B',
                borderRadius: 6,
                overflow: 'hidden',
                minHeight: 150,
                width: '100%',
            }}
        >
            {children}
        </div>
    );
}

KpiTile.propTypes = {
    children: PropTypes.node,
};

KpiTile.defaultProps = {
    children: null,
};
