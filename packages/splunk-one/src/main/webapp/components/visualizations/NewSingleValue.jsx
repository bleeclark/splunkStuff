import React, { useMemo, useState, useCallback } from 'react';
import SingleValue from '@splunk/visualizations/SingleValue';
import Tooltip from '@splunk/react-ui/Tooltip';

function withAnchors(values = [], times = [], { min = 0, max = 100 } = {}) {
    const len = Math.min(values.length, times.length);
    if (len === 0) {
        return { values: [], times: [] };
    }
    const pairs = [];
    for (let i = 0; i < len; i += 1) {
        const rawT = times[i];
        const rawV = values[i];
        const t = typeof rawT === 'string' ? Date.parse(rawT) : Number(rawT);
        const v = Number(rawV);
        if (Number.isFinite(t) && Number.isFinite(v)) {
            pairs.push([t, v]);
        }
    }
    if (pairs.length === 0) {
        return { values: [], times: [] };
    }
    pairs.sort((a, b) => a[0] - b[0]);
    const t0 = pairs[0][0];
    const sortedT = pairs.map((p) => p[0]);
    const sortedV = pairs.map((p) => p[1]);
    return {
        times: [t0, t0, ...sortedT],
        values: [max, min, ...sortedV],
    };
}

function toLocalDataSource(values = [], times = []) {
    const len = Math.min(values.length, times.length);
    const pairs = [];
    for (let i = 0; i < len; i += 1) {
        const rawT = times[i];
        const rawV = values[i];
        const t = typeof rawT === 'string' ? Date.parse(rawT) : Number(rawT);
        const v = Number(rawV);
        if (Number.isFinite(t) && Number.isFinite(v)) {
            pairs.push([t, v]);
        }
    }
    const colsT = pairs.map((p) => p[0]);
    const colsV = pairs.map((p) => p[1]);
    return {
        primary: {
            data: {
                columns: [colsT, colsV],
                fields: [{ name: '_time' }, { name: 'sparklineValues' }],
            },
            meta: {},
        },
    };
}

