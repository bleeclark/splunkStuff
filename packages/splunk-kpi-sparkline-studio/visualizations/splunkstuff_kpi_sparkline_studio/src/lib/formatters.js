/**
 * @file formatters.js
 * @description Display formatting for headline values, trend deltas, hover tooltips,
 *   spark Y-scale derivation, and static spark point label maps. Mirrors Single Value
 *   and legacy Classic KPI sparkline formatting behavior (abbreviation, thousand
 *   separators, unit placement, percent delta mode).
 *
 * @see resolveOptions.js — supplies resolvedOptions to formatMajorValue / formatTrendDeltaValue
 * @see renderTile.js — consumes all exported formatters during DOM render
 */

import { parseTruthyOption } from './booleanParsing.js';

// --- Spark Y-scale ---

/**
 * Resolves vertical scale bounds for the sparkline SVG.
 * Auto mode scans finite values in the series; manual mode uses sparkMin/sparkMax
 * with swap and minimum-range guards so flat series still render.
 *
 * @param {number[]} valueSeries - Plotted numeric values
 * @param {string|number} sparkScaleMinimum - Manual min (sparkMin) when auto is off
 * @param {string|number} sparkScaleMaximum - Manual max (sparkMax) when auto is off
 * @param {*} autoScaleSparkline - Raw sparkAuto option
 * @returns {{ scaleMinimum: number, scaleMaximum: number }}
 */
export function deriveSparkScale(valueSeries, sparkScaleMinimum, sparkScaleMaximum, autoScaleSparkline) {
    if (parseTruthyOption(autoScaleSparkline)) {
        let dataMinimum = Infinity;
        let dataMaximum = -Infinity;
        for (let pointIndex = 0; pointIndex < valueSeries.length; pointIndex += 1) {
            const numericValue = Number(valueSeries[pointIndex]);
            if (!Number.isFinite(numericValue)) {
                continue;
            }
            if (numericValue < dataMinimum) {
                dataMinimum = numericValue;
            }
            if (numericValue > dataMaximum) {
                dataMaximum = numericValue;
            }
        }
        if (!Number.isFinite(dataMinimum) || !Number.isFinite(dataMaximum)) {
            return { scaleMinimum: 0, scaleMaximum: 100 };
        }
        if (dataMinimum === dataMaximum) {
            dataMaximum = dataMinimum + 1;
        }
        return { scaleMinimum: dataMinimum, scaleMaximum: dataMaximum };
    }

    let scaleMinimum = parseFloat(sparkScaleMinimum, 10);
    let scaleMaximum = parseFloat(sparkScaleMaximum, 10);
    if (!Number.isFinite(scaleMinimum)) {
        scaleMinimum = 0;
    }
    if (!Number.isFinite(scaleMaximum)) {
        scaleMaximum = 100;
    }
    if (scaleMinimum > scaleMaximum) {
        const swapped = scaleMinimum;
        scaleMinimum = scaleMaximum;
        scaleMaximum = swapped;
    }
    if (scaleMaximum <= scaleMinimum) {
        scaleMaximum = scaleMinimum + 1;
    }
    return { scaleMinimum, scaleMaximum };
}

// --- Time normalization for hover labels ---

/**
 * Normalizes raw _time cells into epoch milliseconds for reliable hover formatting.
 * Splunk may send ISO strings, epoch seconds, or epoch milliseconds; this module
 * detects the shape and sets hasReliableTimes when enough points parse successfully.
 *
 * @param {Array<*>} rawTimeSeries - Parallel time column from parsePrimarySearchData
 * @param {number} pointCount - Expected series length (value point count)
 * @returns {{ epochMilliseconds: Array<number|null>, hasReliableTimes: boolean }}
 */
