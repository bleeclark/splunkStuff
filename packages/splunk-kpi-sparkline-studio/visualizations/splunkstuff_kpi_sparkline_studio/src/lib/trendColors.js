/**
 * @file trendColors.js
 * @description Trend delta math and tile background color selection for the KPI sparkline.
 *   The headline delta compares the last two points in the value series. Tile background
 *   color follows the delta sign, with optional inversion when "lower is better" metrics
 *   (e.g. error rate) use invertTrendDirection.
 *
 * @see resolveOptions.js — upTrendColor, downTrendColor, invertTrendDirection
 * @see renderTile.js — applies resolveTrendTileColor to the tile root
 */

import { parseTruthyOption } from './booleanParsing.js';

/**
 * Computes absolute point-to-point change for the headline delta indicator.
 * Uses the last two finite values in the series; single-point series compare against
 * themselves (delta 0).
 *
 * @param {number[]} valueSeries - Time-ordered numeric values from parsePrimarySearchData
 * @returns {number} lastValue - previousValue, or NaN when inputs are not finite
 */
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

/**
 * Maps a trend delta sign to the tile background color (good vs bad).
 * When invertTrendDirection is true, negative deltas use upTrendColor and positive
 * deltas use downTrendColor — useful for metrics where decreases are desirable.
 *
 * @param {number} trendDeltaValue - Output of calculateTrendDelta
 * @param {string} upTrendColor - Background when trend is considered positive
 * @param {string} downTrendColor - Background when trend is considered negative
 * @param {*} invertTrendDirection - Raw formatter option (parsed via parseTruthyOption)
 * @returns {string} Hex color for the tile background
 */
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
