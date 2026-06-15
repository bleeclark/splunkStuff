import { clampNumber } from './booleanParsing.js';

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

export function valueToVerticalPosition(value, height, paddingTop, paddingBottom, scaleMinimum, scaleMaximum) {
    const innerHeight = Math.max(1, height - paddingTop - paddingBottom);
    const valueRatio = (value - scaleMinimum) / (scaleMaximum - scaleMinimum);
    const clampedRatio = Math.max(0, Math.min(1, valueRatio));
    return paddingTop + innerHeight - clampedRatio * innerHeight;
}

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

export function measureSparkContainerSize(sparkContainer) {
    const containerRect = sparkContainer.getBoundingClientRect();
    return {
        width: Math.max(1, Math.round(containerRect.width) || sparkContainer.clientWidth || 360),
        height: Math.max(1, Math.round(containerRect.height) || sparkContainer.clientHeight || 46),
    };
}

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
