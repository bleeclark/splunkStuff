import { sanitizeHexColor } from './booleanParsing.js';
import { calculateTrendDelta, resolveTrendTileColor } from './trendColors.js';
import {
    deriveSparkScale,
    formatHoverTimeLabel,
    formatHoverTooltipValue,
    formatMajorValue,
    formatTrendDeltaValue,
    normalizeTimeColumn,
    parseSparkPointLabelMap,
} from './formatters.js';
import {
    buildSparklineAreaPath,
    buildSparklineStrokePath,
    measureSparkContainerSize,
    sizeSparkSvgElement,
    sparkPointCoordinates,
    sparkPointIndexFromPointer,
    valueToVerticalPosition,
} from './sparkMath.js';

const VIZ_BUILD = '20260610-kpi-sparkline-studio-v1';

function applyIndicatorLabelStyles(labelElement, textColor) {
    labelElement.style.display = 'block';
    labelElement.style.fontSize = '13px';
    labelElement.style.fontWeight = '700';
    labelElement.style.lineHeight = '1.2';
    labelElement.style.color = textColor;
    labelElement.style.textShadow = '0 1px 2px rgba(0,0,0,0.35)';
    labelElement.style.padding = '2px 8px';
    labelElement.style.borderRadius = '3px';
    labelElement.style.background = 'rgba(0,0,0,0.28)';
    labelElement.style.marginBottom = '2px';
    labelElement.style.textAlign = 'center';
}

function appendLabelValuePair(containerElement, valueElement, labelText, textColor, labelPosition) {
    const position = labelPosition === 'right' ? 'right' : 'above';
    const pairElement = document.createElement('div');
    pairElement.className = `splunkstuff-sparkline-value-viz__indicatorPair splunkstuff-sparkline-value-viz__indicatorPair--${position}`;

    function createLabelElement() {
        const labelElement = document.createElement('div');
        labelElement.className = 'splunkstuff-sparkline-value-viz__indicatorLabel';
        labelElement.textContent = labelText;
        applyIndicatorLabelStyles(labelElement, textColor);
        if (position === 'right') {
            labelElement.style.marginBottom = '0';
        }
        return labelElement;
    }

    if (position === 'right') {
        pairElement.appendChild(valueElement);
        if (labelText) {
            pairElement.appendChild(createLabelElement());
        }
    } else {
        if (labelText) {
            pairElement.appendChild(createLabelElement());
        }
        pairElement.appendChild(valueElement);
    }
    containerElement.appendChild(pairElement);
}

function applySubheaderBarStyles(headerElement, subheaderStyle, tileBackgroundColor, upTrendColor, textColor) {
    const styleName = String(subheaderStyle || 'matchtile').toLowerCase();
    let headerBackgroundColor = 'rgba(0,0,0,0.52)';
    if (styleName === 'matchtile') {
        headerBackgroundColor = tileBackgroundColor;
        headerElement.className += ' splunkstuff-sparkline-value-viz__header--matchTile';
    } else if (styleName === 'darkblue') {
        headerBackgroundColor = upTrendColor;
        headerElement.className += ' splunkstuff-sparkline-value-viz__header--darkBlue';
    } else {
        headerElement.className += ' splunkstuff-sparkline-value-viz__header--overlay';
    }
    headerElement.style.setProperty('background', headerBackgroundColor, 'important');
    headerElement.style.setProperty('color', textColor, 'important');
}

function clearSparkHoverState(sparkContainer, tooltipElement, hoverAnnotationElement) {
    if (sparkContainer) {
        const existingOverlay = sparkContainer.querySelector('.splunkstuff-sparkline-value-viz__hoverOverlay');
        if (existingOverlay && existingOverlay.parentNode) {
            existingOverlay.parentNode.removeChild(existingOverlay);
        }
    }
    if (tooltipElement) {
        tooltipElement.style.display = 'none';
    }
    if (hoverAnnotationElement) {
        hoverAnnotationElement.style.display = 'none';
        hoverAnnotationElement.textContent = '';
    }
}

