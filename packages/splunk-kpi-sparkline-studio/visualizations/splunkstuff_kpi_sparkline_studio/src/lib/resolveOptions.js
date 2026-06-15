import { parseTruthyOption } from './booleanParsing.js';

function readOptionString(rawOptions, ...keys) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const key = keys[keyIndex];
        if (rawOptions[key] !== undefined && rawOptions[key] !== null && String(rawOptions[key]).trim() !== '') {
            return String(rawOptions[key]).trim();
        }
    }
    return '';
}

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

function readOptionBoolean(rawOptions, keys, fallbackBoolean) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const key = keys[keyIndex];
        if (rawOptions[key] !== undefined && rawOptions[key] !== null) {
            return parseTruthyOption(rawOptions[key]);
        }
    }
    return fallbackBoolean;
}

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

function resolveSubheaderStyle(rawOptions) {
    const explicitStyle = readOptionString(rawOptions, 'subheaderStyle').toLowerCase();
    if (explicitStyle) {
        return explicitStyle;
    }
    return readOptionBoolean(rawOptions, ['subheaderMatchTile'], true) ? 'matchtile' : 'overlay';
}

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
        align: readOptionString(rawOptions, 'align', 'center').toLowerCase() || 'center',
        headlineLayout: readOptionString(rawOptions, 'headlineLayout', 'stacked').toLowerCase() || 'stacked',
        labelPosition: readOptionString(rawOptions, 'labelPosition', 'above').toLowerCase() || 'above',
        subheaderStyle: resolveSubheaderStyle(rawOptions || {}),
        sparkEdgeToEdge: readOptionBoolean(rawOptions, ['sparkEdgeToEdge'], false),
        sparklineDisplay: readOptionString(rawOptions, 'sparklineDisplay', 'below').toLowerCase() || 'below',

        sparkScaleMinimum: readOptionString(rawOptions, 'sparkMin'),
        sparkScaleMaximum: readOptionString(rawOptions, 'sparkMax'),
        autoScaleSparkline: readOptionBoolean(rawOptions, ['sparkAuto'], false),

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

        showSparkline: readOptionBoolean(rawOptions, ['showSparkline'], true),
        sparklineStrokeColor,
        sparklineStrokeWidth: readOptionNumber(rawOptions, ['sparkStrokeWidth'], 2),
        showSparklineAreaFill: readOptionBoolean(rawOptions, ['showSparklineAreaGraph'], false),
        sparklineAreaColor,
        sparklineNullValueDisplay:
            readOptionString(rawOptions, 'sparklineNullValueDisplay', 'gaps').toLowerCase() || 'gaps',
        sparklineHighlightDotCount: readOptionNumber(rawOptions, ['sparklineHighlightDots'], 0),
        sparklineHighlightSegmentCount: readOptionNumber(rawOptions, ['sparklineHighlightSegments'], 0),

        annotationFieldName: readOptionString(rawOptions, 'annotationField', 'annotation'),
        showAnnotationOnHover: readOptionBoolean(rawOptions, ['showAnnotationHover'], true),
        showAnnotationOnSpark: readOptionBoolean(rawOptions, ['showAnnotationLabels'], false),

        showTargetLine: readOptionBoolean(rawOptions, ['showTarget'], false),
        targetValue: readOptionNumber(rawOptions, ['target'], 50),
        showThresholdBand: readOptionBoolean(rawOptions, ['showThresholdBand'], false),
        thresholdMinimum: readOptionNumber(rawOptions, ['thresholdMin'], 20),
        thresholdMaximum: readOptionNumber(rawOptions, ['thresholdMax'], 80),

        showSparklineTooltip: readOptionBoolean(
            rawOptions,
            ['showSparklineTooltip', 'showHover'],
            true
        ),
        showInChartHoverAnnotation: readOptionBoolean(rawOptions, ['showHoverAnnotation'], true),
        tooltipPrefix: readOptionString(rawOptions, 'tooltipPrefix'),

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
