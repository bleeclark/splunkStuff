import { parseTruthyOption } from './booleanParsing.js';

export function calculateTrendDelta(valueSeries) {
    if (!valueSeries || !valueSeries.length) {
        return Number.NaN;
    }
    const pointCount = valueSeries.length;
    const lastValue = Number(valueSeries[pointCount - 1]);
    const previousValue = pointCount > 1 ? Number(valueSeries[pointCount - 2]) : lastValue;
    if (!Number.isFinite(lastValue) || !Number.isFinite(previousValue)) {
        return Number.NaN;
    }
    return lastValue - previousValue;
}

export function resolveTrendTileColor(trendDeltaValue, upTrendColor, downTrendColor, invertTrendDirection) {
    const downTrendIsPositive = parseTruthyOption(invertTrendDirection);
    if (!Number.isFinite(trendDeltaValue)) {
        return upTrendColor;
    }
    if (trendDeltaValue < 0) {
        return downTrendIsPositive ? upTrendColor : downTrendColor;
    }
    return downTrendIsPositive ? downTrendColor : upTrendColor;
}