function formatSparkHoverTime(raw) {
    if (raw == null || raw === '') {
        return null;
    }
    if (typeof raw === 'string') {
        const ms = Date.parse(raw);
        if (Number.isFinite(ms) && !Number.isNaN(new Date(ms).getTime())) {
            return new Date(ms).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        return raw;
    }
    if (typeof raw === 'number' && raw > 31536000000) {
        return new Date(raw).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return null;
}

function formatSparkHoverValue(v) {
    if (!Number.isFinite(v)) {
        return '—';
    }
    return Number.isInteger(v) && Math.abs(v) < 1e6
        ? String(v)
        : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function FixedSparkline({
    values = [],
    times = [],
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
    showHover = true,
    valueUnit = '',
}) {
    const [hoverIdx, setHoverIdx] = useState(null);

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

    const handleMove = useCallback(
        (e) => {
            if (!showHover) {
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
            let idx = Math.round(relX / xStep);
            idx = Math.max(0, Math.min(nums.length - 1, idx));
            setHoverIdx(idx);
        },
        [showHover, width, padLeft, xStep, nums.length]
    );

    const handleLeave = useCallback(() => {
        setHoverIdx(null);
    }, []);

    const hitStroke = Math.max(16, strokeWidth * 6);
    const timeRow =
        showHover &&
        hoverIdx != null &&
        Array.isArray(times) &&
        times.length > hoverIdx
            ? formatSparkHoverTime(times[hoverIdx])
            : null;
    const hx = hoverIdx != null ? toX(hoverIdx) : 0;
    const hy = hoverIdx != null ? toY(nums[hoverIdx]) : 0;

    return (
        <div style={{ position: 'relative', width, height }}>
            <svg
                width={width}
                height={height}
                style={{ display: 'block', overflow: 'visible' }}
                onMouseMove={showHover ? handleMove : undefined}
                onMouseLeave={showHover ? handleLeave : undefined}
            >
                <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    style={{ pointerEvents: 'none' }}
                />
                {showHover && (
                    <path
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={hitStroke}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ cursor: 'crosshair' }}
                    />
                )}
                {showHover && hoverIdx != null && (
                    <g style={{ pointerEvents: 'none' }}>
                        <line
                            x1={hx}
                            y1={padTop}
                            x2={hx}
                            y2={height - padBottom}
                            stroke="rgba(255,255,255,0.35)"
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
                )}
            </svg>
            {showHover && hoverIdx != null && (
                <div
                    style={{
                        position: 'absolute',
                        left: Math.min(width - 4, Math.max(4, hx)),
                        top: hy - 6,
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
                    <div style={{ fontWeight: 600 }}>
                        {formatSparkHoverValue(nums[hoverIdx])}
                        {valueUnit || ''}
                    </div>
                    {timeRow ? (
                        <div style={{ opacity: 0.88, marginTop: 2 }}>{timeRow}</div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

export default function NewSingleValue({
    feed,
    width = 400,
    height = 130,
    options = {},
    onDrilldown,
    dataSources,
    goodColor = '#01417F',
    badColor = '#DFA611',
    textColor = '#FFFFFF',
    invert = false,
    sparkMin = 0,
    sparkMax = 100,
    sparkStroke = '#FFFFFF',
    sparkStrokeWidth = 2,
    sparkBottom = 12,
    sparkLeft = 12,
    sparkRight = 12,
    sparkHeight = 58,
    sparkPadLeft = 4,
    sparkPadRight = 4,
    sparkPadTop = 2,
    sparkPadBottom = 2,
    showSparklineHoverValues = true,
    /** `overlay` = sparkline on top of SingleValue (default). `below` = sparkline in normal flow under the numbers. */
    sparklineLayout = 'overlay',
}) {
    const {
        subheader = '',
        tooltipText = '',
        values = [],
        times = [],
    } = feed || {};

    const preparedFeed = useMemo(() => {
        const safeValues = Array.isArray(values)
            ? values.map(Number).filter(Number.isFinite)
            : [];
        const safeTimes =
            Array.isArray(times) && times.length === safeValues.length
                ? times
                : safeValues.map((_, i) => i);
        const { values: anchoredValues, times: anchoredTimes } = withAnchors(
            safeValues,
            safeTimes,
            { min: sparkMin, max: sparkMax }
        );
        return {
            safeValues,
            safeTimes,
            anchoredValues,
            anchoredTimes,
        };
    }, [values, times, sparkMin, sparkMax]);

    const { last, delta } = useMemo(() => {
        const nums = preparedFeed.safeValues;
        const len = nums.length;
        if (len === 0) {
            return { last: NaN, delta: NaN };
        }
        const l = Number(nums[len - 1]);
        const p = len > 1 ? Number(nums[len - 2]) : l;
        const safeLast = Number.isFinite(l) ? l : NaN;
        const safePrev = Number.isFinite(p) ? p : safeLast;
        const d =
            Number.isFinite(safeLast) && Number.isFinite(safePrev)
                ? safeLast - safePrev
                : NaN;
        return { last: safeLast, delta: d };
    }, [preparedFeed]);

    const isGoodTrend = useMemo(() => {
        if (!Number.isFinite(delta)) {
            return true;
        }
        const good = delta >= 0;
        return invert ? !good : good;
    }, [delta, invert]);

    const resolvedDataSources = useMemo(() => {
        if (dataSources) {
            return dataSources;
        }
        return toLocalDataSource(
            preparedFeed.anchoredValues,
            preparedFeed.anchoredTimes
        );
    }, [dataSources, preparedFeed]);

    const mergedOptions = useMemo(
        () => ({
            ...options,
            backgroundColor: isGoodTrend ? goodColor : badColor,
            majorColor: textColor,
            trendColor: textColor,
            showSparkAreaGraph: false,
            sparklineDisplay: 'off',
            sparklineStrokeColor: '#DFA611',
            sparklineStrokeWidth: 2,
            unit: '%',
            majorFontSize: 28,
            trendFontSize: 11,
            majorValue: last,
            trendValue: delta,
            subheader,
            color: textColor,
        }),
        [
            options,
            isGoodTrend,
            goodColor,
            badColor,
            textColor,
            last,
            delta,
            subheader,
        ]
    );

    const cardWidth = width;
    const isSparkBelow = sparklineLayout === 'below';
    const isCompactHeight = height <= 100;
    const subheaderAllowance = subheader ? 18 : 0;
    let interBlockGap = 0;
    if (isSparkBelow && subheader) {
        interBlockGap = isCompactHeight ? 4 : 8;
    }
    const cardHeight = isCompactHeight
        ? Math.max(4, height - subheaderAllowance - interBlockGap - 2)
        : height - 24 - 12 - 24;
    const sparkGap = isCompactHeight && isSparkBelow ? 2 : 6;
    const minMainH = isCompactHeight ? 2 : 28;
    const mainVizHeight = isSparkBelow
        ? Math.max(
              minMainH,
              cardHeight - sparkHeight - sparkGap
          )
        : cardHeight;

    const sparklineSvg = (
        <FixedSparkline
            values={preparedFeed.safeValues}
            times={preparedFeed.safeTimes}
            width={cardWidth - sparkLeft - sparkRight}
            height={sparkHeight}
            min={sparkMin}
            max={sparkMax}
            stroke={sparkStroke}
            strokeWidth={sparkStrokeWidth}
            padLeft={sparkPadLeft}
            padRight={sparkPadRight}
            padTop={sparkPadTop}
            padBottom={sparkPadBottom}
            showHover={showSparklineHoverValues}
            valueUnit=""
        />
    );

    const overlaySparkline = (
        <div
            style={{
                position: 'absolute',
                height: sparkHeight,
                bottom: sparkBottom,
                left: sparkLeft,
                right: sparkRight,
                zIndex: 10,
                pointerEvents: showSparklineHoverValues ? 'auto' : 'none',
                color: '#000000',
            }}
        >
            {sparklineSvg}
        </div>
    );

    const content = (
        <div
            style={{
                width,
                ...(isSparkBelow
                    ? { height: 'auto', display: 'flex', flexDirection: 'column' }
                    : { height }),
            }}
        >
            <div
                style={{
                    background: 'transparent',
                    color: textColor,
                    marginBottom: (() => {
                        if (!isSparkBelow || !subheader) {
                            return 0;
                        }
                        return isCompactHeight ? 4 : 8;
                    })(),
                }}
            >
                {subheader}
            </div>
            {isSparkBelow ? (
                <div
                    style={{
                        width: cardWidth,
                        alignSelf: 'flex-start',
                        backgroundColor: mergedOptions.backgroundColor,
                        borderRadius: 4,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        marginBottom: 0,
                        paddingBottom: 0,
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            flexShrink: 0,
                        }}
                    >
                        <SingleValue
                            width={cardWidth}
                            height={mainVizHeight}
                            dataSources={resolvedDataSources}
                            options={mergedOptions}
                            onClick={onDrilldown}
                        />
                    </div>
                    <div
                        style={{
                            marginTop: sparkGap,
                            marginBottom: 0,
                            paddingBottom: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            pointerEvents: showSparklineHoverValues ? 'auto' : 'none',
                            color: '#000000',
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                paddingLeft: sparkLeft,
                                paddingRight: sparkRight,
                            }}
                        >
                            {sparklineSvg}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        position: 'relative',
                        width: cardWidth,
                        height: cardHeight,
                    }}
                >
                    <SingleValue
                        width={cardWidth}
                        height={cardHeight}
                        dataSources={resolvedDataSources}
                        options={mergedOptions}
                        onClick={onDrilldown}
                    />
                    {overlaySparkline}
                </div>
            )}
        </div>
    );

    const tooltipStyleInline = {
        display: 'block',
        width,
        minHeight: height,
        boxSizing: 'border-box',
    };

    return tooltipText ? (
        <Tooltip content={tooltipText}>
            <div style={tooltipStyleInline}>{content}</div>
        </Tooltip>
    ) : (
        content
    );
}
