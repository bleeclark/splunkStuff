import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    ARC_END,
    ARC_START,
    HEIGHT,
    WIDTH,
    describeArc,
    pointAt,
    valueToAngle,
} from '../../lib/radialMeterArc.mjs';

const STATUS = [
    { key: 'critical', label: 'Critical', color: '#D94E4E' },
    { key: 'warning', label: 'Warning', color: '#DFA611' },
    { key: 'healthy', label: 'Healthy', color: '#2E9E6F' },
];

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function polarLine(angle, inner, outer) {
    const a = pointAt(angle, inner);
    const b = pointAt(angle, outer);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

function formatNumber(value, precision) {
    if (!Number.isFinite(value)) {
        return '-';
    }
    return value.toLocaleString(undefined, {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision,
    });
}

function statusFor(value, warningAt, criticalAt, invertStatus) {
    if (invertStatus) {
        if (value >= criticalAt) return STATUS[0];
        if (value >= warningAt) return STATUS[1];
        return STATUS[2];
    }
    if (value <= criticalAt) return STATUS[0];
    if (value <= warningAt) return STATUS[1];
    return STATUS[2];
}

export default function AdvancedRadialMeter({
    value = 73,
    maxValue = 100,
    target = 80,
    warningAt = 55,
    criticalAt = 30,
    invertStatus = false,
    title = 'Capacity',
    subtitle = 'Current utilization',
    unit = '',
    precision = 0,
    backgroundColor = '#FFFFFF',
    textColor = '#303B46',
    trackColor = '#D9DEE3',
    lowColor = '#D94E4E',
    mediumColor = '#DFA611',
    highColor = '#2E9E6F',
    needleColor = '#243447',
    width = 320,
    height = 250,
}) {
    const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 100;
    const safeValue = clamp(Number(value), 0, safeMax);
    const safeTarget = clamp(Number(target), 0, safeMax);
    const safeWarning = clamp(Number(warningAt), 0, safeMax);
    const safeCritical = clamp(Number(criticalAt), 0, safeMax);
    const percent = safeMax > 0 ? (safeValue / safeMax) * 100 : 0;
    const status = statusFor(safeValue, safeWarning, safeCritical, invertStatus);
    const targetDelta = safeValue - safeTarget;

    const geometry = useMemo(() => {
        const segments = invertStatus
            ? [
                  { from: 0, to: safeWarning, color: highColor },
                  { from: safeWarning, to: safeCritical, color: mediumColor },
                  { from: safeCritical, to: safeMax, color: lowColor },
              ]
            : [
                  { from: 0, to: safeCritical, color: lowColor },
                  { from: safeCritical, to: safeWarning, color: mediumColor },
                  { from: safeWarning, to: safeMax, color: highColor },
              ];

        const ticks = [];
        for (let i = 0; i <= 10; i += 1) {
            const tickValue = (safeMax / 10) * i;
            const angle = valueToAngle(tickValue, safeMax);
            ticks.push({
                value: tickValue,
                major: i % 5 === 0,
                line: polarLine(angle, i % 5 === 0 ? 82 : 86, 94),
            });
        }

        return {
            segments,
            ticks,
            valueAngle: valueToAngle(safeValue, safeMax),
            targetAngle: valueToAngle(safeTarget, safeMax),
        };
    }, [
        highColor,
        invertStatus,
        lowColor,
        mediumColor,
        safeCritical,
        safeMax,
        safeTarget,
        safeValue,
        safeWarning,
    ]);

    const needleEnd = pointAt(geometry.valueAngle, 63);
    const targetLine = polarLine(geometry.targetAngle, 62, 99);
    const minLabel = pointAt(ARC_START, 110);
    const maxLabel = pointAt(ARC_END, 110);

    return (
        <div
            style={{
                alignItems: 'center',
                background: backgroundColor,
                boxSizing: 'border-box',
                color: textColor,
                display: 'flex',
                fontFamily: "'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                height: '100%',
                justifyContent: 'center',
                minHeight: 250,
                padding: 8,
                width: '100%',
            }}
        >
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${WIDTH} ${HEIGHT + 34}`}
                role="img"
                aria-label={`${title} radial meter`}
                style={{ display: 'block', maxHeight: '100%', maxWidth: '100%' }}
            >
                <g transform={`translate(${WIDTH / 2}, ${HEIGHT / 2 + 6})`}>
                    <path
                        d={describeArc(0, 0, 66, 92, ARC_START, ARC_END)}
                        fill={trackColor}
                    />
                    {geometry.segments.map((segment) => (
                        <path
                            key={`${segment.from}-${segment.to}`}
                            d={describeArc(
                                0,
                                0,
                                68,
                                90,
                                valueToAngle(segment.from, safeMax),
                                valueToAngle(segment.to, safeMax)
                            )}
                            fill={segment.color}
                            opacity={0.24}
                        />
                    ))}
                    <path
                        d={describeArc(
                            0,
                            0,
                            70,
                            86,
                            ARC_START,
                            geometry.valueAngle
                        )}
                        fill={status.color}
                    />
                    {geometry.ticks.map((tick) => (
                        <line
                            key={tick.value}
                            {...tick.line}
                            stroke={textColor}
                            strokeOpacity={tick.major ? 0.46 : 0.22}
                            strokeWidth={tick.major ? 2 : 1}
                            strokeLinecap="round"
                        />
                    ))}
                    <line
                        {...targetLine}
                        stroke="#1B5E9A"
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                    <line
                        x1={0}
                        y1={0}
                        x2={needleEnd.x}
                        y2={needleEnd.y}
                        stroke={needleColor}
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                    <circle cx={0} cy={0} r={6} fill={needleColor} />
                    <text
                        textAnchor="middle"
                        y={-26}
                        fill={textColor}
                        style={{ fontSize: 12, fontWeight: 700 }}
                    >
                        {title}
                    </text>
                    <text
                        textAnchor="middle"
                        y={-7}
                        fill={status.color}
                        style={{ fontSize: 34, fontWeight: 700 }}
                    >
                        {formatNumber(safeValue, precision)}
                        {unit}
                    </text>
                    <text
                        textAnchor="middle"
                        y={14}
                        fill={textColor}
                        opacity={0.72}
                        style={{ fontSize: 9, fontWeight: 700 }}
                    >
                        {percent.toFixed(0)}% of max
                    </text>
                    <text
                        x={minLabel.x}
                        y={minLabel.y}
                        textAnchor="middle"
                        fill={textColor}
                        opacity={0.64}
                        style={{ fontSize: 8, fontWeight: 700 }}
                    >
                        0
                    </text>
                    <text
                        x={maxLabel.x}
                        y={maxLabel.y}
                        textAnchor="middle"
                        fill={textColor}
                        opacity={0.64}
                        style={{ fontSize: 8, fontWeight: 700 }}
                    >
                        {formatNumber(safeMax, 0)}
                    </text>
                    <g transform="translate(-82 70)">
                        <rect
                            width="164"
                            height="40"
                            rx="4"
                            fill="#F4F6F8"
                            stroke="#D6DCE2"
                        />
                        <circle cx="14" cy="13" r="4" fill={status.color} />
                        <text x="24" y="16" fill={textColor} style={{ fontSize: 9, fontWeight: 700 }}>
                            {status.label}
                        </text>
                        <text x="24" y="30" fill={textColor} opacity={0.68} style={{ fontSize: 8 }}>
                            Target {formatNumber(safeTarget, precision)}
                            {unit} ({targetDelta >= 0 ? '+' : ''}
                            {formatNumber(targetDelta, precision)}
                            {unit})
                        </text>
                        <text
                            x="152"
                            y="16"
                            fill="#1B5E9A"
                            textAnchor="end"
                            style={{ fontSize: 8, fontWeight: 700 }}
                        >
                            TARGET
                        </text>
                        <text
                            x="152"
                            y="30"
                            fill={textColor}
                            textAnchor="end"
                            opacity={0.68}
                            style={{ fontSize: 8 }}
                        >
                            {subtitle}
                        </text>
                    </g>
                </g>
            </svg>
        </div>
    );
}

AdvancedRadialMeter.propTypes = {
    value: PropTypes.number,
    maxValue: PropTypes.number,
    target: PropTypes.number,
    warningAt: PropTypes.number,
    criticalAt: PropTypes.number,
    invertStatus: PropTypes.bool,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    unit: PropTypes.string,
    precision: PropTypes.number,
    backgroundColor: PropTypes.string,
    textColor: PropTypes.string,
    trackColor: PropTypes.string,
    lowColor: PropTypes.string,
    mediumColor: PropTypes.string,
    highColor: PropTypes.string,
    needleColor: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
};

