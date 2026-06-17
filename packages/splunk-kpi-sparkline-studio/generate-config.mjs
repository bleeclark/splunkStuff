/**
 * @file generate-config.mjs
 * @description Generates Dashboard Studio config.json from optionDefinitions.
 *   Each entry becomes a config.options key with type/default and an editorConfig
 *   row in the Studio visualization property panel (including the Annotations section:
 *   annotationField, showAnnotationHover, showAnnotationLabels).
 *
 * Run before build when adding or renaming formatter options:
 *   node generate-config.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(
    packageRoot,
    'visualizations',
    'splunkstuff_kpi_sparkline_studio',
    'config.json'
);

const optionDefinitions = [
    ['align', 'string', 'center'],
    ['headlineLayout', 'string', 'stacked'],
    ['labelPosition', 'string', 'above'],
    ['subheaderStyle', 'string', 'matchTile'],
    ['sparkEdgeToEdge', 'boolean', false],
    ['sparklineDisplay', 'string', 'below'],
    ['sparkMin', 'string', ''],
    ['sparkMax', 'string', ''],
    ['sparkAuto', 'boolean', false],
    ['goodColor', 'string', '#01417F'],
    ['badColor', 'string', '#DFA611'],
    ['invertTrend', 'boolean', false],
    ['textColor', 'string', '#FFFFFF'],
    ['background', 'string', '#0B1F3B'],
    ['backgroundColor', 'string', ''],
    ['subheader', 'string', ''],
    ['unit', 'string', ''],
    ['unitPosition', 'string', 'after'],
    ['precision', 'number', 2],
    ['numberPrecision', 'number', 2],
    ['showDelta', 'boolean', true],
    ['deltaMode', 'string', 'absolute'],
    ['trendDisplay', 'string', 'absolute'],
    ['showSparkline', 'boolean', true],
    ['sparkStroke', 'string', '#FFFFFF'],
    ['sparklineStrokeColor', 'string', '#FFFFFF'],
    ['sparkStrokeWidth', 'number', 2],
    ['showSparklineAreaGraph', 'boolean', false],
    ['sparklineAreaColor', 'string', '#FFFFFF'],
    ['sparklineNullValueDisplay', 'string', 'gaps'],
    ['sparklineHighlightDots', 'number', 0],
    ['sparklineHighlightSegments', 'number', 0],
    ['annotationField', 'string', 'annotation'],
    ['showAnnotationHover', 'boolean', true],
    ['showAnnotationLabels', 'boolean', false],
    ['showTarget', 'boolean', false],
    ['target', 'number', 50],
    ['showThresholdBand', 'boolean', false],
    ['thresholdMin', 'number', 20],
    ['thresholdMax', 'number', 80],
    ['showHover', 'boolean', true],
    ['showSparklineTooltip', 'boolean', true],
    ['showHoverAnnotation', 'boolean', true],
    ['tooltipPrefix', 'string', ''],
    ['majorLabel', 'string', ''],
    ['deltaLabel', 'string', ''],
    ['badgeText', 'string', ''],
    ['underLabel', 'string', ''],
    ['underLabelColor', 'string', ''],
    ['underLabelFontSize', 'number', 12],
    ['majorColor', 'string', '#FFFFFF'],
    ['majorFontSize', 'number', 0],
    ['majorValueField', 'string', ''],
    ['shouldAbbreviateMajorValue', 'boolean', false],
    ['shouldAbbreviateTrendValue', 'boolean', false],
    ['shouldUseThousandSeparators', 'boolean', true],
    ['trendColor', 'string', '#FFFFFF'],
    ['trendFontSize', 'number', 0],
    ['sparkPointLabels', 'string', ''],
    ['showPointLabels', 'boolean', false],
    ['emptyText', 'string', 'No numeric results to display.'],
    ['splitByLayout', 'string', 'off'],
    ['trellisSplitBy', 'string', ''],
    ['trellisBackgroundColor', 'string', ''],
    ['trellisColumns', 'number', 0],
    ['trellisMinColumnWidth', 'number', 100],
    ['trellisPageCount', 'number', 20],
    ['trellisRowHeight', 'number', 70],
    ['trellisSortBy', 'string', 'result'],
    ['trellisSortOrder', 'string', 'ascending'],
];

const optionsSchema = {};
for (const [name, type, defaultValue] of optionDefinitions) {
    optionsSchema[name] = { type, default: defaultValue };
}

function editorRow(optionName, label, editor = 'editor.text') {
    return [{ editor, label, option: optionName }];
}

const config = {
    showTitleAndDescription: true,
    includeInToolbar: true,
    includeInVizSwitcher: true,
    showDrilldown: false,
    config: {
        name: 'SplunkStuff KPI + Sparkline',
        description:
            'Dashboard Studio KPI tile with delta, sparkline, optional area fill, annotations, thresholds, and trellis.',
        category: 'Custom',
        dataContract: { requiredDataSources: ['primary'] },
        size: { initialWidth: 400, initialHeight: 280 },
        optionsSchema,
        editorConfig: [
            {
                label: 'Layout',
                layout: [
                    editorRow('align', 'Content align'),
                    editorRow('headlineLayout', 'Headline layout'),
                    editorRow('labelPosition', 'Label position'),
                    editorRow('subheaderStyle', 'Subheader style'),
                    editorRow('sparkEdgeToEdge', 'Spark edge to edge', 'editor.checkbox'),
                    editorRow('sparklineDisplay', 'Sparkline display'),
                ],
            },
            {
                label: 'Major value',
                layout: [
                    editorRow('majorColor', 'Major color', 'editor.color'),
                    editorRow('majorFontSize', 'Major font size (px)'),
                    editorRow('majorValueField', 'Major value field'),
                    editorRow('numberPrecision', 'Decimal precision'),
                    editorRow('shouldAbbreviateMajorValue', 'Abbreviate major', 'editor.checkbox'),
                    editorRow('shouldUseThousandSeparators', 'Thousand separators', 'editor.checkbox'),
                    editorRow('unit', 'Unit'),
                    editorRow('unitPosition', 'Unit position'),
                    editorRow('underLabel', 'Under label'),
                    editorRow('underLabelColor', 'Under label color', 'editor.color'),
                    editorRow('underLabelFontSize', 'Under label font size'),
                ],
            },
            {
                label: 'Trend',
                layout: [
                    editorRow('trendColor', 'Trend color', 'editor.color'),
                    editorRow('trendFontSize', 'Trend font size (px)'),
                    editorRow('trendDisplay', 'Trend display'),
                    editorRow('shouldAbbreviateTrendValue', 'Abbreviate trend', 'editor.checkbox'),
                    editorRow('showDelta', 'Show delta (legacy)', 'editor.checkbox'),
                    editorRow('deltaMode', 'Delta mode (legacy)'),
                ],
            },
            {
                label: 'Colors and tile',
                layout: [
                    editorRow('backgroundColor', 'Background color', 'editor.color'),
                    editorRow('goodColor', 'Up trend color', 'editor.color'),
                    editorRow('badColor', 'Down trend color', 'editor.color'),
                    editorRow('invertTrend', 'Invert trend', 'editor.checkbox'),
                    editorRow('textColor', 'Text color', 'editor.color'),
                    editorRow('background', 'Empty background', 'editor.color'),
                    editorRow('subheader', 'Subheader'),
                ],
            },
            {
                label: 'Sparkline',
                layout: [
                    editorRow('showSparkline', 'Show sparkline', 'editor.checkbox'),
                    editorRow('showSparklineAreaGraph', 'Area graph', 'editor.checkbox'),
                    editorRow('sparklineStrokeColor', 'Stroke color', 'editor.color'),
                    editorRow('sparklineAreaColor', 'Area color', 'editor.color'),
                    editorRow('sparkStrokeWidth', 'Stroke width'),
                    editorRow('sparklineNullValueDisplay', 'Null value display'),
                    editorRow('sparklineHighlightDots', 'Highlight dots'),
                    editorRow('sparklineHighlightSegments', 'Highlight segments'),
                    editorRow('sparkMin', 'Spark min'),
                    editorRow('sparkMax', 'Spark max'),
                    editorRow('sparkAuto', 'Auto scale', 'editor.checkbox'),
                ],
            },
            {
                label: 'Annotations',
                layout: [
                    editorRow('annotationField', 'Annotation field'),
                    editorRow('showAnnotationHover', 'Annotation on hover', 'editor.checkbox'),
                    editorRow('showAnnotationLabels', 'Annotation on spark', 'editor.checkbox'),
                ],
            },
            {
                label: 'Targets and thresholds',
                layout: [
                    editorRow('showTarget', 'Show target', 'editor.checkbox'),
                    editorRow('target', 'Target value'),
                    editorRow('showThresholdBand', 'Threshold band', 'editor.checkbox'),
                    editorRow('thresholdMin', 'Threshold min'),
                    editorRow('thresholdMax', 'Threshold max'),
                ],
            },
            {
                label: 'Interaction',
                layout: [
                    editorRow('showSparklineTooltip', 'Spark tooltip', 'editor.checkbox'),
                    editorRow('showHoverAnnotation', 'In-chart hover text', 'editor.checkbox'),
                    editorRow('tooltipPrefix', 'Tooltip prefix'),
                ],
            },
            {
                label: 'Labels',
                layout: [
                    editorRow('majorLabel', 'Major label'),
                    editorRow('deltaLabel', 'Delta label'),
                    editorRow('badgeText', 'Badge text'),
                    editorRow('sparkPointLabels', 'Point labels'),
                    editorRow('showPointLabels', 'Show point labels', 'editor.checkbox'),
                ],
            },
            {
                label: 'Trellis',
                layout: [
                    editorRow('splitByLayout', 'Split layout'),
                    editorRow('trellisSplitBy', 'Split by field'),
                    editorRow('trellisBackgroundColor', 'Trellis background', 'editor.color'),
                    editorRow('trellisColumns', 'Columns'),
                    editorRow('trellisMinColumnWidth', 'Min column width'),
                    editorRow('trellisPageCount', 'Page size'),
                    editorRow('trellisRowHeight', 'Row height'),
                    editorRow('trellisSortBy', 'Sort by'),
                    editorRow('trellisSortOrder', 'Sort order'),
                ],
            },
            {
                label: 'Empty state',
                layout: [editorRow('emptyText', 'Empty message')],
            },
        ],
    },
};

fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 4)}\n`);
console.log('generate-config: wrote', outputPath);