function updateSparkHoverState(sparkContainer, tooltipElement, ownerDocument, hoverState) {
    clearSparkHoverState(sparkContainer, tooltipElement, hoverState.hoverAnnotationElement);
    const containerRect = sparkContainer.getBoundingClientRect();
    const drawWidth = Math.max(1, containerRect.width);
    const drawHeight = Math.max(1, containerRect.height);
    const pixelX = (hoverState.hoverPointX / hoverState.svgWidth) * drawWidth;
    const pixelY = (hoverState.hoverPointY / hoverState.svgHeight) * drawHeight;
    const topPixel = (hoverState.paddingTop / hoverState.svgHeight) * drawHeight;
    const bottomPixel = drawHeight - (hoverState.paddingBottom / hoverState.svgHeight) * drawHeight;

    const overlayElement = ownerDocument.createElement('div');
    overlayElement.className = 'splunkstuff-sparkline-value-viz__hoverOverlay';
    overlayElement.setAttribute('aria-hidden', 'true');

    const lineElement = ownerDocument.createElement('div');
    lineElement.className = 'splunkstuff-sparkline-value-viz__hoverLine';
    lineElement.style.left = `${pixelX.toFixed(1)}px`;
    lineElement.style.top = `${topPixel.toFixed(1)}px`;
    lineElement.style.height = `${Math.max(0, bottomPixel - topPixel).toFixed(1)}px`;
    overlayElement.appendChild(lineElement);

    const dotElement = ownerDocument.createElement('div');
    dotElement.className = 'splunkstuff-sparkline-value-viz__hoverDot';
    dotElement.style.left = `${(pixelX - 4).toFixed(1)}px`;
    dotElement.style.top = `${(pixelY - 4).toFixed(1)}px`;
    dotElement.style.background = hoverState.sparklineStrokeColor;
    overlayElement.appendChild(dotElement);
    sparkContainer.appendChild(overlayElement);

    const valueLabel = formatHoverTooltipValue(
        hoverState.pointValue,
        hoverState.numberPrecision,
        hoverState.tooltipPrefix
    );
    const tooltipLines = [];
    if (hoverState.annotationLabel) {
        tooltipLines.push(hoverState.annotationLabel);
    }
    if (hoverState.pointLabel && hoverState.pointLabel !== hoverState.annotationLabel) {
        tooltipLines.push(hoverState.pointLabel);
    }
    tooltipLines.push(valueLabel);
    if (hoverState.timeLabel) {
        tooltipLines.push(hoverState.timeLabel);
    }

    tooltipElement.textContent = '';
    const valueLineIndex = tooltipLines.indexOf(valueLabel);
    for (let lineIndex = 0; lineIndex < tooltipLines.length; lineIndex += 1) {
        const rowElement = ownerDocument.createElement('div');
        rowElement.className =
            lineIndex < valueLineIndex
                ? 'splunkstuff-sparkline-value-viz__tooltipPoint'
                : lineIndex === valueLineIndex
                  ? 'splunkstuff-sparkline-value-viz__tooltipValue'
                  : 'splunkstuff-sparkline-value-viz__tooltipTime';
        rowElement.textContent = tooltipLines[lineIndex];
        tooltipElement.appendChild(rowElement);
    }

    tooltipElement.style.display = 'block';
    tooltipElement.style.position = 'fixed';
    tooltipElement.style.zIndex = '2147483646';
    tooltipElement.style.left = `${hoverState.clientX}px`;
    tooltipElement.style.top = `${hoverState.clientY}px`;
    tooltipElement.style.transform = 'translate(-50%, calc(-100% - 8px))';
    const bodyElement = ownerDocument.body || ownerDocument.documentElement;
    if (bodyElement && tooltipElement.parentNode !== bodyElement) {
        bodyElement.appendChild(tooltipElement);
    }

    if (hoverState.showInChartHoverAnnotation && hoverState.hoverAnnotationElement) {
        hoverState.hoverAnnotationElement.textContent = tooltipLines.join(' \u2014 ');
        hoverState.hoverAnnotationElement.style.display = 'block';
    }
}

