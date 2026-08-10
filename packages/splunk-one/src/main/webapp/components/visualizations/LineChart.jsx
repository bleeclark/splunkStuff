import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { trendBackground } from '../../lib/bgdhampTrendColors';
import {
    clamp,
    clampTooltipViewport,
    seriesIndexFromPointerMeet,
    seriesIndexFromPointerNone,
} from '../../lib/bgdhampVizHoverMath.mjs';

function toFiniteNumbers(values) {
    return (Array.isArray(values) ? values : []).map(Number).filter(Number.isFinite);
}

function isLikelyEpochSeconds(n) {
    return Number.isFinite(n) && n > 31536000 && n < 4102444800;
}

function isLikelyEpochMs(n) {
    return Number.isFinite(n) && n > 31536000000 && n < 4102444800000;
}

function normalizeTimes(rawTimes, len) {
    const times = Array.isArray(rawTimes) ? rawTimes.slice(0, len) : [];
    const out = [];
    let ok = 0;
    for (let i = 0; i < len; i += 1) {
        const t = times[i];
        if (typeof t === 'string') {
            const ms = Date.parse(t);
            if (Number.isFinite(ms)) {
                out.push(ms);
                ok += 1;
                continue;
            }
        }
        if (typeof t === 'number') {
            if (isLikelyEpochMs(t)) {
                out.push(t);
                ok += 1;
                continue;
            }
            if (isLikelyEpochSeconds(t)) {
                out.push(t * 1000);
                ok += 1;
                continue;
            }
        }
        out.push(null);
    }
    const timeLike = ok >= Math.max(2, Math.floor(len * 0.7));
    return { ms: out, timeLike };
}

function formatTimeForHover(raw, ms, timeLike) {
    if (timeLike && Number.isFinite(ms)) {
        return new Date(ms).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    if (raw == null) return '';
    return String(raw);
}

function formatValue(v) {
    if (!Number.isFinite(v)) return '—';
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatMajor(v, unit) {
    if (!Number.isFinite(v)) {
        return { majorText: '—', unitText: '' };
    }
    return {
        majorText: v.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        unitText: unit ? String(unit) : '',
    };
}

function formatDelta(d) {
    if (!Number.isFinite(d)) return '—';
    const arrow = d >= 0 ? '\u25b2' : '\u25bc';
    return `${arrow} ${d.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function deriveDomainFromSeries(seriesList) {
    const nums = [];
    seriesList.forEach((s) => {
        nums.push(...s.values);
    });
    const finite = nums.filter(Number.isFinite);
    if (finite.length === 0) return { min: 0, max: 1 };
    let min = Math.min(...finite);
    let max = Math.max(...finite);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
    if (max <= min) max = min + 1;
    const pad = (max - min) * 0.06;
    return { min: min - pad, max: max + pad };
}

function sma(values, windowSize) {
    const w = Math.max(1, Math.floor(Number(windowSize) || 1));
    if (w <= 1) return values.slice();
    const out = [];
    let sum = 0;
    for (let i = 0; i < values.length; i += 1) {
        sum += values[i];
        if (i >= w) sum -= values[i - w];
        out.push(sum / Math.min(i + 1, w));
    }
    return out;
}

function downsample(values, times, maxPoints) {
    const cap = Math.floor(Number(maxPoints) || 0);
    if (!cap || values.length <= cap) return { values, times };
    const stride = Math.ceil(values.length / cap);
    const vOut = [];
    const tOut = [];
    for (let i = 0; i < values.length; i += stride) {
        vOut.push(values[i]);
        tOut.push(times[i]);
    }
    if (vOut[vOut.length - 1] !== values[values.length - 1]) {
        vOut.push(values[values.length - 1]);
        tOut.push(times[times.length - 1]);
    }
    return { values: vOut, times: tOut };
}

function buildPath(values, width, height, { padLeft, padRight, padTop, padBottom, min, max }) {
    const innerW = Math.max(1, width - padLeft - padRight);
    const innerH = Math.max(1, height - padTop - padBottom);
    const n = values.length;
    if (n < 2) return '';
    const xStep = innerW / (n - 1);
    const toX = (i) => padLeft + i * xStep;
    const toY = (v) => {
        const ratio = (v - min) / (max - min);
        const clamped = clamp(ratio, 0, 1);
        return padTop + innerH - clamped * innerH;
    };
    return values
        .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(v).toFixed(2)}`)
        .join(' ');
}

function computeAnomalies(values, mode, sensitivity) {
    const m = mode || 'none';
    const s = Number.isFinite(Number(sensitivity)) ? Number(sensitivity) : 3;
    const flags = new Array(values.length).fill(false);
    if (m === 'none' || values.length < 3) return flags;

    if (m === 'pctChange') {
        for (let i = 1; i < values.length; i += 1) {
            const prev = values[i - 1];
            const cur = values[i];
            if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev === 0) continue;
            const pct = Math.abs((cur - prev) / prev);
            if (pct >= s / 10) flags[i] = true; // sensitivity 3 => 30%
        }
        return flags;
    }

    // deltaZscore (simple): compare delta to global stddev of deltas
    const deltas = [];
    for (let i = 1; i < values.length; i += 1) {
        const d = values[i] - values[i - 1];
        if (Number.isFinite(d)) deltas.push(d);
    }
    if (deltas.length < 2) return flags;
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const varN =
        deltas.reduce((acc, d) => acc + (d - mean) * (d - mean), 0) / deltas.length;
    const sd = Math.sqrt(varN) || 0;
    if (!sd) return flags;
    for (let i = 1; i < values.length; i += 1) {
        const d = values[i] - values[i - 1];
        if (!Number.isFinite(d)) continue;
        const z = Math.abs((d - mean) / sd);
        if (z >= s) flags[i] = true;
    }
    return flags;
}

