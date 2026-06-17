/**
 * @file resolveOptions.js
 * @description Normalizes Dashboard Studio config.json / formatter option keys into a
 *   single descriptive `resolvedOptions` object used by parse, format, and render code.
 *   Supports legacy Classic KPI sparkline aliases (e.g. showHover → showSparklineTooltip,
 *   goodColor → upTrendColor) so saved dashboards migrate without renaming every key.
 *
 * Option groups:
 *   - Layout: align, headlineLayout, labelPosition, subheaderStyle, sparklineDisplay
 *   - Colors/trend: upTrendColor, downTrendColor, invertTrendDirection, trendDisplay
 *   - Sparkline: stroke, area fill, scale, null handling, targets/thresholds
 *   - Annotations: annotationField, showAnnotationHover, showAnnotationLabels
 *   - Interaction: showSparklineTooltip, showHoverAnnotation, tooltipPrefix
 *   - Labels: majorLabel, deltaLabel, badgeText, sparkPointLabels
 *   - Trellis: splitByLayout, trellisSplitBy, grid sizing/sort options
 *
 * @see generate-config.mjs — source of config.json option definitions
 * @see visualization.js — passes rawOptions from VisualizationAPI.addOptionsListener
 */

import { parseTruthyOption } from './booleanParsing.js';

// --- Option readers (multi-key fallback) ---

/**
 * Returns the first non-empty string among the given option keys.
 *
 * @param {object} rawOptions - Raw Studio options object
 * @param {...string} keys - Option keys to try in order
 * @returns {string} Trimmed value or ""
 */
function readOptionString(rawOptions, ...keys) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const key = keys[keyIndex];
        if (rawOptions[key] !== undefined && rawOptions[key] !== null && String(rawOptions[key]).trim() !== '') {
            return String(rawOptions[key]).trim();
        }
    }
    return '';
}

/**
 * Returns the first parseable finite number among the given option keys.
 *
 * @param {object} rawOptions - Raw Studio options
 * @param {string[]} keys - Keys to try in order
 * @param {number} fallbackNumber - Default when no valid number found
 * @returns {number}
 */
function readOptionNumber(rawOptions, keys, fallbackNumber) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const key = keys[keyIndex];
        if (rawOptions[key] !== undefined && rawOptions[key] !== null && String(rawOptions[key]).trim() !== '') {
            const parsed = parseFloat(rawOptions[key], 10);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }
    return fallbackNumber;
}

/**
 * Returns the first defined boolean among keys, parsed via parseTruthyOption.
 *
 * @param {object} rawOptions - Raw Studio options
 * @param {string[]} keys - Keys to try in order
 * @param {boolean} fallbackBoolean - Default when no key is set
 * @returns {boolean}
 */
function readOptionBoolean(rawOptions, keys, fallbackBoolean) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const key = keys[keyIndex];
        if (rawOptions[key] !== undefined && rawOptions[key] !== null) {
            return parseTruthyOption(rawOptions[key]);
        }
    }
    return fallbackBoolean;
}

// --- Legacy / grouped option resolution ---

/**
 * Resolves trend display from native trendDisplay or legacy showDelta + deltaMode.
 *
 * @param {object} rawOptions - Raw Studio options
 * @returns {{ showTrendDelta: boolean, trendDisplayMode: 'absolute'|'percent' }}
 */
function resolveTrendDisplayMode(rawOptions) {
    const trendDisplay = readOptionString(rawOptions, 'trendDisplay').toLowerCase();
    if (trendDisplay === 'off') {
        return { showTrendDelta: false, trendDisplayMode: 'absolute' };
    }
    if (trendDisplay === 'percent') {
        return { showTrendDelta: true, trendDisplayMode: 'percent' };
    }
    if (trendDisplay === 'absolute') {
        return { showTrendDelta: true, trendDisplayMode: 'absolute' };
    }
    const legacyShowDelta = readOptionBoolean(rawOptions, ['showDelta'], true);
    const legacyDeltaMode = readOptionString(rawOptions, 'deltaMode', 'absolute').toLowerCase();
    return {
        showTrendDelta: legacyShowDelta,
        trendDisplayMode: legacyDeltaMode === 'percent' ? 'percent' : 'absolute',
    };
}

