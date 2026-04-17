import React from 'react';

/** Same logic as `NewSingleValue.jsx` in splunk-one (no @splunk deps). */
export default function FixedSparkline({
    values = [],
    width = 360,
    height = 50,
    min = 0,
    max = 100,
    stroke = '#FFFFFF',
    strokeWidth = 2,
    padLeft = 0,
    padRight = 0,
    padTop = 0,
    padBottom = 0,
}) {
    const nums = (Array.isArray(values) ? values : [])
        .map(Number)
        .filter(Number.isFinite);
    if (
        nums.length < 2 ||
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        max <= min
    ) {
        return null;
    }
    const innerWidth = Math.max(1, width - padLeft - padRight);
    const innerHeight = Math.max(1, height - padTop - padBottom);
    const xStep =
        nums.length > 1 ? innerWidth / (nums.length - 1) : innerWidth;
    const toX = (i) => padLeft + i * xStep;
    const toY = (v) => {
        const ratio = (v - min) / (max - min);
        const clamped = Math.max(0, Math.min(1, ratio));
        return padTop + innerHeight - clamped * innerHeight;
    };
    const d = nums
        .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`)
        .join(' ');
    return (
        <svg
            width={width}
            height={height}
            style={{ display: 'block', overflow: 'visible' }}
        >
            <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
    );
}
