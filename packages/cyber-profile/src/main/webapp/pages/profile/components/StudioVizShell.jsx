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
                borderRadius: 6,
                overflow: 'hidden',
                border: `1px solid ${VIZ_BORDER}`,
                background: VIZ_BODY,
                minHeight: height,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 10px 24px rgba(0,0,0,0.28)',
            }}
        >
            <div
                className="ss-studio-viz__header"
                style={{
                    background: 'linear-gradient(90deg, #0F2438 0%, #12304A 100%)',
                    padding: '7px 12px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#3DDCFF',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${VIZ_BORDER}`,
                    fontFamily:
                        "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
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