/**
 * Resolves subheader bar style from subheaderStyle or legacy subheaderMatchTile boolean.
 *
 * @param {object} rawOptions - Raw Studio options
 * @returns {string} "matchtile" | "darkblue" | "overlay" (lowercase)
 */
function resolveSubheaderStyle(rawOptions) {
    const explicitStyle = readOptionString(rawOptions, 'subheaderStyle').toLowerCase();
    if (explicitStyle) {
        return explicitStyle;
    }
    return readOptionBoolean(rawOptions, ['subheaderMatchTile'], true) ? 'matchtile' : 'overlay';
}

// --- Public API ---

/**
 * Maps raw Dashboard Studio options to descriptive internal property names.
 * This is the single configuration contract for parsePrimarySearchData, formatters,
 * and renderTile — avoid reading rawOptions elsewhere.
 *
 * @param {object} rawOptions - Options from VisualizationAPI.addOptionsListener
 * @returns {object} resolvedOptions — fully normalized configuration snapshot
 */
export function resolveOptions(rawOptions) {
    const trendDisplay = resolveTrendDisplayMode(rawOptions || {});
    const numberPrecision = readOptionNumber(
        rawOptions || {},
        ['numberPrecision', 'precision'],
        2
    );
    const sparklineStrokeColor = readOptionString(rawOptions, 'sparklineStrokeColor', 'sparkStroke') || '#FFFFFF';
    const sparklineAreaColor =
        readOptionString(rawOptions, 'sparklineAreaColor') || sparklineStrokeColor;

    return {
        // --- Layout ---
        align: readOptionString(rawOptions, 'align', 'center').toLowerCase() || 'center',
        headlineLayout: readOptionString(rawOptions, 'headlineLayout', 'stacked').toLowerCase() || 'stacked',
        labelPosition: readOptionString(rawOptions, 'labelPosition', 'above').toLowerCase() || 'above',
        subheaderStyle: resolveSubheaderStyle(rawOptions || {}),
        sparkEdgeToEdge: readOptionBoolean(rawOptions, ['sparkEdgeToEdge'], false),
        sparklineDisplay: readOptionString(rawOptions, 'sparklineDisplay', 'below').toLowerCase() || 'below',

        // --- Spark scale ---
        sparkScaleMinimum: readOptionString(rawOptions, 'sparkMin'),
        sparkScaleMaximum: readOptionString(rawOptions, 'sparkMax'),
        autoScaleSparkline: readOptionBoolean(rawOptions, ['sparkAuto'], false),

        // --- Trend colors ---
        upTrendColor: readOptionString(rawOptions, 'goodColor') || '#01417F',
        downTrendColor: readOptionString(rawOptions, 'badColor') || '#DFA611',
        invertTrendDirection: readOptionBoolean(rawOptions, ['invertTrend'], false),
        defaultTextColor: readOptionString(rawOptions, 'textColor') || '#FFFFFF',
        emptyStateBackgroundColor: readOptionString(rawOptions, 'background') || '#0B1F3B',
        tileBackgroundColorOverride: readOptionString(rawOptions, 'backgroundColor'),

        subheaderText: readOptionString(rawOptions, 'subheader'),
        unitText: readOptionString(rawOptions, 'unit'),
        unitPosition: readOptionString(rawOptions, 'unitPosition', 'after').toLowerCase() || 'after',
        numberPrecision,
        showTrendDelta: trendDisplay.showTrendDelta,
        trendDisplayMode: trendDisplay.trendDisplayMode,

        // --- Sparkline appearance ---
        showSparkline: readOptionBoolean(rawOptions, ['showSparkline'], true),
        sparklineStrokeColor,
        sparklineStrokeWidth: readOptionNumber(rawOptions, ['sparkStrokeWidth'], 2),
        showSparklineAreaFill: readOptionBoolean(rawOptions, ['showSparklineAreaGraph'], false),
        sparklineAreaColor,
        sparklineNullValueDisplay:
            readOptionString(rawOptions, 'sparklineNullValueDisplay', 'gaps').toLowerCase() || 'gaps',
        sparklineHighlightDotCount: readOptionNumber(rawOptions, ['sparklineHighlightDots'], 0),
        sparklineHighlightSegmentCount: readOptionNumber(rawOptions, ['sparklineHighlightSegments'], 0),

        // --- Search-driven annotations (see parsePrimaryData stringFieldsByName) ---
        annotationFieldName: readOptionString(rawOptions, 'annotationField', 'annotation'),
        showAnnotationOnHover: readOptionBoolean(rawOptions, ['showAnnotationHover'], true),
        showAnnotationOnSpark: readOptionBoolean(rawOptions, ['showAnnotationLabels'], false),

        // --- Targets and thresholds ---
        showTargetLine: readOptionBoolean(rawOptions, ['showTarget'], false),
        targetValue: readOptionNumber(rawOptions, ['target'], 50),
        showThresholdBand: readOptionBoolean(rawOptions, ['showThresholdBand'], false),
        thresholdMinimum: readOptionNumber(rawOptions, ['thresholdMin'], 20),
        thresholdMaximum: readOptionNumber(rawOptions, ['thresholdMax'], 80),

        // --- Hover / interaction ---
        showSparklineTooltip: readOptionBoolean(
            rawOptions,
            ['showSparklineTooltip', 'showHover'],
            true
        ),
        showInChartHoverAnnotation: readOptionBoolean(rawOptions, ['showHoverAnnotation'], true),
        tooltipPrefix: readOptionString(rawOptions, 'tooltipPrefix'),

        // --- Static labels ---
        majorLabelText: readOptionString(rawOptions, 'majorLabel'),
        deltaLabelText: readOptionString(rawOptions, 'deltaLabel'),
        badgeStatusText: readOptionString(rawOptions, 'badgeText'),
        underLabelText: readOptionString(rawOptions, 'underLabel'),
        sparkPointLabelsRaw: readOptionString(rawOptions, 'sparkPointLabels'),
        showSparkPointLabels: readOptionBoolean(rawOptions, ['showPointLabels'], false),
        emptyStateMessage: readOptionString(
            rawOptions,
            'emptyText',
            'No numeric results to display.'
        ),

        // --- Single Value typography overrides ---
        majorColor: readOptionString(rawOptions, 'majorColor'),
        majorFontSize: readOptionNumber(rawOptions, ['majorFontSize'], 0),
        majorValueOverride: rawOptions?.majorValue,
        majorValueDisplayOverride: rawOptions?.majorValueDisplay,
        majorValueFieldName: readOptionString(rawOptions, 'majorValueField'),
        shouldAbbreviateMajorValue: readOptionBoolean(rawOptions, ['shouldAbbreviateMajorValue'], false),
        shouldAbbreviateTrendValue: readOptionBoolean(rawOptions, ['shouldAbbreviateTrendValue'], false),
        shouldUseThousandSeparators: readOptionBoolean(rawOptions, ['shouldUseThousandSeparators'], true),
        trendColor: readOptionString(rawOptions, 'trendColor'),
        trendFontSize: readOptionNumber(rawOptions, ['trendFontSize'], 0),
        trendValueOverride: rawOptions?.trendValue,
        underLabelColor: readOptionString(rawOptions, 'underLabelColor'),
        underLabelFontSize: readOptionNumber(rawOptions, ['underLabelFontSize'], 12),
        sparklineValuesOverride: rawOptions?.sparklineValues,

        // --- Trellis ---
        splitByLayout: readOptionString(rawOptions, 'splitByLayout', 'off').toLowerCase() || 'off',
        trellisSplitByField: readOptionString(rawOptions, 'trellisSplitBy'),
        trellisBackgroundColor: readOptionString(rawOptions, 'trellisBackgroundColor'),
        trellisColumnCount: readOptionNumber(rawOptions, ['trellisColumns'], 0),
        trellisMinimumColumnWidth: readOptionNumber(rawOptions, ['trellisMinColumnWidth'], 100),
        trellisPageSize: readOptionNumber(rawOptions, ['trellisPageCount'], 20),
        trellisRowHeight: readOptionNumber(rawOptions, ['trellisRowHeight'], 70),
        trellisSortBy: readOptionString(rawOptions, 'trellisSortBy', 'result').toLowerCase() || 'result',
        trellisSortOrder:
            readOptionString(rawOptions, 'trellisSortOrder', 'ascending').toLowerCase() || 'ascending',
    };
}