function drawSparkPointLabel(
    svgElement,
    valueSeries,
    pointIndex,
    labelText,
    svgWidth,
    svgHeight,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    scaleMinimum,
    scaleMaximum,
    sparklineStrokeColor
) {
    const coordinates = sparkPointCoordinates(
        valueSeries,
        pointIndex,
        svgWidth,
        svgHeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        scaleMinimum,
        scaleMaximum
    );
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('cx', coordinates.x.toFixed(1));
    marker.setAttribute('cy', coordinates.y.toFixed(1));
    marker.setAttribute('r', '3');
    marker.setAttribute('fill', sparklineStrokeColor);
    svgElement.appendChild(marker);

    const labelElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelElement.setAttribute('x', coordinates.x.toFixed(1));
    labelElement.setAttribute('y', String(Math.max(10, coordinates.y - 7)));
    labelElement.setAttribute('fill', 'rgba(255,255,255,0.9)');
    labelElement.setAttribute('font-size', '9');
    labelElement.setAttribute('font-weight', '700');
    if (coordinates.x <= paddingLeft + 2) {
        labelElement.setAttribute('text-anchor', 'start');
        labelElement.setAttribute('dx', '2');
    } else if (coordinates.x >= svgWidth - paddingRight - 2) {
        labelElement.setAttribute('text-anchor', 'end');
        labelElement.setAttribute('dx', '-2');
    } else {
        labelElement.setAttribute('text-anchor', 'middle');
    }
    labelElement.textContent = labelText;
    svgElement.appendChild(labelElement);
}

