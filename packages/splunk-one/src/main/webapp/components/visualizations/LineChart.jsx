import React, { useCallback, useMemo, useState } from 'react';

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function toNumberArray(values) {
    return (Array.isArray(values) ? values : []).map(Number).filter(Number.isFinite);
}

function deriveDomain(nums) {
    if (nums.length === 0) {
        return { min: 0, max: 1 };
    }
    let min = Math.min(...nums);
    let max = Math.max(...nums);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return { min: 0, max: 1 };
    }
    if (max <= min) {
        max = min + 1;
    }
    // small padding so flat-ish lines are visible
    const pad = (max - min) * 0.06;
    return { min: min - pad, max: max + pad };
}

function buildPath(nums, width, height, { padLeft, padRight, padTop, padBottom, min, max }) {
    const innerW = Math.max(1, width - padLeft - padRight);
    const innerH = Math.max(1, height - padTop - padBottom);
    const n = nums.length;
    if (n < 2) {
        return '';
    }
    const xStep = innerW / (n - 1);
    const toX = (i) => padLeft + i * xStep;
    const toY = (v) => {
        const ratio = (v - min) / (max - min);
        const clamped = clamp(ratio, 0, 1);
        return padTop + innerH - clamped * innerH;
    };
    return nums
        .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(v).toFixed(2)}`)
        .join(' ');
}

function formatHoverX(raw) {
    if (raw == null) {
        return '';
    }
    if (typeof raw === 'string') {
        const ms = Date.parse(raw);
        if (Number.isFinite(ms)) {
            return new Date(ms).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        return raw;
    }
    if (typeof raw === 'number') {
        return String(raw);
    }
    return String(raw);
}

function formatHoverY(v) {
    if (!Number.isFinite(v)) {
        return '—';
    }
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function LineChart({
    values,
    times,
    width = 400,
    height = 105,
    min,
    max,
    stroke = 'rgba(255,255,255,0.95)',
    strokeWidth = 2,
    background = '#0B1F3B',
    showHover = true,
    padLeft = 12,
    padRight = 12,
    padTop = 10,
    padBottom = 18,
    emptyText = 'Need at least two points.',
}) {
    const nums = useMemo(() => toNumberArray(values), [values]);

    const domain = useMemo(() => {
        const derived = deriveDomain(nums);
        let lo = Number.isFinite(Number(min)) ? Number(min) : derived.min;
        let hi = Number.isFinite(Number(max)) ? Number(max) : derived.max;
        if (lo > hi) {
            const t = lo;
            lo = hi;
            hi = t;
        }
        if (hi <= lo) {
            hi = lo + 1;
        }
        return { min: lo, max: hi };
    }, [nums, min, max]);

    const pathD = useMemo(
        () =>
            buildPath(nums, width, height, {
                padLeft,
                padRight,
                padTop,
                padBottom,
                min: domain.min,
                max: domain.max,
            }),
        [nums, width, height, padLeft, padRight, padTop, padBottom, domain]
    );

    const [hoverIdx, setHoverIdx] = useState(null);

    const innerW = Math.max(1, width - padLeft - padRight);
    const n = nums.length;
    const xStep = n > 1 ? innerW / (n - 1) : innerW;

    const toX = useCallback((i) => padLeft + i * xStep, [padLeft, xStep]);
    const toY = useCallback(
        (v) => {
            const innerH = Math.max(1, height - padTop - padBottom);
            const ratio = (v - domain.min) / (domain.max - domain.min);
            const clamped = clamp(ratio, 0, 1);
            return padTop + innerH - clamped * innerH;
        },
        [height, padTop, padBottom, domain]
    );

    const onMove = useCallback(
        (e) => {
            if (!showHover || n < 2) {
                return;
            }
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            if (!rect.width) {
                return;
            }
            const scaleX = width / rect.width;
            const x = (e.clientX - rect.left) * scaleX;
            const relX = x - padLeft;
            const idx = clamp(Math.round(relX / xStep), 0, n - 1);
            setHoverIdx(idx);
        },
        [showHover, n, width, padLeft, xStep]
    );

    const onLeave = useCallback(() => {
        setHoverIdx(null);
    }, []);

    if (nums.length < 2) {
        return (
            <div
                style={{
                    width,
                    height,
                    background,
                    color: 'rgba(255,255,255,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    boxSizing: 'border-box',
                    borderRadius: 4,
                }}
            >
                {emptyText}
            </div>
        );
    }

    const hx = hoverIdx != null ? toX(hoverIdx) : 0;
    const hy = hoverIdx != null ? toY(nums[hoverIdx]) : 0;
    const hoverTime =
        hoverIdx != null && Array.isArray(times) && times.length > hoverIdx
            ? formatHoverX(times[hoverIdx])
            : '';
    const hoverValue = hoverIdx != null ? formatHoverY(nums[hoverIdx]) : '';

    return (
        <div style={{ position: 'relative', width, height, background, borderRadius: 4 }}>
            <svg
                width={width}
                height={height}
                style={{ display: 'block' }}
                onMouseMove={showHover ? onMove : undefined}
                onMouseLeave={showHover ? onLeave : undefined}
            >
                {/* baseline rails */}
                <line
                    x1={padLeft}
                    y1={height - padBottom}
                    x2={width - padRight}
                    y2={height - padBottom}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth={1}
                />
                <line
                    x1={padLeft}
                    y1={padTop}
                    x2={width - padRight}
                    y2={padTop}
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth={1}
                />

                <path d={pathD} fill="none" stroke={stroke} strokeWidth={strokeWidth} />

                {/* hover marker */}
                {showHover && hoverIdx != null ? (
                    <g style={{ pointerEvents: 'none' }}>
                        <line
                            x1={hx}
                            y1={padTop}
                            x2={hx}
                            y2={height - padBottom}
                            stroke="rgba(255,255,255,0.22)"
                            strokeWidth={1}
                        />
                        <circle
                            cx={hx}
                            cy={hy}
                            r={4}
                            fill={stroke}
                            stroke="rgba(0,0,0,0.35)"
                            strokeWidth={1}
                        />
                    </g>
                ) : null}
            </svg>

            {showHover && hoverIdx != null ? (
                <div
                    style={{
                        position: 'absolute',
                        left: clamp(hx, 8, width - 8),
                        top: Math.max(8, hy - 8),
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'none',
                        background: 'rgba(15, 25, 45, 0.96)',
                        color: '#fff',
                        fontSize: 11,
                        lineHeight: 1.35,
                        padding: '6px 8px',
                        borderRadius: 4,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                        whiteSpace: 'nowrap',
                        zIndex: 2,
                    }}
                >
                    <div style={{ fontWeight: 600 }}>{hoverValue}</div>
                    {hoverTime ? <div style={{ opacity: 0.88, marginTop: 2 }}>{hoverTime}</div> : null}
                </div>
            ) : null}
        </div>
    );
}

