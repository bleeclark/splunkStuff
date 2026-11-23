import React from 'react';

import { MUTED, VIZ_HEADER, VIZ_BODY, VIZ_BORDER } from '../ProfileStyles';

/** Red warning icon shown while a Studio-style viz is waiting for input. Works with StudioVizShell. */
function WaitingIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path
                fill="#E55353"
                d="M12 2L1 21h22L12 2zm0 4.5l7.2 12.5H4.8L12 6.5z"
            />
            <rect x="11" y="10" width="2" height="5" fill="#E55353" />
            <rect x="11" y="16.5" width="2" height="2" fill="#E55353" />
        </svg>
    );
}

/** Frame around a drilldown visualization, including waiting and empty states. Works with the asset, high-patch, and critical-patch layouts. */
export default function StudioVizShell({
    children,
    height = 160,
    waiting = false,
    empty = false,
    emptyAlign = 'center',
}) {
    const showWaiting = waiting;
    const showEmpty = !waiting && empty;

    return (
        <div
            className="ss-studio-viz"
            style={{
                borderRadius: 10,
                overflow: 'hidden',
                border: `1px solid ${VIZ_BORDER}`,
                background: VIZ_BODY,
                minHeight: height,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
            }}
        >
            <div
                className="ss-studio-viz__header"
                style={{
                    background: VIZ_HEADER,
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    letterSpacing: '0.01em',
                    borderBottom: '1px solid rgba(0,0,0,0.12)',
                }}
            >
                visualization
            </div>
            <div
                className="ss-studio-viz__body"
                style={{
                    flex: '1 1 auto',
                    padding: showWaiting || showEmpty ? 16 : 12,
                    display: 'flex',
                    alignItems: showWaiting || showEmpty ? 'center' : 'flex-start',
                    justifyContent:
                        showEmpty && emptyAlign === 'end'
                            ? 'flex-end'
                            : showWaiting || showEmpty
                              ? 'center'
                              : 'flex-start',
                    minHeight: Math.max(64, height - 34),
                    background: VIZ_BODY,
                }}
            >
                {showWaiting ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            color: '#E55353',
                            fontSize: 13,
                            fontWeight: 500,
                        }}
                    >
                        <WaitingIcon />
                        <span>Search is waiting for input...</span>
                    </div>
                ) : showEmpty ? (
                    <span style={{ color: MUTED, fontSize: 13 }}>No results found.</span>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