function paintSparkline(
    sparkContainer,
    seriesData,
    resolvedOptions,
    sparklineStrokeColor,
    scale,
    ownerDocument,
    hoverAnnotationElement,
    sharedHover
) {
    sparkContainer.innerHTML = '';
    const valueSeries = seriesData.valueSeries;
    const pointCount = valueSeries.length;

    function renderSparkSvg(deferredPass) {
        const measuredSize = measureSparkContainerSize(sparkContainer);
        if (measuredSize.width < 2 && !deferredPass) {
            const animationWindow = ownerDocument.defaultView || window;
            if (animationWindow && typeof animationWindow.requestAnimationFrame === 'function') {
                animationWindow.requestAnimationFrame(() => renderSparkSvg(true));
            }
            return;
        }

        const paddingLeft = resolvedOptions.sparkEdgeToEdge ? 0 : 34;
        const paddingRight = resolvedOptions.sparkEdgeToEdge ? 0 : 34;
        const paddingTop = 14;
        const paddingBottom = 6;
        const svgWidth = measuredSize.width;
        const svgHeight = measuredSize.height;

        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sizeSparkSvgElement(svgElement, svgWidth, svgHeight);

        if (resolvedOptions.showThresholdBand) {
            const bandTop = valueToVerticalPosition(
                resolvedOptions.thresholdMaximum,
                svgHeight,
                paddingTop,
                paddingBottom,
                scale.scaleMinimum,
                scale.scaleMaximum
            );
            const bandBottom = valueToVerticalPosition(
                resolvedOptions.thresholdMinimum,
                svgHeight,
                paddingTop,
                paddingBottom,
                scale.scaleMinimum,
                scale.scaleMaximum
            );
            const thresholdBand = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            thresholdBand.setAttribute('x', String(paddingLeft));
            thresholdBand.setAttribute('y', String(Math.min(bandTop, bandBottom)));
            thresholdBand.setAttribute('width', String(svgWidth - paddingLeft - paddingRight));
            thresholdBand.setAttribute('height', String(Math.abs(bandBottom - bandTop)));
            thresholdBand.setAttribute('fill', 'rgba(0,0,0,0.18)');
            svgElement.appendChild(thresholdBand);
        }

        if (resolvedOptions.showTargetLine && Number.isFinite(resolvedOptions.targetValue)) {
            const targetY = valueToVerticalPosition(
                resolvedOptions.targetValue,
                svgHeight,
                paddingTop,
                paddingBottom,
                scale.scaleMinimum,
                scale.scaleMaximum
            );
            const targetLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            targetLine.setAttribute('x1', String(paddingLeft));
            targetLine.setAttribute('x2', String(svgWidth - paddingRight));
            targetLine.setAttribute('y1', String(targetY));
            targetLine.setAttribute('y2', String(targetY));
            targetLine.setAttribute('stroke', 'rgba(255,255,255,0.55)');
            targetLine.setAttribute('stroke-width', '1');
            targetLine.setAttribute('stroke-dasharray', '4 3');
            svgElement.appendChild(targetLine);
        }

        if (resolvedOptions.showSparklineAreaFill) {
            const areaPathData = buildSparklineAreaPath(
                valueSeries,
                svgWidth,
                svgHeight,
                paddingLeft,
                paddingRight,
                paddingTop,
                paddingBottom,
                scale.scaleMinimum,
                scale.scaleMaximum,
                resolvedOptions.sparklineNullValueDisplay
            );
            if (areaPathData) {
                const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                areaPath.setAttribute('d', areaPathData);
                areaPath.setAttribute('fill', resolvedOptions.sparklineAreaColor);
                areaPath.setAttribute('fill-opacity', '0.2');
                areaPath.setAttribute('stroke', 'none');
                svgElement.appendChild(areaPath);
            }
        }

        const strokePathData = buildSparklineStrokePath(
            valueSeries,
            svgWidth,
            svgHeight,
            paddingLeft,
            paddingRight,
            paddingTop,
            paddingBottom,
            scale.scaleMinimum,
            scale.scaleMaximum,
            resolvedOptions.sparklineNullValueDisplay
        );
        if (strokePathData) {
            const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            strokePath.setAttribute('d', strokePathData);
            strokePath.setAttribute('fill', 'none');
            strokePath.setAttribute('stroke', sparklineStrokeColor);
            strokePath.setAttribute('stroke-width', String(resolvedOptions.sparklineStrokeWidth));
            strokePath.setAttribute('vector-effect', 'non-scaling-stroke');
            svgElement.appendChild(strokePath);
        }

        const pointLabelsByIndex = parseSparkPointLabelMap(resolvedOptions.sparkPointLabelsRaw);
        const annotationSeries =
            resolvedOptions.annotationFieldName &&
            seriesData.stringFieldsByName[resolvedOptions.annotationFieldName]
                ? seriesData.stringFieldsByName[resolvedOptions.annotationFieldName]
                : [];
        const effectivePointLabels = {};
        if (resolvedOptions.showSparkPointLabels) {
            Object.assign(effectivePointLabels, pointLabelsByIndex);
        }
        if (resolvedOptions.showAnnotationOnSpark && annotationSeries.length) {
            for (let pointIndex = 0; pointIndex < annotationSeries.length; pointIndex += 1) {
                if (annotationSeries[pointIndex]) {
                    effectivePointLabels[pointIndex] = annotationSeries[pointIndex];
                }
            }
        }
        for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
            if (!Object.prototype.hasOwnProperty.call(effectivePointLabels, pointIndex)) {
                continue;
            }
            drawSparkPointLabel(
                svgElement,
                valueSeries,
                pointIndex,
                effectivePointLabels[pointIndex],
                svgWidth,
                svgHeight,
                paddingLeft,
                paddingRight,
                paddingTop,
                paddingBottom,
                scale.scaleMinimum,
                scale.scaleMaximum,
                sparklineStrokeColor
            );
        }

        sparkContainer.appendChild(svgElement);

        if (!sharedHover.tooltipElement) {
            sharedHover.tooltipElement = ownerDocument.createElement('div');
            sharedHover.tooltipElement.className = 'splunkstuff-sparkline-value-viz__tooltip';
            sharedHover.tooltipElement.setAttribute('role', 'status');
            sharedHover.tooltipElement.style.display = 'none';
        }

        if (resolvedOptions.showSparklineTooltip && pointCount >= 2) {
            const normalizedTimes = normalizeTimeColumn(seriesData.timeSeries, pointCount);
            const annotationAtPoint =
                resolvedOptions.annotationFieldName &&
                seriesData.stringFieldsByName[resolvedOptions.annotationFieldName]
                    ? seriesData.stringFieldsByName[resolvedOptions.annotationFieldName]
                    : [];

            function pointerIsOverSpark(clientX, clientY) {
                const containerRect = sparkContainer.getBoundingClientRect();
                return (
                    containerRect.width > 0 &&
                    containerRect.height > 0 &&
                    clientX >= containerRect.left &&
                    clientX <= containerRect.right &&
                    clientY >= containerRect.top &&
                    clientY <= containerRect.bottom
                );
            }

            function onDocumentPointerMove(event) {
                if (!pointerIsOverSpark(event.clientX, event.clientY)) {
                    clearSparkHoverState(sparkContainer, sharedHover.tooltipElement, hoverAnnotationElement);
                    return;
                }
                const hoveredPointIndex = sparkPointIndexFromPointer(
                    event.clientX,
                    sparkContainer,
                    paddingLeft,
                    paddingRight,
                    svgWidth,
                    pointCount
                );
                if (hoveredPointIndex == null) {
                    clearSparkHoverState(sparkContainer, sharedHover.tooltipElement, hoverAnnotationElement);
                    return;
                }
                const coordinates = sparkPointCoordinates(
                    valueSeries,
                    hoveredPointIndex,
                    svgWidth,
                    svgHeight,
                    paddingLeft,
                    paddingRight,
                    paddingTop,
                    paddingBottom,
                    scale.scaleMinimum,
                    scale.scaleMaximum
                );
                const hoverAnnotation =
                    resolvedOptions.showAnnotationOnHover && annotationAtPoint[hoveredPointIndex]
                        ? annotationAtPoint[hoveredPointIndex]
                        : '';
                updateSparkHoverState(sparkContainer, sharedHover.tooltipElement, ownerDocument, {
                    hoverPointX: coordinates.x,
                    hoverPointY: coordinates.y,
                    svgWidth,
                    svgHeight,
                    paddingTop,
                    paddingBottom,
                    sparklineStrokeColor,
                    pointValue: valueSeries[hoveredPointIndex],
                    numberPrecision: resolvedOptions.numberPrecision,
                    tooltipPrefix: resolvedOptions.tooltipPrefix,
                    timeLabel: formatHoverTimeLabel(
                        seriesData.timeSeries,
                        normalizedTimes,
                        hoveredPointIndex
                    ),
                    annotationLabel: hoverAnnotation,
                    pointLabel: pointLabelsByIndex[hoveredPointIndex] || '',
                    clientX: event.clientX,
                    clientY: event.clientY,
                    showInChartHoverAnnotation: resolvedOptions.showInChartHoverAnnotation,
                    hoverAnnotationElement,
                });
            }

            if (!sharedHover.cleanupHandlers) {
                sharedHover.cleanupHandlers = [];
            }
            const cleanup = () => {
                ownerDocument.removeEventListener('pointermove', onDocumentPointerMove, true);
                ownerDocument.removeEventListener('mousemove', onDocumentPointerMove, true);
                if (ownerDocument.defaultView) {
                    ownerDocument.defaultView.removeEventListener('mousemove', onDocumentPointerMove, true);
                }
                clearSparkHoverState(sparkContainer, sharedHover.tooltipElement, hoverAnnotationElement);
            };
            sharedHover.cleanupHandlers.push(cleanup);
            ownerDocument.addEventListener('pointermove', onDocumentPointerMove, true);
            ownerDocument.addEventListener('mousemove', onDocumentPointerMove, true);
            if (ownerDocument.defaultView) {
                ownerDocument.defaultView.addEventListener('mousemove', onDocumentPointerMove, true);
            }
        }
    }

    renderSparkSvg(false);
}