function buildSearchUrl({ earliestSec, latestSec, query }) {
    const q = query || '*';
    const params = new URLSearchParams();
    params.set('q', q);
    if (Number.isFinite(earliestSec)) params.set('earliest', String(Math.floor(earliestSec)));
    if (Number.isFinite(latestSec)) params.set('latest', String(Math.floor(latestSec)));
    return `/app/search/search?${params.toString()}`;
}

export default function LineChart({
    // Backwards-compatible single-series inputs
    values,
    times,
    // Multi-series input: [{ id, label, values, color }]
    series,
    // Comparison overlay: [{ id, label, values, color }]
    comparisonSeries,
    width = 400,
    height = 105,
    min,
    max,
    stroke = 'rgba(255,255,255,0.95)',
    strokeWidth = 2,
    background = '#0B1F3B',
    goodColor = '#01417F',
    badColor = '#DFA611',
    textColor = '#FFFFFF',
    unit,
    subheader,
    showMajor = false,
    centerMajor = false,
    stackedMajor = false,
    showDelta = true,
    majorLabel = '',
    deltaLabel = '',
    colorPlacement = 'full', // 'full' | 'top'
    unitScale = 0.6,
    showHover = true,
    showHoverAnnotation = false,
    fillContainer = false,
    // thresholds/target
    thresholdMin,
    thresholdMax,
    thresholdShade = 'rgba(0,0,0,0.12)',
    target,
    targetStroke = 'rgba(255,255,255,0.5)',
    // smoothing/sampling
    smoothing = 'none', // none | sma
    smaWindow = 3,
    maxPoints,
    // anomalies
    anomalyMode = 'none', // none | deltaZscore | pctChange
    anomalySensitivity = 3,
    // drilldown
    drilldown = false,
    drilldownQuery,
    // axis
    showXAxis = false,
    // padding
    padLeft = 12,
    padRight = 12,
    padTop = 10,
    padBottom = 18,
    emptyText,
}) {
    const normalized = useMemo(() => {
        const baseSeries =
            Array.isArray(series) && series.length
                ? series
                : [
                      {
                          id: 'main',
                          label: '',
                          values: Array.isArray(values) ? values : [],
                          color: stroke,
                      },
                  ];

        const mainNums = toFiniteNumbers((baseSeries[0] && baseSeries[0].values) || []);
        const len = mainNums.length;
        const rawTimes = Array.isArray(times) ? times.slice(0, len) : mainNums.map((_, i) => i);
        const { ms, timeLike } = normalizeTimes(rawTimes, len);

        const mapped = baseSeries.map((s) => ({
            id: s.id || s.label || 'series',
            label: s.label || s.id || '',
            color: s.color || stroke,
            values: toFiniteNumbers(s.values).slice(0, len),
        }));

        const comp = Array.isArray(comparisonSeries)
            ? comparisonSeries.map((s) => ({
                  id: s.id || s.label || 'cmp',
                  label: s.label || s.id || '',
                  color: s.color || 'rgba(255,255,255,0.55)',
                  values: toFiniteNumbers(s.values).slice(0, len),
              }))
            : null;

        return { series: mapped, comparison: comp, times: rawTimes, ms, timeLike, len };
    }, [series, values, times, stroke, comparisonSeries]);

    const showSubheader = Boolean(subheader);
    const subheaderH = showSubheader ? 28 : 0;
    const labelExtra =
        showMajor && stackedMajor ? (majorLabel ? 18 : 0) + (deltaLabel ? 18 : 0) : 0;
    const majorH = showMajor ? 44 + labelExtra + (stackedMajor && showDelta ? 8 : 0) : 0;
    const headerH = subheaderH + majorH;
    const chartH = Math.max(1, height - headerH);

    const primaryValues = normalized.series[0] ? normalized.series[0].values : [];
    const last = primaryValues.length ? primaryValues[primaryValues.length - 1] : NaN;
    const prev = primaryValues.length > 1 ? primaryValues[primaryValues.length - 2] : last;
    const delta = last - prev;
    const trendBg = trendBackground(delta, goodColor, badColor);

    const containerBg = showMajor
        ? colorPlacement === 'top'
            ? background
            : trendBg
        : background;
    const subheaderBg = 'rgba(0, 0, 0, 0.52)';
    const majorBg = showMajor && colorPlacement === 'top' ? trendBg : 'transparent';

    const { majorText, unitText } = useMemo(() => formatMajor(last, unit), [last, unit]);

    // Reduce padding when header is visible so the chart isn't cramped.
    const effPadLeft = showMajor ? Math.min(padLeft, 10) : padLeft;
    const effPadRight = showMajor ? Math.min(padRight, 10) : padRight;
    const effPadTop = showMajor ? Math.min(padTop, 2) : padTop;
    const effPadBottom = showMajor ? Math.min(padBottom, 12) : padBottom;

    const processed = useMemo(() => {
        const out = normalized.series.map((s) => {
            let v = s.values.slice();
            if (smoothing === 'sma') v = sma(v, smaWindow);
            const ds = downsample(v, normalized.times, maxPoints);
            return { ...s, values: ds.values, times: ds.times };
        });
        const cmp =
            normalized.comparison &&
            normalized.comparison.map((s) => {
                let v = s.values.slice();
                if (smoothing === 'sma') v = sma(v, smaWindow);
                const ds = downsample(v, normalized.times, maxPoints);
                return { ...s, values: ds.values, times: ds.times };
            });
        const len = out[0] ? out[0].values.length : 0;
        const timesUsed = out[0] ? out[0].times : [];
        const { ms, timeLike } = normalizeTimes(timesUsed, len);
        return { series: out, comparison: cmp, times: timesUsed, ms, timeLike, len };
    }, [normalized, smoothing, smaWindow, maxPoints]);

    const domain = useMemo(() => {
        const derived = deriveDomainFromSeries([
            ...processed.series,
            ...(processed.comparison || []),
        ]);
        let lo = Number.isFinite(Number(min)) ? Number(min) : derived.min;
        let hi = Number.isFinite(Number(max)) ? Number(max) : derived.max;
        if (lo > hi) {
            const t = lo;
            lo = hi;
            hi = t;
        }
        if (hi <= lo) hi = lo + 1;
        return { min: lo, max: hi };
    }, [processed, min, max]);

    const paths = useMemo(
        () =>
            processed.series.map((s) => ({
                id: s.id,
                color: s.color,
                d: buildPath(s.values, width, chartH, {
                    padLeft: effPadLeft,
                    padRight: effPadRight,
                    padTop: effPadTop,
                    padBottom: effPadBottom,
                    min: domain.min,
                    max: domain.max,
                }),
                values: s.values,
            })),
        [processed, width, chartH, effPadLeft, effPadRight, effPadTop, effPadBottom, domain]
    );

    const cmpPaths = useMemo(
        () =>
            (processed.comparison || []).map((s) => ({
                id: s.id,
                color: s.color,
                d: buildPath(s.values, width, chartH, {
                    padLeft: effPadLeft,
                    padRight: effPadRight,
                    padTop: effPadTop,
                    padBottom: effPadBottom,
                    min: domain.min,
                    max: domain.max,
                }),
                values: s.values,
            })),
        [processed, width, chartH, effPadLeft, effPadRight, effPadTop, effPadBottom, domain]
    );

    const anomalyFlags = useMemo(() => {
        const main = paths[0] ? paths[0].values : [];
        return computeAnomalies(main, anomalyMode, anomalySensitivity);
    }, [paths, anomalyMode, anomalySensitivity]);

    const [hoverIdx, setHoverIdx] = useState(null);
    /** Viewport coords for fixed tooltip (`createPortal`) — survives Splunk panel clipping + wrong-document body bugs. */
    const [tooltipViewport, setTooltipViewport] = useState(null);
    const chartAreaRef = useRef(null);
    /** Document that actually contains the chart (critical for Splunk iframe / embedded dashboard DOM). */
    const [vizDocument, setVizDocument] = useState(null);
    const setChartAreaEl = useCallback((node) => {
        chartAreaRef.current = node;
        if (node) {
            setVizDocument(node.ownerDocument || (typeof document !== 'undefined' ? document : null));
        } else {
            setVizDocument(null);
        }
    }, []);
    const innerW = Math.max(1, width - effPadLeft - effPadRight);
    const n = processed.len;
    const xStep = n > 1 ? innerW / (n - 1) : innerW;
    const toX = useCallback((i) => effPadLeft + i * xStep, [effPadLeft, xStep]);
    const toY = useCallback(
        (v) => {
            const innerH = Math.max(1, chartH - effPadTop - effPadBottom);
            const ratio = (v - domain.min) / (domain.max - domain.min);
            const clamped = clamp(ratio, 0, 1);
            return effPadTop + innerH - clamped * innerH;
        },
        [chartH, effPadTop, effPadBottom, domain]
    );

    useLayoutEffect(() => {
        if (!showHover || n < 2 || !vizDocument || !vizDocument.defaultView) return undefined;

        function onDocPointerMove(e) {
            const el = chartAreaRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (
                !rect.width ||
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                setHoverIdx(null);
                setTooltipViewport(null);
                return;
            }
            const idx = (fillContainer ? seriesIndexFromPointerNone : seriesIndexFromPointerMeet)(
                e.clientX,
                e.clientY,
                el,
                width,
                chartH,
                effPadLeft,
                effPadRight,
                n
            );
            if (idx === null) {
                setHoverIdx(null);
                setTooltipViewport(null);
                return;
            }
            setHoverIdx(idx);
            const win = el.ownerDocument && el.ownerDocument.defaultView;
            setTooltipViewport(
                clampTooltipViewport(e.clientX, e.clientY, {
                    innerWidth: win ? win.innerWidth : undefined,
                    innerHeight: win ? win.innerHeight : undefined,
                })
            );
        }

        const win = vizDocument.defaultView;
        vizDocument.addEventListener('pointermove', onDocPointerMove, true);
        vizDocument.addEventListener('pointerdown', onDocPointerMove, true);
        vizDocument.addEventListener('mousemove', onDocPointerMove, true);
        win.addEventListener('mousemove', onDocPointerMove, true);
        return () => {
            vizDocument.removeEventListener('pointermove', onDocPointerMove, true);
            vizDocument.removeEventListener('pointerdown', onDocPointerMove, true);
            vizDocument.removeEventListener('mousemove', onDocPointerMove, true);
            win.removeEventListener('mousemove', onDocPointerMove, true);
            setHoverIdx(null);
            setTooltipViewport(null);
        };
    }, [vizDocument, showHover, n, width, chartH, effPadLeft, effPadRight, fillContainer]);

    useLayoutEffect(() => {
        if (!drilldown || !processed.timeLike || n < 2 || !vizDocument || !vizDocument.defaultView) {
            return undefined;
        }

        function onDocClick(e) {
            const el = chartAreaRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (
                !rect.width ||
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                return;
            }
            const idx = (fillContainer ? seriesIndexFromPointerNone : seriesIndexFromPointerMeet)(
                e.clientX,
                e.clientY,
                el,
                width,
                chartH,
                effPadLeft,
                effPadRight,
                n
            );
            if (idx === null) return;
            const ms = processed.ms[idx];
            if (!Number.isFinite(ms)) return;
            const prevMs = idx > 0 ? processed.ms[idx - 1] : ms;
            const nextMs = idx < processed.ms.length - 1 ? processed.ms[idx + 1] : ms;
            const earliest = Math.floor(((prevMs + ms) / 2) / 1000);
            const latest = Math.floor(((ms + nextMs) / 2) / 1000);
            const navWin = vizDocument.defaultView;
            if (navWin) {
                navWin.location.href = buildSearchUrl({
                    earliestSec: earliest,
                    latestSec: latest,
                    query: drilldownQuery,
                });
            }
        }

        vizDocument.addEventListener('click', onDocClick, true);
        return () => vizDocument.removeEventListener('click', onDocClick, true);
    }, [vizDocument, drilldown, drilldownQuery, processed.timeLike, processed.ms, n, width, chartH, effPadLeft, effPadRight, fillContainer]);

    const goodCount = processed.series.reduce((acc, s) => acc + s.values.length, 0);
    if (n < 2) {
        const msg =
            emptyText ||
            `Need at least 2 numeric points; got ${goodCount}. Check your series values and time alignment.`;
        return (
            <div
                style={{
                    width: fillContainer ? '100%' : width,
                    height: fillContainer ? '100%' : height,
                    background: containerBg,
                    color: showMajor ? textColor : 'rgba(255,255,255,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    boxSizing: 'border-box',
                    borderRadius: 4,
                    padding: 10,
                    textAlign: 'center',
                }}
            >
                {msg}
            </div>
        );
    }

    const hx = hoverIdx != null ? toX(hoverIdx) : 0;
    const hoverPrimary = paths[0] ? paths[0].values[hoverIdx] : NaN;
    const hy = hoverIdx != null ? toY(hoverPrimary) : 0;
    const hoverTime =
        hoverIdx != null
            ? formatTimeForHover(processed.times[hoverIdx], processed.ms[hoverIdx], processed.timeLike)
            : '';
    const hoverValue = hoverIdx != null ? formatValue(hoverPrimary) : '';

    // X ticks (minimal)
    const ticks = useMemo(() => {
        if (!showXAxis || !processed.timeLike || processed.ms.length < 2) return [];
        const count = 4;
        const idxs = Array.from({ length: count }, (_, i) =>
            Math.round((i * (processed.ms.length - 1)) / (count - 1))
        );
        return idxs.map((i) => ({
            idx: i,
            x: toX(i),
            label: Number.isFinite(processed.ms[i])
                ? new Date(processed.ms[i]).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                : String(processed.times[i] ?? ''),
        }));
    }, [showXAxis, processed, toX]);

    const yFor = (v) => toY(v);
    const thLo = Number.isFinite(Number(thresholdMin)) ? Number(thresholdMin) : null;
    const thHi = Number.isFinite(Number(thresholdMax)) ? Number(thresholdMax) : null;
    const yTarget = Number.isFinite(Number(target)) ? yFor(Number(target)) : null;

    const outerWidth = fillContainer ? '100%' : width;
    const outerHeight = fillContainer ? '100%' : height;
    const svgWidth = fillContainer ? '100%' : width;

    return (
        <div style={{ position: 'relative', width: outerWidth, height: outerHeight, overflow: 'visible' }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: containerBg,
                    borderRadius: 4,
                    color: showMajor ? textColor : undefined,
                    overflow: 'hidden',
                }}
            >
                {showSubheader ? (
                    <div
                        style={{
                            height: subheaderH,
                            padding: '0 10px',
                            boxSizing: 'border-box',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: '28px',
                            opacity: 0.82,
                            background: subheaderBg,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {String(subheader)}
                    </div>
                ) : null}

                {showMajor ? (
                    <div
                        style={{
                            height: majorH,
                            padding: stackedMajor ? '8px 12px 6px' : '6px 12px 6px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: stackedMajor ? 'column' : 'row',
                            alignItems: stackedMajor ? 'center' : 'flex-end',
                            justifyContent: centerMajor ? 'center' : 'space-between',
                            gap: stackedMajor ? 4 : 6,
                            textAlign: centerMajor ? 'center' : undefined,
                            background: majorBg,
                        }}
                    >
                        {stackedMajor && majorLabel ? (
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    padding: '2px 8px',
                                    borderRadius: 3,
                                    background: 'rgba(0,0,0,0.28)',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                }}
                            >
                                {majorLabel}
                            </div>
                        ) : null}
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 600,
                                lineHeight: 1.1,
                                display: 'inline-flex',
                                alignItems: 'baseline',
                            }}
                        >
                            {majorText}
                            {unitText ? (
                                <span
                                    style={{
                                        fontSize: `${unitScale}em`,
                                        fontWeight: 600,
                                        marginLeft: 2,
                                        opacity: 0.95,
                                    }}
                                >
                                    {unitText}
                                </span>
                            ) : null}
                        </div>
                        {showDelta ? (
                            <>
                                {stackedMajor && deltaLabel ? (
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            lineHeight: 1.2,
                                            padding: '2px 8px',
                                            borderRadius: 3,
                                            background: 'rgba(0,0,0,0.28)',
                                            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                        }}
                                    >
                                        {deltaLabel}
                                    </div>
                                ) : null}
                                <div
                                    style={{
                                        fontSize: stackedMajor ? 16 : 11,
                                        lineHeight: 1.2,
                                        fontWeight: 600,
                                        opacity: 0.95,
                                        marginLeft: centerMajor && !stackedMajor ? 6 : undefined,
                                    }}
                                >
                                    {formatDelta(delta)}
                                </div>
                            </>
                        ) : null}
                    </div>
                ) : null}

                <div
                    ref={setChartAreaEl}
                    data-testid="bgdhamp-line-chart-area"
                    style={{ position: 'relative', width: '100%', height: chartH }}
                >
                <svg
                    width={svgWidth}
                    height={chartH}
                    viewBox={fillContainer ? '0 0 ' + width + ' ' + chartH : undefined}
                    preserveAspectRatio={fillContainer ? 'none' : undefined}
                    style={{
                        display: 'block',
                        pointerEvents: 'none',
                    }}
                >
                    {/* threshold shade (out-of-band) */}
                    {thLo != null ? (
                        <rect
                            x={effPadLeft}
                            y={0}
                            width={Math.max(0, width - effPadLeft - effPadRight)}
                            height={Math.max(0, yFor(thLo))}
                            fill={thresholdShade}
                        />
                    ) : null}
                    {thHi != null ? (
                        <rect
                            x={effPadLeft}
                            y={Math.max(0, yFor(thHi))}
                            width={Math.max(0, width - effPadLeft - effPadRight)}
                            height={Math.max(0, chartH - effPadBottom - yFor(thHi))}
                            fill={thresholdShade}
                        />
                    ) : null}

                    {/* target line */}
                    {yTarget != null ? (
                        <line
                            x1={effPadLeft}
                            y1={yTarget}
                            x2={width - effPadRight}
                            y2={yTarget}
                            stroke={targetStroke}
                            strokeWidth={1}
                            strokeDasharray="4 3"
                        />
                    ) : null}

                    {/* rails */}
                    <line
                        x1={effPadLeft}
                        y1={chartH - effPadBottom}
                        x2={width - effPadRight}
                        y2={chartH - effPadBottom}
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={1}
                    />
                    <line
                        x1={effPadLeft}
                        y1={effPadTop}
                        x2={width - effPadRight}
                        y2={effPadTop}
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth={1}
                    />

                    {/* comparison overlay */}
                    {cmpPaths.map((p) => (
                        <path
                            key={`cmp-${p.id}`}
                            d={p.d}
                            fill="none"
                            stroke={p.color}
                            strokeWidth={strokeWidth}
                            strokeOpacity={0.55}
                            strokeDasharray="6 4"
                        />
                    ))}

                    {/* main series paths */}
                    {paths.map((p, idx) => (
                        <path
                            key={p.id}
                            d={p.d}
                            fill="none"
                            stroke={idx === 0 ? stroke : p.color}
                            strokeWidth={strokeWidth}
                            strokeOpacity={idx === 0 ? 1 : 0.85}
                        />
                    ))}

                    {/* anomaly markers (primary series only) */}
                    {anomalyFlags.map((flag, i) => {
                        if (!flag) return null;
                        const x = toX(i);
                        const y = yFor(paths[0].values[i]);
                        return (
                            <polygon
                                key={`an-${i}`}
                                points={`${x},${y - 6} ${x - 5},${y + 4} ${x + 5},${y + 4}`}
                                fill="rgba(255,255,255,0.85)"
                                opacity={0.9}
                            />
                        );
                    })}

                    {/* x-axis ticks */}
                    {ticks.map((t) => (
                        <text
                            key={`tick-${t.idx}`}
                            x={t.x}
                            y={chartH - 2}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.65)"
                            fontSize="10"
                        >
                            {t.label}
                        </text>
                    ))}

                    {/* hover marker */}
                    {showHover && hoverIdx != null ? (
                        <g style={{ pointerEvents: 'none' }}>
                            <line
                                x1={hx}
                                y1={effPadTop}
                                x2={hx}
                                y2={chartH - effPadBottom}
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
                </div>
            </div>

            {/* optional in-card annotation (disabled by default) */}
            {showHover && showHoverAnnotation && hoverIdx != null ? (
                <div
                    style={{
                        position: 'absolute',
                        left: 10,
                        bottom: 6,
                        pointerEvents: 'none',
                        background: 'rgba(0,0,0,0.35)',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: 11,
                        lineHeight: 1.2,
                        padding: '4px 6px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                    }}
                >
                    <span style={{ fontWeight: 600 }}>{hoverValue}</span>
                    {unitText ? <span>{unitText}</span> : null}
                    {hoverTime ? <span style={{ opacity: 0.9 }}> — {hoverTime}</span> : null}
                </div>
            ) : null}

            {/* floating tooltip (portal avoids Splunk panel clipping + stacking under overlays) */}
            {showHover &&
            hoverIdx != null &&
            tooltipViewport &&
            vizDocument &&
            vizDocument.body
                ? createPortal(
                      <div
                          data-testid="bgdhamp-line-hover-tooltip"
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          style={{
                              position: 'fixed',
                              left: tooltipViewport.x,
                              top: tooltipViewport.y,
                              transform: 'translate(-50%, calc(-100% - 8px))',
                              pointerEvents: 'none',
                              background: 'rgba(15, 25, 45, 0.96)',
                              color: '#fff',
                              fontSize: 11,
                              lineHeight: 1.35,
                              padding: '6px 8px',
                              borderRadius: 4,
                              boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                              whiteSpace: 'nowrap',
                              zIndex: 2147483646,
                          }}
                      >
                          <div style={{ fontWeight: 600 }}>
                              {hoverValue}
                              {unitText || ''}
                              {anomalyFlags[hoverIdx] ? (
                                  <span style={{ marginLeft: 6, opacity: 0.9 }}>(anomaly)</span>
                              ) : null}
                          </div>
                          {hoverTime ? <div style={{ opacity: 0.88, marginTop: 2 }}>{hoverTime}</div> : null}
                      </div>,
                      vizDocument.body
                  )
                : null}
        </div>
    );
}

