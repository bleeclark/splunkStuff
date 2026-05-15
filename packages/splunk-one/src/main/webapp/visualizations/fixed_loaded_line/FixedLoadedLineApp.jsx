import React, { useCallback, useEffect, useRef, useState } from 'react';
import LineChart from '../../components/visualizations/LineChart';

export default function FixedLoadedLineApp({
    values = [],
    times = [],
    comparisonSeries,
    min,
    max,
    stroke = 'rgba(255,255,255,0.95)',
    strokeWidth = 2,
    background = '#0B1F3B',
    goodColor = '#01417F',
    badColor = '#DFA611',
    textColor = '#FFFFFF',
    unit = '%',
    subheader = '',
    smoothing = 'none',
    smaWindow = 3,
    maxPoints,
    thresholdMin,
    thresholdMax,
    target,
    anomalyMode = 'none',
    anomalySensitivity = 3,
    drilldown = false,
    drilldownQuery,
    showXAxis = false,
    showHover = true,
}) {
    const hostRef = useRef(null);
    const [size, setSize] = useState({ width: 400, height: 105 });

    const measure = useCallback(() => {
        const el = hostRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const w = Math.max(120, Math.floor(rect.width));
        const h = Math.max(80, Math.floor(rect.height));
        setSize({ width: w, height: h });
    }, []);

    useEffect(() => {
        measure();
        const el = hostRef.current;
        if (!el || typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const ro = new ResizeObserver(() => measure());
        ro.observe(el);
        return () => ro.disconnect();
    }, [measure]);

    return (
        <div
            ref={hostRef}
            className="splunk-one-fixed-loaded-line-viz"
            style={{
                width: '100%',
                height: '100%',
                minHeight: 80,
                boxSizing: 'border-box',
                pointerEvents: 'auto',
            }}
        >
            <LineChart
                values={values}
                times={times}
                comparisonSeries={comparisonSeries}
                width={size.width}
                height={size.height}
                min={min}
                max={max}
                stroke={stroke}
                strokeWidth={strokeWidth}
                background={background}
                showMajor
                goodColor={goodColor}
                badColor={badColor}
                textColor={textColor}
                unit={unit}
                subheader={subheader}
                centerMajor
                colorPlacement="full"
                smoothing={smoothing}
                smaWindow={smaWindow}
                maxPoints={maxPoints || undefined}
                thresholdMin={thresholdMin}
                thresholdMax={thresholdMax}
                target={target}
                anomalyMode={anomalyMode}
                anomalySensitivity={anomalySensitivity}
                drilldown={drilldown}
                drilldownQuery={drilldownQuery}
                showXAxis={showXAxis}
                showHover={showHover}
            />
        </div>
    );
}