export function renderKpiSparklineTile(
    mountElement,
    seriesData,
    resolvedOptions,
    ownerDocument,
    sharedHover
) {
    const valueSeries =
        Array.isArray(resolvedOptions.sparklineValuesOverride) &&
        resolvedOptions.sparklineValuesOverride.length
            ? resolvedOptions.sparklineValuesOverride.map((value) => Number(value))
            : seriesData.valueSeries;

    if (!valueSeries.length) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'splunkstuff-sparkline-value-viz__err';
        emptyElement.textContent = resolvedOptions.emptyStateMessage;
        mountElement.appendChild(emptyElement);
        return;
    }

    const trendDeltaValue =
        resolvedOptions.trendValueOverride != null &&
        Number.isFinite(Number(resolvedOptions.trendValueOverride))
            ? Number(resolvedOptions.trendValueOverride)
            : calculateTrendDelta(valueSeries);
    const lastValue = valueSeries[valueSeries.length - 1];
    const upTrendColor = sanitizeHexColor(resolvedOptions.upTrendColor, '#01417F');
    const downTrendColor = sanitizeHexColor(resolvedOptions.downTrendColor, '#DFA611');
    const defaultTextColor = sanitizeHexColor(resolvedOptions.defaultTextColor, '#FFFFFF');
    const sparklineStrokeColor = sanitizeHexColor(resolvedOptions.sparklineStrokeColor, '#FFFFFF');
    const tileBackgroundColor = resolvedOptions.tileBackgroundColorOverride
        ? resolvedOptions.tileBackgroundColorOverride
        : resolveTrendTileColor(
              trendDeltaValue,
              upTrendColor,
              downTrendColor,
              resolvedOptions.invertTrendDirection
          );
    const majorTextColor = resolvedOptions.majorColor || defaultTextColor;
    const trendTextColor = resolvedOptions.trendColor || defaultTextColor;
    const scale = deriveSparkScale(
        valueSeries,
        resolvedOptions.sparkScaleMinimum,
        resolvedOptions.sparkScaleMaximum,
        resolvedOptions.autoScaleSparkline
    );

    const rootElement = document.createElement('div');
    rootElement.className = 'splunkstuff-sparkline-value-viz';
    rootElement.setAttribute('data-ss-viz-build', VIZ_BUILD);
    rootElement.style.position = 'relative';
    rootElement.style.backgroundColor = tileBackgroundColor;
    rootElement.style.color = defaultTextColor;
    rootElement.style.width = '100%';
    rootElement.style.height = '100%';
    rootElement.style.minHeight = '200px';
    rootElement.style.boxSizing = 'border-box';
    rootElement.style.display = 'flex';
    rootElement.style.flexDirection = 'column';

    if (resolvedOptions.badgeStatusText) {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'splunkstuff-sparkline-value-viz__badge';
        badgeElement.textContent = resolvedOptions.badgeStatusText;
        badgeElement.setAttribute('title', resolvedOptions.badgeStatusText);
        rootElement.appendChild(badgeElement);
    }

    if (resolvedOptions.subheaderText) {
        const headerElement = document.createElement('div');
        headerElement.className = 'splunkstuff-sparkline-value-viz__header';
        applySubheaderBarStyles(
            headerElement,
            resolvedOptions.subheaderStyle,
            tileBackgroundColor,
            upTrendColor,
            defaultTextColor
        );
        headerElement.textContent = resolvedOptions.subheaderText;
        rootElement.appendChild(headerElement);
    }

    const bodyElement = document.createElement('div');
    bodyElement.className = 'splunkstuff-sparkline-value-viz__body';
    bodyElement.style.flex = '1 1 auto';
    bodyElement.style.position = 'relative';
    bodyElement.style.display = 'flex';
    bodyElement.style.flexDirection = 'column';
    bodyElement.style.alignItems = 'center';
    bodyElement.style.justifyContent = 'center';
    bodyElement.style.padding = '12px 12px 76px';
    bodyElement.style.boxSizing = 'border-box';

    const alignClass =
        resolvedOptions.align === 'left'
            ? 'splunkstuff-sparkline-value-viz__headlineRow--alignLeft'
            : resolvedOptions.align === 'right'
              ? 'splunkstuff-sparkline-value-viz__headlineRow--alignRight'
              : '';
    const headlineRowElement = document.createElement('div');
    headlineRowElement.className = `splunkstuff-sparkline-value-viz__headlineRow splunkstuff-sparkline-value-viz__headlineRow--${
        resolvedOptions.headlineLayout === 'inline' ? 'inline' : 'stacked'
    } ${alignClass}`.trim();

    const majorValueNumeric =
        resolvedOptions.majorValueOverride != null && Number.isFinite(Number(resolvedOptions.majorValueOverride))
            ? Number(resolvedOptions.majorValueOverride)
            : lastValue;
    const majorDisplayText =
        resolvedOptions.majorValueDisplayOverride != null &&
        String(resolvedOptions.majorValueDisplayOverride).trim() !== ''
            ? String(resolvedOptions.majorValueDisplayOverride)
            : formatMajorValue(majorValueNumeric, resolvedOptions);

    const majorBlock = document.createElement('div');
    majorBlock.className = 'splunkstuff-sparkline-value-viz__major';
    const majorValueElement = document.createElement('div');
    majorValueElement.className = 'splunkstuff-sparkline-value-viz__majorValue';
    majorValueElement.textContent = majorDisplayText;
    majorValueElement.style.fontSize = resolvedOptions.majorFontSize
        ? `${resolvedOptions.majorFontSize}px`
        : '32px';
    majorValueElement.style.fontWeight = '600';
    majorValueElement.style.lineHeight = '1.05';
    majorValueElement.style.color = majorTextColor;
    const majorLabelText = resolvedOptions.majorLabelText || resolvedOptions.underLabelText;
    appendLabelValuePair(
        majorBlock,
        majorValueElement,
        majorLabelText,
        majorTextColor,
        resolvedOptions.labelPosition
    );
    headlineRowElement.appendChild(majorBlock);

    if (resolvedOptions.showTrendDelta) {
        const trendBlock = document.createElement('div');
        trendBlock.className = 'splunkstuff-sparkline-value-viz__trend';
        const trendValueElement = document.createElement('div');
        trendValueElement.className = 'splunkstuff-sparkline-value-viz__trendValue';
        trendValueElement.textContent = formatTrendDeltaValue(trendDeltaValue, lastValue, resolvedOptions);
        trendValueElement.style.fontSize = resolvedOptions.trendFontSize
            ? `${resolvedOptions.trendFontSize}px`
            : '16px';
        trendValueElement.style.fontWeight = '600';
        trendValueElement.style.color = trendTextColor;
        appendLabelValuePair(
            trendBlock,
            trendValueElement,
            resolvedOptions.deltaLabelText,
            trendTextColor,
            resolvedOptions.labelPosition
        );
        headlineRowElement.appendChild(trendBlock);
    }

    bodyElement.appendChild(headlineRowElement);

    let hoverAnnotationElement = null;
    if (resolvedOptions.showInChartHoverAnnotation) {
        hoverAnnotationElement = ownerDocument.createElement('div');
        hoverAnnotationElement.className = 'splunkstuff-sparkline-value-viz__hoverAnn';
        hoverAnnotationElement.setAttribute('aria-hidden', 'true');
        bodyElement.appendChild(hoverAnnotationElement);
    }

    const showSparkSection =
        resolvedOptions.showSparkline && resolvedOptions.sparklineDisplay !== 'off';
    let sparkContainer = null;
    if (showSparkSection) {
        sparkContainer = document.createElement('div');
        sparkContainer.className = 'splunkstuff-sparkline-value-viz__spark';
        if (resolvedOptions.sparkEdgeToEdge) {
            sparkContainer.className += ' splunkstuff-sparkline-value-viz__spark--edgeToEdge';
        }
        sparkContainer.style.position = 'absolute';
        sparkContainer.style.left = resolvedOptions.sparkEdgeToEdge ? '0' : '10px';
        sparkContainer.style.right = resolvedOptions.sparkEdgeToEdge ? '0' : '10px';
        sparkContainer.style.bottom = '8px';
        sparkContainer.style.overflow = 'visible';
        bodyElement.appendChild(sparkContainer);
    }

    rootElement.appendChild(bodyElement);
    mountElement.appendChild(rootElement);

    if (showSparkSection && sparkContainer) {
        paintSparkline(
            sparkContainer,
            { ...seriesData, valueSeries },
            resolvedOptions,
            sparklineStrokeColor,
            scale,
            ownerDocument,
            hoverAnnotationElement,
            sharedHover
        );
    }
}

