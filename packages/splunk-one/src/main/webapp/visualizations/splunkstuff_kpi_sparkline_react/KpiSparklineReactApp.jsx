/* eslint-disable react/prop-types */
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clamp, seriesIndexFromPointerMeet } from '../../lib/bgdhampVizHoverMath.mjs';
import { trendBackground, trendDelta } from '../../lib/bgdhampTrendColors';
import {
    readBool,
    readConfig,
    readConfigLabel,
    readFloat,
    safeColor,
} from '../splunkVizData';

const NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_sparkline_react.';
export const VIZ_BUILD = '20260601-kpi-sparkline-blank-legacy-value-prefix';

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

function fixed(n, precision) {
    if (!Number.isFinite(n)) {
        return '--';
    }
    return n.toLocaleString(undefined, {
        minimumFractionDigits: Math.max(0, precision),
        maximumFractionDigits: Math.max(0, precision),
    });
}

function formatMajor(value, precision, unit) {
    return `${fixed(value, precision)}${unit || ''}`;
}

function formatHoverValue(value, precision, prefix) {
    const core = fixed(value, precision);
    const safePrefix =
        String(prefix || '').trim().toLowerCase() === 'value'
            ? ''
            : String(prefix || '').trim();
    return safePrefix ? `${safePrefix}: ${core}` : core;
}

function formatDelta(delta, last, mode, precision) {
    if (!Number.isFinite(delta)) {
        return '--';
    }
    const arrow = delta >= 0 ? '\u25b2' : '\u25bc';
    if (mode === 'percent') {
        const previous = last - delta;
        const pct = previous === 0 ? NaN : (delta / previous) * 100;
        return `${arrow} ${fixed(pct, precision)}%`;
    }
    return `${arrow} ${fixed(delta, precision)}`;
}