export function normalizeTimeColumn(rawTimeSeries, pointCount) {
    const timeSeries = Array.isArray(rawTimeSeries) ? rawTimeSeries.slice(0, pointCount) : [];
    const epochMilliseconds = [];
    let parseableTimeCount = 0;

    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
        const timeValue = timeSeries[pointIndex];
        if (typeof timeValue === 'string') {
            const parsedMilliseconds = Date.parse(timeValue);
            if (Number.isFinite(parsedMilliseconds)) {
                epochMilliseconds.push(parsedMilliseconds);
                parseableTimeCount += 1;
                continue;
            }
        }
        if (typeof timeValue === 'number' && Number.isFinite(timeValue)) {
            // Heuristic: large numbers are ms; medium are seconds since epoch
            if (timeValue > 31536000000) {
                epochMilliseconds.push(timeValue);
            } else if (timeValue > 31536000) {
                epochMilliseconds.push(timeValue * 1000);
            } else {
                epochMilliseconds.push(null);
            }
            if (epochMilliseconds[pointIndex] != null) {
                parseableTimeCount += 1;
            }
            continue;
        }
        epochMilliseconds.push(null);
    }

    return {
        epochMilliseconds,
        hasReliableTimes: parseableTimeCount >= Math.max(2, Math.floor(pointCount * 0.5)),
    };
}

/**
 * Formats the hover tooltip time line for a sparkline point.
 * Prefers locale string from normalized epoch ms; falls back to raw cell text.
 *
 * @param {Array<*>} timeSeries - Raw time values aligned with value series
 * @param {{ epochMilliseconds: Array<number|null>, hasReliableTimes: boolean }} normalizedTimes
 * @param {number} pointIndex - Hovered point index
 * @returns {string} Display time label or empty string
 */
