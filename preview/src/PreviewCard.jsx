import React, { useMemo } from 'react';
import FixedSparkline from './FixedSparkline.jsx';

function trendFromValues(values) {
    const nums = (Array.isArray(values) ? values : [])
        .map(Number)
        .filter(Number.isFinite);
    if (nums.length === 0) {
        return { last: NaN, delta: NaN };
    }
    const last = nums[nums.length - 1];
    const prev = nums.length > 1 ? nums[nums.length - 2] : last;
    return { last, delta: last - prev };
}

/** Approximates your `NewSingleValue` layout (not the real Splunk `<SingleValue />`). */
export default function PreviewCard({
    feed,
    width = 400,
    height = 130,
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
    sparkValueUnit = '',
}) {
    const { subheader = '', values = [], times = [] } = feed || {};
    const { last, delta } = useMemo(() => trendFromValues(values), [values]);
    const isGoodTrend = useMemo(() => {
        if (!Number.isFinite(delta)) {
            return true;
        }
        const good = delta >= 0;
        return invert ? !good : good;
    }, [delta, invert]);

    const bg = isGoodTrend ? goodColor : badColor;
    const cardWidth = width - 24;
    const cardHeight = height - 24 - 12 - 24;
    const major = Number.isFinite(last) ? `${last}%` : '—';

    return (
        <div style={{ width, height, background: bg, color: textColor }}>
            <div style={{ padding: '0 12px', fontSize: 12, opacity: 0.95 }}>
                {subheader}
            </div>
            <div
                style={{
                    position: 'relative',
                    width: cardWidth,
                    height: cardHeight,
                    margin: '0 12px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        fontSize: 28,
                        fontWeight: 600,
                    }}
                >
                    {major}
                    {Number.isFinite(delta) && (
                        <span style={{ marginLeft: 12, fontSize: 11, opacity: 0.9 }}>
                            {delta >= 0 ? '+' : ''}
                            {delta}%
                        </span>
                    )}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        height: sparkHeight,
                        bottom: sparkBottom,
                        left: sparkLeft,
                        right: sparkRight,
                        zIndex: 10,
                        pointerEvents: showSparklineHoverValues
                            ? 'auto'
                            : 'none',
                    }}
                >
                    <FixedSparkline
                        values={values}
                        times={
                            Array.isArray(times) && times.length === values.length
                                ? times
                                : []
                        }
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
                        valueUnit={sparkValueUnit}
                    />
                </div>
            </div>
        </div>
    );
}
