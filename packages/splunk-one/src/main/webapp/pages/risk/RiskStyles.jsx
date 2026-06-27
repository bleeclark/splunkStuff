/**
 * Shared layout primitives and spacing constants for the risk dashboard page.
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * WHAT: Standard vertical gap between dashboard panels in pixels.
 * WORKS WITH: PanelStack, TwoColumnRow.
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
