import React from 'react';

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

export function ScorecardRow({ children }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
                marginBottom: 16,
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

export function TwoColumnRow({ children }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 16,
                marginBottom: 16,
            }}
        >
            {children}
        </div>
    );
}

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