export function sortTrellisGroups(trellisGroups, resolvedOptions) {
    const sortedGroups = trellisGroups.slice();
    const sortDescending = resolvedOptions.trellisSortOrder === 'descending';
    sortedGroups.sort((left, right) => {
        let comparison = 0;
        if (resolvedOptions.trellisSortBy === 'name') {
            comparison = left.categoryLabel.localeCompare(right.categoryLabel);
        } else if (resolvedOptions.trellisSortBy === 'value') {
            comparison =
                (left.valueSeries[left.valueSeries.length - 1] || 0) -
                (right.valueSeries[right.valueSeries.length - 1] || 0);
        } else if (resolvedOptions.trellisSortBy === 'trend') {
            comparison = calculateTrendDelta(left.valueSeries) - calculateTrendDelta(right.valueSeries);
        }
        return sortDescending ? -comparison : comparison;
    });
    return sortedGroups;
}

export function renderTrellisGrid(mountElement, trellisGroups, resolvedOptions, ownerDocument, sharedHover) {
    const sortedGroups = sortTrellisGroups(trellisGroups, resolvedOptions);
    const pageSize = Math.max(1, resolvedOptions.trellisPageSize || 20);
    const visibleGroups = sortedGroups.slice(0, pageSize);

    const gridElement = document.createElement('div');
    gridElement.className = 'splunkstuff-sparkline-value-viz__trellisGrid';
    if (resolvedOptions.trellisBackgroundColor) {
        gridElement.style.background = resolvedOptions.trellisBackgroundColor;
    }
    if (resolvedOptions.trellisColumnCount > 0) {
        gridElement.style.gridTemplateColumns = `repeat(${resolvedOptions.trellisColumnCount}, minmax(${resolvedOptions.trellisMinimumColumnWidth}px, 1fr))`;
    } else {
        gridElement.style.gridTemplateColumns = `repeat(auto-fill, minmax(${resolvedOptions.trellisMinimumColumnWidth}px, 1fr))`;
    }

    for (let groupIndex = 0; groupIndex < visibleGroups.length; groupIndex += 1) {
        const group = visibleGroups[groupIndex];
        const cellElement = document.createElement('div');
        cellElement.className = 'splunkstuff-sparkline-value-viz__trellisCell';
        cellElement.style.minHeight = `${resolvedOptions.trellisRowHeight}px`;

        const titleElement = document.createElement('div');
        titleElement.className = 'splunkstuff-sparkline-value-viz__trellisTitle';
        titleElement.textContent = group.categoryLabel;
        cellElement.appendChild(titleElement);

        const tileMount = document.createElement('div');
        tileMount.className = 'splunkstuff-sparkline-value-viz__trellisTileMount';
        cellElement.appendChild(tileMount);
        gridElement.appendChild(cellElement);

        renderKpiSparklineTile(tileMount, group, resolvedOptions, ownerDocument, sharedHover);
    }

    mountElement.appendChild(gridElement);
}

export function cleanupSharedHover(sharedHover) {
    if (sharedHover.cleanupHandlers) {
        for (let handlerIndex = 0; handlerIndex < sharedHover.cleanupHandlers.length; handlerIndex += 1) {
            sharedHover.cleanupHandlers[handlerIndex]();
        }
        sharedHover.cleanupHandlers = [];
    }
    if (sharedHover.tooltipElement && sharedHover.tooltipElement.parentNode) {
        sharedHover.tooltipElement.parentNode.removeChild(sharedHover.tooltipElement);
        sharedHover.tooltipElement = null;
    }
}

export { VIZ_BUILD };
