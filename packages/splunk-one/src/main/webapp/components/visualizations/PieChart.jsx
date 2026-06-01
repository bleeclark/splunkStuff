import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_PALETTE = [
    '#01417F',
    '#DFA611',
    '#5CC05C',
    '#F47A22',
    '#9B6BFF',
    '#00A9D4',
    '#E85B79',
    '#8B9BB4',
];

function applyTopN(slices, topN, otherLabel) {
    const sorted = slices.slice().sort((a, b) => b.value - a.value);
    const limit = parseInt(topN, 10);
    if (!Number.isFinite(limit) || limit <= 0 || sorted.length <= limit) {
        return sorted;
    }
    const keep = sorted.slice(0, limit);
    const rest = sorted.slice(limit);
    const otherSum = rest.reduce((sum, s) => sum + s.value, 0);
    if (otherSum > 0) {
        keep.push({ label: String(otherLabel || 'Other'), value: otherSum });
    }
    return keep;
}

function appendPieSlice(svg, cx, cy, r, startAngle, sweep, fill, stroke) {
    if (sweep >= Math.PI * 2 - 1e-6) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(cx));
        circle.setAttribute('cy', String(cy));
        circle.setAttribute('r', String(r));
        circle.setAttribute('fill', fill);
        circle.setAttribute('stroke', stroke);
        circle.setAttribute('stroke-width', '1');
        svg.appendChild(circle);
        return;
    }
    const endAngle = startAngle + sweep;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', '1');
    svg.appendChild(path);
}

/**
 * Categorical pie chart (Top N + Other) — mirrors splunkstuff_pie_chart AMD viz.
 */
export default function PieChart({
    slices,
    topN = 5,
    otherLabel = 'Other',
    showPercent = true,
    title = '',
    background = '#1B2A41',
    textColor = '#FFFFFF',
    width = 400,
    height = 220,
}) {
    const shaped = useMemo(
        () => applyTopN(slices || [], topN, otherLabel),
        [slices, topN, otherLabel]
    );

    const total = useMemo(
        () => shaped.reduce((sum, s) => sum + s.value, 0),
        [shaped]
    );

    const svgRef = React.useCallback(
        (node) => {
            if (!node || total <= 0) {
                return;
            }
            node.innerHTML = '';
            const cx = 100;
            const cy = 100;
            const r = 88;
            let angle = -Math.PI / 2;
            shaped.forEach((slice, i) => {
                const sweep = (slice.value / total) * Math.PI * 2;
                if (sweep <= 0) {
                    return;
                }
                appendPieSlice(
                    node,
                    cx,
                    cy,
                    r,
                    angle,
                    sweep,
                    DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
                    background
                );
                angle += sweep;
            });
        },
        [shaped, total, background]
    );

    if (!shaped.length) {
        return (
            <div style={{ width, height, background, color: textColor, padding: 12, fontSize: 12 }}>
                No data to display.
            </div>
        );
    }

    if (total <= 0) {
        return (
            <div style={{ width, height, background, color: textColor, padding: 12, fontSize: 12 }}>
                Sum of values must be greater than zero.
            </div>
        );
    }

    return (
        <div
            style={{
                boxSizing: 'border-box',
                width,
                height,
                background,
                color: textColor,
                display: 'flex',
                flexDirection: 'column',
                fontFamily:
                    "'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}
        >
            {title ? (
                <div style={{ padding: '8px 12px 4px', fontSize: 12, fontWeight: 600, opacity: 0.9 }}>
                    {title}
                </div>
            ) : null}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    gap: 12,
                    padding: '8px 12px 12px',
                }}
            >
                <div
                    style={{
                        flex: '0 0 auto',
                        width: 'min(48%, 180px)',
                        minWidth: 120,
                        minHeight: 120,
                        aspectRatio: '1',
                        alignSelf: 'center',
                    }}
                >
                    <svg
                        ref={svgRef}
                        viewBox="0 0 200 200"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                        role="img"
                        aria-label="Pie chart"
                        style={{ display: 'block', minHeight: 120 }}
                    />
                </div>
                <div style={{ flex: 1, overflow: 'auto', fontSize: 11, lineHeight: 1.45 }}>
                    {shaped.map((slice, i) => {
                        const pct = ((slice.value / total) * 100).toFixed(1);
                        return (
                            <div
                                key={slice.label}
                                style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}
                            >
                                <span
                                    style={{
                                        flex: '0 0 10px',
                                        width: 10,
                                        height: 10,
                                        marginTop: 3,
                                        borderRadius: 2,
                                        background: DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
                                    }}
                                />
                                <span style={{ flex: 1, wordBreak: 'break-word' }}>
                                    {showPercent
                                        ? `${slice.label} — ${slice.value.toLocaleString()} (${pct}%)`
                                        : `${slice.label} — ${slice.value.toLocaleString()}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

PieChart.propTypes = {
    slices: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
        })
    ),
    topN: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    otherLabel: PropTypes.string,
    showPercent: PropTypes.bool,
    title: PropTypes.string,
    background: PropTypes.string,
    textColor: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
};
