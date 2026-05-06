import React, { useMemo } from 'react';
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
    goodColor = '#01417F',
    badColor = '#DFA611',
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
        const len = nums.length;
        const l = len ? Number(nums[len - 1]) : NaN;
        const p = len > 1 ? Number(nums[len - 2]) : l;
        const safeLast = Number.isFinite(l) ? l : NaN;
        const safePrev = Number.isFinite(p) ? p : safeLast;
        const d =
            Number.isFinite(safeLast) && Number.isFinite(safePrev)
                ? safeLast - safePrev
                : NaN;
        const good = Number.isFinite(d) ? d >= 0 : true;

        const safeGood = sanitizeHexColor(goodColor, '#01417F');
        const safeBad = sanitizeHexColor(badColor, '#DFA611');

        return {
            last: safeLast,
            delta: d,
            bg: good ? safeGood : safeBad,
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
