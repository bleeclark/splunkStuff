import React, { useMemo } from 'react';
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

export function FixedSparkline({
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
            sparklineStrokeColor: '#DFA611',
            sparklineStrokeWidth: 2,
            showSparklineTooltip: false,
            unit: '%',
            majorFontSize: 28,
            trendFontSize: 11,
            majorValue: last,
            trendValue: delta,
            subheader,
            color: textColor,
            showSparkline: false,
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

    const cardWidth = width - 24;
    const cardHeight = height - 24 - 12 - 24;

    const content = (
        <div style={{ width, height }}>
            <div style={{ background: 'transparent', color: textColor }}>
                {subheader}
            </div>
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
                <div
                    style={{
                        position: 'absolute',
                        height: sparkHeight,
                        bottom: sparkBottom,
                        left: sparkLeft,
                        right: sparkRight,
                        zIndex: 10,
                        pointerEvents: 'none',
                        color: '#000000',
                    }}
                >
                    <FixedSparkline
                        values={preparedFeed.safeValues}
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
                    />
                </div>
            </div>
        </div>
    );

    return tooltipText ? (
        <Tooltip content={tooltipText}>{content}</Tooltip>
    ) : (
        content
    );
}
