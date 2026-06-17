/**
 * @file sparkMath.js
 * @description SVG geometry for the KPI sparkline: coordinate mapping, path generation,
 *   container measurement, and pointer hit-testing. Values are plotted in a padded
 *   coordinate system where Y increases downward (standard SVG). The horizontal axis
 *   distributes points evenly across inner width regardless of actual timestamps —
 *   time labels appear only in the hover tooltip.
 *
 * Null handling for stroke/area paths follows sparklineNullValueDisplay:
 *   gaps — break the path at null points
 *   zero — plot nulls as 0
 *   connect — skip nulls but keep the path continuous
 *
 * @see formatters.js — deriveSparkScale supplies scaleMinimum / scaleMaximum
 * @see renderTile.js — builds SVG elements from these path strings
 */

import { clampNumber } from './booleanParsing.js';

// --- Coordinate mapping ---

/**
 * Maps a value-series point index to SVG (x, y) coordinates inside padded bounds.
 *
 * @param {number[]} valueSeries - Full series (determines point count and horizontal step)
 * @param {number} pointIndex - Zero-based index into valueSeries
 * @param {number} width - SVG width in pixels
 * @param {number} height - SVG height in pixels
 * @param {number} paddingLeft - Left inset
 * @param {number} paddingRight - Right inset
 * @param {number} paddingTop - Top inset
 * @param {number} paddingBottom - Bottom inset
 * @param {number} scaleMinimum - Y-axis domain minimum
 * @param {number} scaleMaximum - Y-axis domain maximum
 * @returns {{ x: number, y: number, horizontalStep: number }} Pixel coordinates and step size
 */
export function sparkPointCoordinates(
    valueSeries,
    pointIndex,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    scaleMinimum,
    scaleMaximum
) {
    const pointCount = valueSeries.length;
    const innerWidth = Math.max(1, width - paddingLeft - paddingRight);
    const innerHeight = Math.max(1, height - paddingTop - paddingBottom);
    const horizontalStep = pointCount > 1 ? innerWidth / (pointCount - 1) : 0;
    const numericValue = Number(valueSeries[pointIndex]);
    const valueRatio = (numericValue - scaleMinimum) / (scaleMaximum - scaleMinimum);
    const clampedRatio = Math.max(0, Math.min(1, valueRatio));
    return {
        x: paddingLeft + pointIndex * horizontalStep,
        y: paddingTop + innerHeight - clampedRatio * innerHeight,
        horizontalStep,
    };
}

/**
 * Converts a single numeric value to a vertical pixel position (for target/threshold lines).
 *
 * @param {number} value - Data value on the spark Y scale
 * @param {number} height - SVG height
 * @param {number} paddingTop - Top inset
 * @param {number} paddingBottom - Bottom inset
 * @param {number} scaleMinimum - Y-axis domain minimum
 * @param {number} scaleMaximum - Y-axis domain maximum
 * @returns {number} Y coordinate in SVG space
 */
export function valueToVerticalPosition(value, height, paddingTop, paddingBottom, scaleMinimum, scaleMaximum) {
    const innerHeight = Math.max(1, height - paddingTop - paddingBottom);
    const valueRatio = (value - scaleMinimum) / (scaleMaximum - scaleMinimum);
    const clampedRatio = Math.max(0, Math.min(1, valueRatio));
    return paddingTop + innerHeight - clampedRatio * innerHeight;
}

// --- Path generation ---

/**
 * Filters value series into plottable { pointIndex, numericValue } pairs respecting
 * nullValueDisplay mode. Internal helper for stroke path building.
 *
 * @param {number[]} valueSeries - Raw series possibly containing null/NaN
 * @param {string} nullValueDisplay - "gaps" | "zero" | "connect"
 * @returns {Array<{ pointIndex: number, numericValue: number }>}
 */
function prepareRenderableValues(valueSeries, nullValueDisplay) {
    const renderableValues = [];
    for (let pointIndex = 0; pointIndex < valueSeries.length; pointIndex += 1) {
        const numericValue = Number(valueSeries[pointIndex]);
        if (Number.isFinite(numericValue)) {
            renderableValues.push({ pointIndex, numericValue });
            continue;
        }
        if (nullValueDisplay === 'zero') {
            renderableValues.push({ pointIndex, numericValue: 0 });
        }
    }
    return renderableValues;
}

/**
 * Builds an SVG path `d` attribute for the sparkline stroke (M/L segments).
 * Returns empty string when fewer than two plottable points exist.
 *
 * @param {number[]} valueSeries - Time-ordered values
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @param {number} paddingLeft - Left inset
 * @param {number} paddingRight - Right inset
 * @param {number} paddingTop - Top inset
 * @param {number} paddingBottom - Bottom inset
 * @param {number} scaleMinimum - Y scale minimum
 * @param {number} scaleMaximum - Y scale maximum
 * @param {string} nullValueDisplay - How to treat null cells in the series
 * @returns {string} SVG path data or "" when insufficient points
 */
