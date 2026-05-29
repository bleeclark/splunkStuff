import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LineChart from '../../components/visualizations/LineChart';
import {
    readBool,
    readConfig,
    readConfigLabel,
    readFloat,
    safeColor,
} from '../splunkVizData';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_sparkline_react.';

function deriveSparkBounds(values, sparkMin, sparkMax, sparkAuto) {
    const finite = (Array.isArray(values) ? values : []).filter(Number.isFinite);
    if (!finite.length) {
        return { min: 0, max: 1 };
    }
    let min = Number.isFinite(sparkMin) ? sparkMin : NaN;
    let max = Number.isFinite(sparkMax) ? sparkMax : NaN;
    if (!Number.isFinite(min) || !Number.isFinite(max) || sparkAuto) {
        min = Math.min(...finite);
        max = Math.max(...finite);
        if (max <= min) {
            max = min + 1;
        }
    }
    if (min > max) {
        const t = min;
        min = max;
        max = t;
    }
    return { min, max };
}

export default function KpiSparklineReactApp({ values = [], times = [], config = {} }) {
    const hostRef = useRef(null);
    const [size, setSize] = useState({ width: 360, height: 260 });

    const goodColor = safeColor(readConfig(config, NS, 'goodColor', '#01417F'), '#01417F');
    const badColor = safeColor(readConfig(config, NS, 'badColor', '#DFA611'), '#DFA611');
    const textColor = safeColor(readConfig(config, NS, 'textColor', '#FFFFFF'), '#FFFFFF');
    const background = safeColor(readConfig(config, NS, 'background', '#0B1F3B'), '#0B1F3B');
    const stroke = safeColor(readConfig(config, NS, 'sparkStroke', '#FFFFFF'), '#FFFFFF');
    const unit = readConfig(config, NS, 'unit', '');
    const subheader = readConfigLabel(config, NS, 'subheader', '');
    const majorLabel = readConfigLabel(config, NS, 'majorLabel', 'Current:');
    const deltaLabel = readConfigLabel(config, NS, 'deltaLabel', 'Change:');
    const badgeText = readConfigLabel(config, NS, 'badgeText', 'Demo KPI');
    const showDelta = readBool(config, NS, 'showDelta', true);
    const showHover = readBool(config, NS, 'showHover', true);
    const showHoverAnnotation = readBool(config, NS, 'showHoverAnnotation', true);
    const sparkAuto = readBool(config, NS, 'sparkAuto', false);
    const sparkMin = readFloat(config, NS, 'sparkMin', NaN);
    const sparkMax = readFloat(config, NS, 'sparkMax', NaN);
    const bounds = useMemo(
        () => deriveSparkBounds(values, sparkMin, sparkMax, sparkAuto),
        [values, sparkMin, sparkMax, sparkAuto]
    );

    const measure = useCallback(() => {
        const el = hostRef.current;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        setSize({
            width: Math.max(120, Math.floor(rect.width)),
            height: Math.max(160, Math.floor(rect.height)),
        });
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
            className="splunkstuff-sparkline-value-viz"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: 200,
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                overflow: 'hidden',
            }}
        >
            {badgeText ? (
                <div
                    className="splunkstuff-sparkline-value-viz__badge"
                    title={badgeText}
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 10,
                        zIndex: 6,
                        maxWidth: '45%',
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        textAlign: 'right',
                        color: '#fff',
                        background: 'rgba(0,0,0,0.55)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: 4,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                        pointerEvents: 'none',
                    }}
                >
                    {badgeText}
                </div>
            ) : null}

            <LineChart
                values={values}
                times={times}
                width={size.width}
                height={size.height}
                min={bounds.min}
                max={bounds.max}
                stroke={stroke}
                background={background}
                goodColor={goodColor}
                badColor={badColor}
                textColor={textColor}
                unit={unit}
                subheader={subheader}
                showMajor
                centerMajor
                stackedMajor
                showDelta={showDelta}
                majorLabel={majorLabel}
                deltaLabel={deltaLabel}
                colorPlacement="full"
                showHover={showHover}
                showHoverAnnotation={showHoverAnnotation}
            />
        </div>
    );
}
