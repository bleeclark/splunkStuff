import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

import { cellHref, infoTextOf, visibleCells } from '../vizLinks';

/** Info button that shows a popover on hover and pins it on click. Works with VizTools and the chart card header. */
function InfoButton({ text }) {
    const buttonRef = useRef(null);
    const popRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);

    const place = () => {
        const button = buttonRef.current;
        const pop = popRef.current;
        if (!button || !pop) return;
        const rect = button.getBoundingClientRect();
        const width = Math.min(280, window.innerWidth - 16);
        pop.style.maxWidth = `${width}px`;
        pop.style.top = `${Math.round(rect.bottom + 6)}px`;
        const right = Math.max(8, Math.round(window.innerWidth - rect.right));
        pop.style.right = `${right}px`;
        pop.style.left = 'auto';
    };

    useEffect(() => {
        if (!open) return undefined;
        place();
        const onKey = (event) => {
            if (event.key === 'Escape') {
                setPinned(false);
                setOpen(false);
            }
        };
        const onPointer = (event) => {
            const button = buttonRef.current;
            const pop = popRef.current;
            if (!button || !pop) return;
            if (button.contains(event.target) || pop.contains(event.target)) return;
            setPinned(false);
            setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        document.addEventListener('mousedown', onPointer);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
            document.removeEventListener('mousedown', onPointer);
        };
    }, [open]);

    const pop =
        open && typeof document !== 'undefined'
            ? createPortal(
                  <div
                      ref={popRef}
                      role="tooltip"
                      style={{
                          position: 'fixed',
                          zIndex: 2147483646,
                          padding: '8px 10px',
                          fontSize: 12,
                          lineHeight: 1.4,
                          color: '#FFFFFF',
                          background: 'rgba(11,31,59,0.96)',
                          border: '1px solid rgba(255,255,255,0.25)',
                          borderRadius: 4,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                          whiteSpace: 'pre-wrap',
                      }}
                  >
                      {text}
                  </div>,
                  document.body
              )
            : null;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label="More information"
                aria-expanded={open}
                onMouseEnter={() => setOpen(true)}
                onFocus={() => setOpen(true)}
                onMouseLeave={() => {
                    if (!pinned) setOpen(false);
                }}
                onBlur={() => {
                    if (!pinned) setOpen(false);
                }}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (pinned) {
                        setPinned(false);
                        setOpen(false);
                    } else {
                        setPinned(true);
                        setOpen(true);
                    }
                }}
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    width: 18,
                    height: 18,
                    padding: 0,
                    border: '1.5px solid currentColor',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.18)',
                    color: 'inherit',
                    fontFamily:
                        "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: 11,
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                }}
            >
                i
            </button>
            {pop}
        </>
    );
}

InfoButton.propTypes = {
    text: PropTypes.string.isRequired,
};

/** Text row, cell links, and info button for a chart card. Works with vizLinks and the tools object on VizCard. */
export default function VizTools({ tools }) {
    const cells = visibleCells(tools);
    const info = infoTextOf(tools);
    if (!cells.length && !info) return null;
    const target = tools.linkTarget === 'sameTab' ? '_self' : '_blank';

    return (
        <>
            {info ? <InfoButton text={info} /> : null}
            {cells.length ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        minHeight: 28,
                        margin: '0 8px 6px',
                        background: 'rgba(0,0,0,0.18)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: 4,
                        color: 'inherit',
                        fontSize: 12,
                        fontWeight: 500,
                    }}
                >
                    {cells.map((cell, index) => {
                        const label = String(cell.label || `Text${index + 1}`);
                        const value = String(cell.value);
                        const full = `${label}: ${value}`;
                        const href = cellHref(cell, tools);
                        const inner = (
                            <span
                                title={full}
                                style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {full}
                            </span>
                        );
                        return (
                            <div
                                key={`${label}-${value}`}
                                style={{
                                    flex: '1 1 0',
                                    minWidth: 0,
                                    padding: '4px 8px',
                                    textAlign: 'center',
                                    borderLeft:
                                        index === 0 ? 'none' : '1px solid rgba(255,255,255,0.25)',
                                }}
                            >
                                {href ? (
                                    <a
                                        href={href}
                                        target={target}
                                        rel="noopener noreferrer"
                                        style={{ color: 'inherit', textDecoration: 'none' }}
                                    >
                                        {inner}
                                    </a>
                                ) : (
                                    inner
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : null}
        </>
    );
}

VizTools.propTypes = {
    tools: PropTypes.shape({
        showTextRow: PropTypes.bool,
        showInfo: PropTypes.bool,
        infoText: PropTypes.string,
        linkTarget: PropTypes.oneOf(['newTab', 'sameTab']),
        linkEarliest: PropTypes.string,
        linkLatest: PropTypes.string,
        cells: PropTypes.arrayOf(
            PropTypes.shape({
                label: PropTypes.string,
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                url: PropTypes.string,
                urlFromField: PropTypes.string,
                search: PropTypes.string,
            })
        ),
    }),
};

VizTools.defaultProps = {
    tools: null,
};