export function buildSparklineStrokePath(
    valueSeries,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    scaleMinimum,
    scaleMaximum,
    nullValueDisplay
) {
    const renderableValues = prepareRenderableValues(valueSeries, nullValueDisplay);
    if (renderableValues.length < 2) {
        return '';
    }

    const innerWidth = Math.max(1, width - paddingLeft - paddingRight);
    const innerHeight = Math.max(1, height - paddingTop - paddingBottom);
    const pointCount = valueSeries.length;
    const horizontalStep = innerWidth / (pointCount - 1);
    const pathSegments = [];

    let startedPath = false;
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
        const numericValue = Number(valueSeries[pointIndex]);
        const hasValue =
            Number.isFinite(numericValue) || (nullValueDisplay === 'zero' && valueSeries[pointIndex] == null);
        if (!hasValue) {
            if (nullValueDisplay !== 'connect') {
                startedPath = false;
            }
            continue;
        }
        const plotValue = Number.isFinite(numericValue) ? numericValue : 0;
        const valueRatio = (plotValue - scaleMinimum) / (scaleMaximum - scaleMinimum);
        const clampedRatio = Math.max(0, Math.min(1, valueRatio));
        const x = paddingLeft + pointIndex * horizontalStep;
        const y = paddingTop + innerHeight - clampedRatio * innerHeight;
        pathSegments.push(`${startedPath ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
        startedPath = true;
    }
    return pathSegments.join(' ');
}

/**
 * Closes the stroke path down to the baseline to form a filled area polygon.
 * Reuses buildSparklineStrokePath then appends baseline corners (Z close).
 *
 * @param {number[]} valueSeries - Time-ordered values
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @param {number} paddingLeft - Left inset
 * @param {number} paddingRight - Right inset
 * @param {number} paddingTop - Top inset
 * @param {number} paddingBottom - Bottom inset
 * @param {number} scaleMinimum - Y scale minimum
 * @param {number} scaleMaximum - Y scale maximum
 * @param {string} nullValueDisplay - Null handling mode
 * @returns {string} Closed SVG path for area fill, or "" when stroke path is empty
 */
export function buildSparklineAreaPath(
    valueSeries,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    scaleMinimum,
    scaleMaximum,
    nullValueDisplay
) {
    const strokePath = buildSparklineStrokePath(
        valueSeries,
        width,
        height,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        scaleMinimum,
        scaleMaximum,
        nullValueDisplay
    );
    if (!strokePath) {
        return '';
    }
    const baselineY = height - paddingBottom;
    const firstPoint = strokePath.match(/M([\d.]+)\s+([\d.]+)/);
    const lastPointMatches = strokePath.match(/L([\d.]+)\s+([\d.]+)/g);
    if (!firstPoint || !lastPointMatches || !lastPointMatches.length) {
        return '';
    }
    const lastMatch = lastPointMatches[lastPointMatches.length - 1];
    const lastCoords = lastMatch.match(/L([\d.]+)\s+([\d.]+)/);
    const lastX = lastCoords[1];
    return `${strokePath} L${lastX} ${baselineY.toFixed(1)} L${firstPoint[1]} ${baselineY.toFixed(1)} Z`;
}

// --- Interaction and layout ---

/**
 * Maps a document pointer X coordinate to the nearest sparkline point index.
 * Uses the spark container's bounding rect for responsive scaling when SVG
 * width differs from CSS layout width.
 *
 * @param {number} clientX - Pointer X in viewport coordinates
 * @param {HTMLElement} sparkContainer - Wrapper element around the SVG
 * @param {number} paddingLeft - SVG left padding
 * @param {number} paddingRight - SVG right padding
 * @param {number} svgWidth - Logical SVG width used for path math
 * @param {number} pointCount - Number of points in the value series
 * @returns {number|null} Clamped point index, or null when hit test is invalid
 */
export function sparkPointIndexFromPointer(
    clientX,
    sparkContainer,
    paddingLeft,
    paddingRight,
    svgWidth,
    pointCount
) {
    const containerRect = sparkContainer.getBoundingClientRect();
    if (containerRect.width <= 0 || pointCount < 2) {
        return null;
    }
    const relativeX = (clientX - containerRect.left) / containerRect.width;
    const svgX = relativeX * svgWidth;
    const innerWidth = svgWidth - paddingLeft - paddingRight;
    const pointIndex = Math.round((svgX - paddingLeft) / (innerWidth / (pointCount - 1)));
    return clampNumber(pointIndex, 0, pointCount - 1);
}

/**
 * Reads the spark container's rendered size for SVG viewBox sizing.
 * Falls back to clientWidth/height or sensible defaults when layout is not ready.
 *
 * @param {HTMLElement} sparkContainer - Sparkline wrapper element
 * @returns {{ width: number, height: number }} Pixel dimensions (minimum 1)
 */
export function measureSparkContainerSize(sparkContainer) {
    const containerRect = sparkContainer.getBoundingClientRect();
    return {
        width: Math.max(1, Math.round(containerRect.width) || sparkContainer.clientWidth || 360),
        height: Math.max(1, Math.round(containerRect.height) || sparkContainer.clientHeight || 46),
    };
}

/**
 * Applies width, height, viewBox, and display styles to the spark SVG element.
 * preserveAspectRatio "none" allows the spark to stretch edge-to-edge when enabled.
 *
 * @param {SVGSVGElement} svgElement - Root sparkline SVG
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 */
export function sizeSparkSvgElement(svgElement, width, height) {
    svgElement.setAttribute('preserveAspectRatio', 'none');
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.setAttribute('width', String(width));
    svgElement.setAttribute('height', String(height));
    svgElement.style.width = `${width}px`;
    svgElement.style.height = `${height}px`;
    svgElement.style.overflow = 'visible';
    svgElement.style.display = 'block';
}
