import React from 'react';
import PropTypes from 'prop-types';

export const PANEL_GAP = 16;

/** Risk dashboard page layout styles. */
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
