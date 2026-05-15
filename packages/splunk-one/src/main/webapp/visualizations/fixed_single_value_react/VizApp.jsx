import React, { useMemo } from 'react';
import {
    DEFAULT_DOWN_COLOR,
    DEFAULT_UP_COLOR,
    trendBackground,
    trendDelta,
} from '../../lib/splunkstuffTrendColors';
import { sparkBounds, sparkPath } from './sparkPath';

function sanitizeHexColor(raw, fallback) {
    if (typeof raw !== 'string') {
        return fallback;
    }
    const s = raw.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(s)) {
        return s;
    }
    return fallback;
}

export default function VizApp({
    values = [],
    sparkMin = 0,
    sparkMax = 100,
    goodColor = DEFAULT_UP_COLOR,
    badColor = DEFAULT_DOWN_COLOR,
    textColor = '#FFFFFF',
    sparkStroke = '#FFFFFF',
    unit = '%',
    subheader = '',
}) {
    const nums = useMemo(
        () =>
            (Array.isArray(values) ? values : [])
                .map(Number)
                .filter(Number.isFinite),
        [values]
    );

    const scale = useMemo(
        () => sparkBounds(sparkMin, sparkMax),
        [sparkMin, sparkMax]
    );

    const { last, delta, bg, safeText, safeStroke } = useMemo(() => {
        const safeGood = sanitizeHexColor(goodColor, DEFAULT_UP_COLOR);
        const safeBad = sanitizeHexColor(badColor, DEFAULT_DOWN_COLOR);
        const d = trendDelta(nums);
        const safeLast = nums.length ? Number(nums[nums.length - 1]) : NaN;

        return {
            last: safeLast,
            delta: d,
            bg: trendBackground(d, safeGood, safeBad),
            safeText: sanitizeHexColor(textColor, '#FFFFFF'),
            safeStroke: sanitizeHexColor(sparkStroke, '#FFFFFF'),
        };
    }, [nums, goodColor, badColor, textColor, sparkStroke]);

    const majorText = useMemo(() => {
        if (!Number.isFinite(last)) {
            return '—';
        }
        return (
            last.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
            String(unit || '')
        );
    }, [last, unit]);

    const trendText = useMemo(() => {
        if (!Number.isFinite(delta)) {
            return '—';
        }
        const arrow = delta >= 0 ? '\u25b2 ' : '\u25bc ';
        return (
            arrow +
            delta.toLocaleString(undefined, { maximumFractionDigits: 2 })
        );
    }, [delta]);

    const d = useMemo(
        () => sparkPath(nums, 360, 28, 4, 4, 2, 2, scale.min, scale.max),
        [nums, scale.min, scale.max]
    );

    if (nums.length === 0) {
        return (
            <div className="splunk-one-fixed-single-value-react-viz__err">
                No numeric results to display.
            </div>
        );
    }

    return (
        <div
            className="splunk-one-fixed-single-value-react-viz"
            style={{ backgroundColor: bg, color: safeText }}
        >
            {subheader ? (
                <div className="splunk-one-fixed-single-value-react-viz__header">
                    {subheader}
                </div>
            ) : null}

            <div className="splunk-one-fixed-single-value-react-viz__body">
                <div className="splunk-one-fixed-single-value-react-viz__major">
                    {majorText}
                </div>
                <div className="splunk-one-fixed-single-value-react-viz__trend">
                    {trendText}
                </div>

                <div className="splunk-one-fixed-single-value-react-viz__spark">
                    {d ? (
                        <svg
                            preserveAspectRatio="none"
                            viewBox="0 0 360 28"
                            style={{ display: 'block', width: '100%', height: '100%' }}
                        >
                            <title>sparkline</title>
                            <path
                                d={d}
                                fill="none"
                                stroke={safeStroke}
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
