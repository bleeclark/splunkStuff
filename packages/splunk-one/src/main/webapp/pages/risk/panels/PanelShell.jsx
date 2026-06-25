/**
 * Reusable card shell with loading, error, and empty states for risk dashboard panels.
 */
import React from 'react';
import PropTypes from 'prop-types';

import Card from '@splunk/react-ui/Card';
import Progress from '@splunk/react-ui/Progress';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

/**
 * WHAT: Formats Splunk search dispatch state strings into human-readable lowercase labels.
 * WORKS WITH: PanelLoadingState, Splunk search dispatch states (QUEUED, RUNNING, DONE).
 */
function formatDispatchState(state) {
    if (!state) {
        return '';
    }
    return String(state).replace(/_/g, ' ').toLowerCase();
}

/**
 * WHAT: Renders a spinner, optional progress bar, and dispatch state label while a panel search runs.
 * WORKS WITH: PanelShell, formatDispatchState, Splunk WaitSpinner, Progress.
 */
function PanelLoadingState({ progress, dispatchState, loadingMessage }) {
    const showBar = progress > 0;
    const stateLabel = formatDispatchState(dispatchState);

    return (
        <div style={{ padding: '16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: showBar ? 12 : 0 }}>
                <WaitSpinner size="medium" />
                <div style={{ color: '#666', fontSize: 13 }}>
                    {loadingMessage || 'Running search…'}
                    {stateLabel ? ` (${stateLabel})` : ''}
                </div>
            </div>
            {showBar ? (
                <Progress value={progress} appearance="bar" />
            ) : null}
            {showBar ? (
                <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>{progress}% complete</div>
            ) : null}
        </div>
    );
}

PanelLoadingState.propTypes = {
    progress: PropTypes.number,
    dispatchState: PropTypes.string,
    loadingMessage: PropTypes.string,
};

PanelLoadingState.defaultProps = {
    progress: 0,
    dispatchState: null,
    loadingMessage: null,
};

/**
 * WHAT: Wraps panel content in a Splunk Card with title, last-updated subtitle, and status-driven body states.
 * WORKS WITH: panelShellPropsFromRiskData, PanelLoadingState, useRiskData, Splunk Card.
 */
export default function PanelShell({
    title,
    status,
    children,
    emptyState,
    lastUpdated,
    progress,
    dispatchState,
    loadingMessage,
    compact,
}) {
    const subtitle = lastUpdated
        ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
        : undefined;

    return (
        <Card
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: compact ? 'auto' : '100%',
                boxSizing: 'border-box',
                marginBottom: 0,
                border: '1px solid #d5dce5',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
        >
            <div style={{ padding: compact ? '14px 18px 8px' : '18px 20px 12px' }}>
                <div
                    style={{
                        color: '#2f3b47',
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1.25,
                    }}
                >
                    {title}
                </div>
                {subtitle ? (
                    <div
                        style={{
                            color: '#4a5a6a',
                            fontSize: 13,
                            lineHeight: 1.35,
                            marginTop: 4,
                        }}
                    >
                        {subtitle}
                    </div>
                ) : null}
            </div>
            <Card.Body
                style={{
                    flex: 1,
                    padding: compact ? '0 18px 14px' : '0 20px 18px',
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                {status === 'loading' ? (
                    <PanelLoadingState
                        progress={progress}
                        dispatchState={dispatchState}
                        loadingMessage={loadingMessage}
                    />
                ) : null}
                {status === 'error' ? (
                    <div style={{ padding: compact ? 8 : 12, color: '#c62828' }}>
                        {emptyState || 'Error loading panel'}
                    </div>
                ) : null}
                {status === 'ok' && emptyState ? (
                    <div
                        style={{
                            color: '#516173',
                            fontSize: 13,
                            lineHeight: 1.4,
                            padding: compact ? '4px 0' : 12,
                        }}
                    >
                        {emptyState}
                    </div>
                ) : null}
                {status !== 'error' && !emptyState && status !== 'loading' ? children : null}
            </Card.Body>
        </Card>
    );
}

PanelShell.propTypes = {
    title: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['ok', 'loading', 'error']),
    children: PropTypes.node,
    emptyState: PropTypes.node,
    lastUpdated: PropTypes.string,
    progress: PropTypes.number,
    dispatchState: PropTypes.string,
    loadingMessage: PropTypes.string,
    compact: PropTypes.bool,
};

PanelShell.defaultProps = {
    status: 'ok',
    children: null,
    emptyState: null,
    lastUpdated: null,
    progress: 0,
    dispatchState: null,
    loadingMessage: null,
    compact: false,
};
