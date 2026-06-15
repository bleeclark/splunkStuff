import { parseTruthyOption } from './booleanParsing.js';

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

export function formatHoverTooltipValue(numericValue, precision, tooltipPrefix) {
    const formattedCore = formatNumericCore(numericValue, precision, true, false);
    const prefixText = String(tooltipPrefix || '').trim();
    if (prefixText.toLowerCase() === 'value') {
        return formattedCore;
    }
    return prefixText ? `${prefixText} ${formattedCore}` : formattedCore;
}

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
