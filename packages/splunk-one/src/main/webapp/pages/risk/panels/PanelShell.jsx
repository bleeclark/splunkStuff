import React from 'react';
import PropTypes from 'prop-types';

import Card from '@splunk/react-ui/Card';
import Progress from '@splunk/react-ui/Progress';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

function formatDispatchState(state) {
    if (!state) {
        return '';
    }
    return String(state).replace(/_/g, ' ').toLowerCase();
}

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

export default function PanelShell({
    title,
    status,
    children,
    emptyState,
    lastUpdated,
    progress,
    dispatchState,
    loadingMessage,
}) {
    const subtitle = lastUpdated
        ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
        : undefined;

    return (
        <Card
            style={{
                marginBottom: 16,
                border: '1px solid #d5dce5',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
        >
            <Card.Header title={title} subtitle={subtitle} />
            <Card.Body style={{ padding: status === 'loading' ? 16 : 12, minWidth: 0, overflow: 'hidden' }}>
                {status === 'loading' ? (
                    <PanelLoadingState
                        progress={progress}
                        dispatchState={dispatchState}
                        loadingMessage={loadingMessage}
                    />
                ) : null}
                {status === 'error' ? (
                    <div style={{ padding: 12, color: '#c62828' }}>
                        {emptyState || 'Error loading panel'}
                    </div>
                ) : null}
                {status === 'ok' && emptyState ? emptyState : null}
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
};

PanelShell.defaultProps = {
    status: 'ok',
    children: null,
    emptyState: null,
    lastUpdated: null,
    progress: 0,
    dispatchState: null,
    loadingMessage: null,
};