function sparkPath(values, width, height, padLeft, padRight, padTop, padBottom, min, max) {
    const n = values.length;
    if (n < 2) {
        return '';
    }
    const innerW = Math.max(1, width - padLeft - padRight);
    const innerH = Math.max(1, height - padTop - padBottom);
    return values
        .map((value, index) => {
            const x = padLeft + (index / (n - 1)) * innerW;
            const ratio = (value - min) / (max - min);
            const y = padTop + innerH - clamp(ratio, 0, 1) * innerH;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
}

function sparkXY(values, index, width, height, padLeft, padRight, padTop, padBottom, min, max) {
    const innerW = Math.max(1, width - padLeft - padRight);
    const innerH = Math.max(1, height - padTop - padBottom);
    const x = padLeft + (index / Math.max(1, values.length - 1)) * innerW;
    const ratio = (values[index] - min) / (max - min);
    const y = padTop + innerH - clamp(ratio, 0, 1) * innerH;
    return { x, y };
}

function parseSparkPointLabels(raw) {
    const labels = {};
    String(raw || '')
        .split(',')
        .forEach((part) => {
            const idx = part.indexOf(':');
            if (idx <= 0) {
                return;
            }
            const key = parseInt(part.slice(0, idx).trim(), 10);
            const label = part.slice(idx + 1).trim();
            if (Number.isInteger(key) && label) {
                labels[key] = label;
            }
        });
    return labels;
}

function formatHoverTime(raw) {
    if (raw == null || raw === '') {
        return '';
    }
    const ms = typeof raw === 'number' ? raw * (raw < 4102444800 ? 1000 : 1) : Date.parse(raw);
    if (Number.isFinite(ms)) {
        return new Date(ms).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return String(raw);
}

export default function KpiSparklineReactApp({ values = [], times = [], config = {}, reflowTick = 0 }) {
    const rootRef = useRef(null);
    const sparkRef = useRef(null);
    const [sparkRect, setSparkRect] = useState({ width: 360, height: 58 });
    const [hoverIdx, setHoverIdx] = useState(null);
    const [tooltipViewport, setTooltipViewport] = useState(null);
    const [vizDocument, setVizDocument] = useState(null);

    const goodColor = safeColor(readConfig(config, NS, 'goodColor', '#01417F'), '#01417F');
    const badColor = safeColor(readConfig(config, NS, 'badColor', '#DFA611'), '#DFA611');
    const textColor = safeColor(readConfig(config, NS, 'textColor', '#FFFFFF'), '#FFFFFF');
    const emptyBackground = safeColor(readConfig(config, NS, 'background', '#0B1F3B'), '#0B1F3B');
    const sparkStroke = safeColor(readConfig(config, NS, 'sparkStroke', '#FFFFFF'), '#FFFFFF');
    const unit = readConfig(config, NS, 'unit', '');
    const subheader = readConfigLabel(config, NS, 'subheader', '');
    const majorLabel = readConfigLabel(config, NS, 'majorLabel', '');
    const deltaLabel = readConfigLabel(config, NS, 'deltaLabel', '');
    const badgeText = readConfigLabel(config, NS, 'badgeText', '');
    const emptyText = readConfigLabel(config, NS, 'emptyText', 'No numeric results to display.');
    const tooltipPrefix = readConfigLabel(config, NS, 'tooltipPrefix', '');
    const pointLabels = useMemo(
        () => parseSparkPointLabels(readConfigLabel(config, NS, 'sparkPointLabels', '')),
        [config]
    );

    const precision = Math.max(0, Math.min(6, Math.floor(readFloat(config, NS, 'precision', 2))));
    const showDelta = readBool(config, NS, 'showDelta', true);
    const showSparkline = readBool(config, NS, 'showSparkline', true);
    const showHover = readBool(config, NS, 'showHover', true);
    const showHoverAnnotation = readBool(config, NS, 'showHoverAnnotation', true);
    const showPointLabels = readBool(config, NS, 'showPointLabels', false);
    const showTarget = readBool(config, NS, 'showTarget', false);
    const showThresholdBand = readBool(config, NS, 'showThresholdBand', false);
    const sparkAuto = readBool(config, NS, 'sparkAuto', false);
    const invertTrend = readBool(config, NS, 'invertTrend', false);
    const deltaMode = String(readConfig(config, NS, 'deltaMode', 'absolute') || 'absolute');
    const sparkStrokeWidth = Math.max(1, readFloat(config, NS, 'sparkStrokeWidth', 2));
    const sparkMin = readFloat(config, NS, 'sparkMin', NaN);
    const sparkMax = readFloat(config, NS, 'sparkMax', NaN);
    const target = readFloat(config, NS, 'target', 50);
    const thresholdMin = readFloat(config, NS, 'thresholdMin', 20);
    const thresholdMax = readFloat(config, NS, 'thresholdMax', 80);

    const cleanValues = useMemo(
        () => (Array.isArray(values) ? values.map(Number).filter(Number.isFinite) : []),
        [values]
    );
    const bounds = useMemo(
        () => deriveSparkBounds(cleanValues, sparkMin, sparkMax, sparkAuto),
        [cleanValues, sparkMin, sparkMax, sparkAuto]
    );
    const rawDelta = trendDelta(cleanValues);
    const visualDelta = invertTrend && Number.isFinite(rawDelta) ? -rawDelta : rawDelta;
    const last = cleanValues.length ? cleanValues[cleanValues.length - 1] : NaN;
    const background =
        cleanValues.length >= 2 ? trendBackground(visualDelta, goodColor, badColor) : emptyBackground;

    const measure = useCallback(() => {
        const el = sparkRef.current;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        setSparkRect({
            width: Math.max(120, Math.floor(rect.width)),
            height: Math.max(36, Math.floor(rect.height)),
        });
    }, []);

    useLayoutEffect(() => {
        measure();
        const root = rootRef.current;
        if (root) {
            setVizDocument(root.ownerDocument || document);
        }
        const el = sparkRef.current;
        if (!el || typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [measure, reflowTick, showSparkline]);

    const padLeft = 34;
    const padRight = 34;
    const padTop = 14;
    const padBottom = 6;
    const path = useMemo(
        () =>
            sparkPath(
                cleanValues,
                sparkRect.width,
                sparkRect.height,
                padLeft,
                padRight,
                padTop,
                padBottom,
                bounds.min,
                bounds.max
            ),
        [cleanValues, sparkRect, bounds]
    );
    const pointFor = useCallback(
        (index) =>
            sparkXY(
                cleanValues,
                index,
                sparkRect.width,
                sparkRect.height,
                padLeft,
                padRight,
                padTop,
                padBottom,
                bounds.min,
                bounds.max
            ),
        [cleanValues, sparkRect, bounds]
    );

    const handlePointerMove = useCallback(
        (event) => {
            if (!showHover || cleanValues.length < 2 || !sparkRef.current) {
                return;
            }
            const idx = seriesIndexFromPointerMeet(
                event.clientX,
                event.clientY,
                sparkRef.current,
                sparkRect.width,
                sparkRect.height,
                padLeft,
                padRight,
                cleanValues.length
            );
            setHoverIdx(idx);
            setTooltipViewport(idx == null ? null : { x: event.clientX, y: event.clientY });
        },
        [showHover, cleanValues.length, sparkRect]
    );

    const clearHover = useCallback(() => {
        setHoverIdx(null);
        setTooltipViewport(null);
    }, []);

    if (cleanValues.length < 2) {
        return (
            <div
                ref={rootRef}
                className="bgdhamp-sparkline-value-viz"
                data-bgdhamp-viz-build={VIZ_BUILD}
                style={{ background: emptyBackground, color: textColor }}
            >
                <div className="bgdhamp-sparkline-value-viz__err">{emptyText}</div>
            </div>
        );
    }

    const hoverValue = hoverIdx != null ? cleanValues[hoverIdx] : NaN;
    const hoverLabel = hoverIdx != null ? pointLabels[hoverIdx] : '';
    const hoverTime = hoverIdx != null ? formatHoverTime(times[hoverIdx]) : '';
    const hoverPoint = hoverIdx != null ? pointFor(hoverIdx) : null;
    const targetPoint =
        showTarget && Number.isFinite(target)
            ? sparkXY([target], 0, sparkRect.width, sparkRect.height, padLeft, padRight, padTop, padBottom, bounds.min, bounds.max)
            : null;
    const thresholdY1 =
        showThresholdBand && Number.isFinite(thresholdMin)
            ? sparkXY([thresholdMin], 0, sparkRect.width, sparkRect.height, padLeft, padRight, padTop, padBottom, bounds.min, bounds.max).y
            : null;
    const thresholdY2 =
        showThresholdBand && Number.isFinite(thresholdMax)
            ? sparkXY([thresholdMax], 0, sparkRect.width, sparkRect.height, padLeft, padRight, padTop, padBottom, bounds.min, bounds.max).y
            : null;
    const labelAttrsForPoint = (point) => {
        if (point.x <= padLeft + 2) {
            return { textAnchor: 'start', dx: 2 };
        }
        if (point.x >= sparkRect.width - padRight - 2) {
            return { textAnchor: 'end', dx: -2 };
        }
        return { textAnchor: 'middle' };
    };

    return (
        <div
            ref={rootRef}
            className="bgdhamp-sparkline-value-viz"
            data-bgdhamp-viz-build={VIZ_BUILD}
            style={{ background, color: textColor }}
        >
            {badgeText ? (
                <div className="bgdhamp-sparkline-value-viz__badge" title={badgeText}>
                    {badgeText}
                </div>
            ) : null}
            {subheader ? <div className="bgdhamp-sparkline-value-viz__header">{subheader}</div> : null}

            <div className="bgdhamp-sparkline-value-viz__body">
                <div className="bgdhamp-sparkline-value-viz__major">
                    {majorLabel ? (
                        <div className="bgdhamp-sparkline-value-viz__indicatorLabel">
                            {majorLabel}
                        </div>
                    ) : null}
                    <div className="bgdhamp-sparkline-value-viz__majorValue">
                        {formatMajor(last, precision, unit)}
                    </div>
                </div>

                {showDelta ? (
                    <div className="bgdhamp-sparkline-value-viz__trend">
                        {deltaLabel ? (
                            <div className="bgdhamp-sparkline-value-viz__indicatorLabel">
                                {deltaLabel}
                            </div>
                        ) : null}
                        <div className="bgdhamp-sparkline-value-viz__trendValue">
                            {formatDelta(rawDelta, last, deltaMode, precision)}
                        </div>
                    </div>
                ) : null}

                {showHover && showHoverAnnotation && hoverIdx != null ? (
                    <div className="bgdhamp-sparkline-value-viz__hoverAnn">
                        {[hoverLabel, formatHoverValue(hoverValue, precision, tooltipPrefix), hoverTime]
                            .filter(Boolean)
                            .join(' | ')}
                    </div>
                ) : null}

                {showSparkline ? (
                    <div
                        ref={sparkRef}
                        className="bgdhamp-sparkline-value-viz__spark"
                        onPointerMove={handlePointerMove}
                        onPointerLeave={clearHover}
                    >
                        <svg
                            viewBox={`0 0 ${sparkRect.width} ${sparkRect.height}`}
                            preserveAspectRatio="none"
                            role="img"
                            aria-label="sparkline"
                        >
                            {thresholdY1 != null && thresholdY2 != null ? (
                                <rect
                                    x={padLeft}
                                    y={Math.min(thresholdY1, thresholdY2)}
                                    width={Math.max(0, sparkRect.width - padLeft - padRight)}
                                    height={Math.abs(thresholdY2 - thresholdY1)}
                                    fill="rgba(0,0,0,0.18)"
                                />
                            ) : null}
                            {targetPoint ? (
                                <line
                                    x1={padLeft}
                                    x2={sparkRect.width - padRight}
                                    y1={targetPoint.y}
                                    y2={targetPoint.y}
                                    stroke="rgba(255,255,255,0.55)"
                                    strokeWidth="1"
                                    strokeDasharray="4 3"
                                />
                            ) : null}
                            {path ? (
                                <path
                                    d={path}
                                    fill="none"
                                    stroke={sparkStroke}
                                    strokeWidth={sparkStrokeWidth}
                                    vectorEffect="non-scaling-stroke"
                                />
                            ) : null}
                            {showPointLabels
                                ? Object.keys(pointLabels).map((key) => {
                                      const idx = Number(key);
                                      if (idx < 0 || idx >= cleanValues.length) {
                                          return null;
                                      }
                                      const point = pointFor(idx);
                                      const labelAttrs = labelAttrsForPoint(point);
                                      return (
                                          <g key={key}>
                                              <circle cx={point.x} cy={point.y} r="3" fill={sparkStroke} />
                                              <text
                                                  x={point.x}
                                                  y={Math.max(10, point.y - 8)}
                                                  {...labelAttrs}
                                                  fill={textColor}
                                                  fontSize="11"
                                                  fontWeight="700"
                                              >
                                                  {pointLabels[key]}
                                              </text>
                                          </g>
                                      );
                                  })
                                : null}
                            {hoverPoint ? (
                                <g className="bgdhamp-sparkline-value-viz__hover">
                                    <line
                                        x1={hoverPoint.x}
                                        x2={hoverPoint.x}
                                        y1={padTop}
                                        y2={sparkRect.height - padBottom}
                                        stroke="rgba(255,255,255,0.25)"
                                    />
                                    <circle
                                        cx={hoverPoint.x}
                                        cy={hoverPoint.y}
                                        r="4"
                                        fill={sparkStroke}
                                        stroke="rgba(0,0,0,0.35)"
                                    />
                                </g>
                            ) : null}
                        </svg>
                    </div>
                ) : null}
            </div>

            {showHover &&
            hoverIdx != null &&
            tooltipViewport &&
            vizDocument &&
            vizDocument.body
                ? createPortal(
                      <div className="bgdhamp-sparkline-value-viz__tooltip" style={{ display: 'block', left: tooltipViewport.x, top: tooltipViewport.y }}>
                          {hoverLabel ? (
                              <div className="bgdhamp-sparkline-value-viz__tooltipPoint">
                                  {hoverLabel}
                              </div>
                          ) : null}
                          <div className="bgdhamp-sparkline-value-viz__tooltipValue">
                              {formatHoverValue(hoverValue, precision, tooltipPrefix)}
                          </div>
                          {hoverTime ? (
                              <div className="bgdhamp-sparkline-value-viz__tooltipTime">
                                  {hoverTime}
                              </div>
                          ) : null}
                      </div>,
                      vizDocument.body
                  )
                : null}
        </div>
    );
}