export function formatHoverTimeLabel(timeSeries, normalizedTimes, pointIndex) {
    if (normalizedTimes.hasReliableTimes && normalizedTimes.epochMilliseconds[pointIndex] != null) {
        return new Date(normalizedTimes.epochMilliseconds[pointIndex]).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    if (timeSeries[pointIndex] == null) {
        return '';
    }
    return String(timeSeries[pointIndex]);
}

// --- Numeric formatting core ---

/**
 * Abbreviates large magnitudes with K/M/B suffixes (Single Value style).
 *
 * @param {number} numericValue - Value to abbreviate
 * @param {number} precision - Decimal places for suffix form
 * @returns {string} Abbreviated string
 */
function abbreviateMagnitude(numericValue, precision) {
    const absolute = Math.abs(numericValue);
    if (absolute >= 1e9) {
        return `${(numericValue / 1e9).toFixed(precision)}B`;
    }
    if (absolute >= 1e6) {
        return `${(numericValue / 1e6).toFixed(precision)}M`;
    }
    if (absolute >= 1e3) {
        return `${(numericValue / 1e3).toFixed(precision)}K`;
    }
    return numericValue.toFixed(precision);
}

/**
 * Shared number formatting: em dash for non-finite, optional locale separators,
 * optional K/M/B abbreviation.
 *
 * @param {number} numericValue - Value to format
 * @param {number} precision - Decimal places
 * @param {boolean} useThousandSeparators - Locale grouping
 * @param {boolean} abbreviate - Use K/M/B suffixes
 * @returns {string} Formatted number or em dash
 */
function formatNumericCore(numericValue, precision, useThousandSeparators, abbreviate) {
    if (!Number.isFinite(numericValue)) {
        return '—';
    }
    const decimalPlaces = Number.isFinite(precision) && precision >= 0 ? precision : 2;
    if (abbreviate) {
        return abbreviateMagnitude(numericValue, Math.min(2, decimalPlaces));
    }
    if (useThousandSeparators) {
        return numericValue.toLocaleString(undefined, {
            maximumFractionDigits: decimalPlaces,
            minimumFractionDigits: 0,
        });
    }
    return numericValue.toFixed(decimalPlaces);
}

// --- Headline and delta display ---

/**
 * Formats the large headline KPI number with unit prefix/suffix from resolved options.
 *
 * @param {number} numericValue - Latest value in the series
 * @param {object} resolvedOptions - Output of resolveOptions
 * @param {string} [unitTextOverride] - Optional per-tile unit override (trellis)
 * @returns {string} Formatted headline text
 */
export function formatMajorValue(
    numericValue,
    resolvedOptions,
    unitTextOverride
) {
    const unitText = unitTextOverride != null ? unitTextOverride : resolvedOptions.unitText;
    const formattedCore = formatNumericCore(
        numericValue,
        resolvedOptions.numberPrecision,
        resolvedOptions.shouldUseThousandSeparators,
        resolvedOptions.shouldAbbreviateMajorValue
    );
    if (!unitText) {
        return formattedCore;
    }
    if (resolvedOptions.unitPosition === 'before') {
        return `${unitText}${formattedCore}`;
    }
    return `${formattedCore}${unitText}`;
}

/**
 * Formats the trend delta with arrow glyph and absolute or percent mode.
 *
 * @param {number} trendDeltaValue - Point-to-point change
 * @param {number} lastValue - Latest series value (denominator for percent mode)
 * @param {object} resolvedOptions - Output of resolveOptions
 * @returns {string} Delta display string with ▲/▼ prefix
 */
export function formatTrendDeltaValue(
    trendDeltaValue,
    lastValue,
    resolvedOptions
) {
    if (!Number.isFinite(trendDeltaValue)) {
        return '—';
    }
    const decimalPlaces = resolvedOptions.numberPrecision;
    const trendArrow = trendDeltaValue >= 0 ? '\u25b2 ' : '\u25bc ';
    if (resolvedOptions.trendDisplayMode === 'percent' && Number.isFinite(lastValue) && lastValue !== 0) {
        const percentChange = (trendDeltaValue / Math.abs(lastValue)) * 100;
        const formattedPercent = resolvedOptions.shouldAbbreviateTrendValue
            ? abbreviateMagnitude(percentChange, Math.min(2, decimalPlaces))
            : formatNumericCore(
                  percentChange,
                  decimalPlaces,
                  resolvedOptions.shouldUseThousandSeparators,
                  false
              );
        return `${trendArrow}${formattedPercent}%`;
    }
    const formattedDelta = formatNumericCore(
        trendDeltaValue,
        decimalPlaces,
        resolvedOptions.shouldUseThousandSeparators,
        resolvedOptions.shouldAbbreviateTrendValue
    );
    return `${trendArrow}${formattedDelta}`;
}

/**
 * Formats the numeric line in the sparkline hover tooltip.
 * Suppresses redundant "value" prefix when authors set tooltipPrefix to "value".
 *
 * @param {number} numericValue - Hovered point value
 * @param {number} precision - Decimal places
 * @param {string} tooltipPrefix - Optional prefix from formatter
 * @returns {string} Tooltip value line
 */
export function formatHoverTooltipValue(numericValue, precision, tooltipPrefix) {
    const formattedCore = formatNumericCore(numericValue, precision, true, false);
    const prefixText = String(tooltipPrefix || '').trim();
    if (prefixText.toLowerCase() === 'value') {
        return formattedCore;
    }
    return prefixText ? `${prefixText} ${formattedCore}` : formattedCore;
}

// --- Static spark point labels (formatter config) ---

/**
 * Parses sparkPointLabels formatter text into a map of pointIndex → label.
 * Format: comma-separated "index:label" pairs (0-based), e.g. "0:Start,19:Now".
 * Search-driven annotations (annotationField) are merged separately in renderTile.
 *
 * @param {string} rawLabelPairs - Raw sparkPointLabels option value
 * @returns {Object.<number, string>} Map of index to label text
 */
export function parseSparkPointLabelMap(rawLabelPairs) {
    const labelByPointIndex = {};
    const labelText = String(rawLabelPairs == null ? '' : rawLabelPairs).trim();
    if (!labelText) {
        return labelByPointIndex;
    }
    const pairSegments = labelText.split(/[,;]+/);
    for (let segmentIndex = 0; segmentIndex < pairSegments.length; segmentIndex += 1) {
        const segment = pairSegments[segmentIndex].trim();
        if (!segment) {
            continue;
        }
        const colonIndex = segment.indexOf(':');
        if (colonIndex < 0) {
            continue;
        }
        const pointIndex = parseInt(segment.slice(0, colonIndex), 10);
        const label = segment.slice(colonIndex + 1).trim();
        if (Number.isFinite(pointIndex) && pointIndex >= 0 && label) {
            labelByPointIndex[pointIndex] = label;
        }
    }
    return labelByPointIndex;
}
