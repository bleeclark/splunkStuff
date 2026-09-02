/**
 * @file generate-config.mjs
 * @description Generates Dashboard Studio config.json with select/number/checkbox/color editors.
 *   Run: node generate-config.mjs
 *   Then: yarn workspace @splunk/kpi-sparkline-studio run build
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

/** Shared select lists — values must match resolveOptions.js / renderTile.js */
const SELECTS = {
    align: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
    ],
    headlineLayout: [
        { label: 'Stacked', value: 'stacked' },
        { label: 'Side by side', value: 'inline' },
    ],
    labelPosition: [
        { label: 'Above value', value: 'above' },
        { label: 'Right of value', value: 'right' },
    ],
    subheaderStyle: [
        { label: 'Match tile color', value: 'matchTile' },
        { label: 'Dark blue bar', value: 'darkBlue' },
        { label: 'Dark overlay', value: 'overlay' },
    ],
    sparklineDisplay: [
        { label: 'Below headline', value: 'below' },
        { label: 'Hidden', value: 'off' },
    ],
    unitPosition: [
        { label: 'After value', value: 'after' },
        { label: 'Before value', value: 'before' },
    ],
    trendDisplay: [
        { label: 'Absolute', value: 'absolute' },
        { label: 'Percent', value: 'percent' },
        { label: 'Off', value: 'off' },
    ],
    deltaMode: [
        { label: 'Absolute', value: 'absolute' },
        { label: 'Percent', value: 'percent' },
    ],
    sparklineNullValueDisplay: [
        { label: 'Gaps', value: 'gaps' },
        { label: 'Zero', value: 'zero' },
        { label: 'Connect', value: 'connect' },
    ],
    splitByLayout: [
        { label: 'Off', value: 'off' },
        { label: 'Trellis', value: 'trellis' },
    ],
    trellisSortBy: [
        { label: 'Result order', value: 'result' },
        { label: 'Name', value: 'name' },
        { label: 'Value', value: 'value' },
        { label: 'Trend', value: 'trend' },
    ],
    trellisSortOrder: [
        { label: 'Ascending', value: 'ascending' },
        { label: 'Descending', value: 'descending' },
    ],
};

/** [name, type, defaultValue, editorKind, selectKey?] */
const optionDefinitions = [
    ['align', 'string', 'center', 'select', 'align'],
    ['headlineLayout', 'string', 'stacked', 'select', 'headlineLayout'],
    ['labelPosition', 'string', 'above', 'select', 'labelPosition'],
    ['subheaderStyle', 'string', 'matchTile', 'select', 'subheaderStyle'],
    ['sparkEdgeToEdge', 'boolean', false, 'checkbox'],
    ['sparklineDisplay', 'string', 'below', 'select', 'sparklineDisplay'],
    ['sparkMin', 'string', '', 'text'],
    ['sparkMax', 'string', '', 'text'],
    ['sparkAuto', 'boolean', true, 'checkbox'],
    ['goodColor', 'string', '#01417F', 'color'],
    ['badColor', 'string', '#DFA611', 'color'],
    ['invertTrend', 'boolean', false, 'checkbox'],
    ['textColor', 'string', '#FFFFFF', 'color'],
    ['background', 'string', '#0B1F3B', 'color'],
    ['backgroundColor', 'string', '', 'color'],
    ['subheader', 'string', '', 'text'],
    ['unit', 'string', '', 'text'],
    ['unitPosition', 'string', 'after', 'select', 'unitPosition'],
    ['precision', 'number', 2, 'number'],
    ['numberPrecision', 'number', 2, 'number'],
    ['showDelta', 'boolean', true, 'checkbox'],
    ['deltaMode', 'string', 'absolute', 'select', 'deltaMode'],
    ['trendDisplay', 'string', 'absolute', 'select', 'trendDisplay'],
    ['showSparkline', 'boolean', true, 'checkbox'],
    ['sparkStroke', 'string', '#FFFFFF', 'color'],
    ['sparklineStrokeColor', 'string', '#FFFFFF', 'color'],
    ['sparkStrokeWidth', 'number', 2, 'number'],
    ['showSparklineAreaGraph', 'boolean', false, 'checkbox'],
    ['sparklineAreaColor', 'string', '#FFFFFF', 'color'],
    ['sparklineNullValueDisplay', 'string', 'gaps', 'select', 'sparklineNullValueDisplay'],
    ['sparklineHighlightDots', 'number', 0, 'number'],
    ['sparklineHighlightSegments', 'number', 0, 'number'],
    ['annotationField', 'string', 'annotation', 'text'],
    ['showAnnotationHover', 'boolean', true, 'checkbox'],
    ['showAnnotationLabels', 'boolean', false, 'checkbox'],
    ['showTarget', 'boolean', false, 'checkbox'],
    ['target', 'number', 50, 'number'],
    ['showThresholdBand', 'boolean', false, 'checkbox'],
    ['thresholdMin', 'number', 20, 'number'],
    ['thresholdMax', 'number', 80, 'number'],
    ['showHover', 'boolean', true, 'checkbox'],
    ['showSparklineTooltip', 'boolean', true, 'checkbox'],
    ['showHoverAnnotation', 'boolean', true, 'checkbox'],
    ['tooltipPrefix', 'string', '', 'text'],
    ['majorLabel', 'string', '', 'text'],
    ['deltaLabel', 'string', '', 'text'],
    ['badgeText', 'string', '', 'text'],
    ['underLabel', 'string', '', 'text'],
    ['underLabelColor', 'string', '', 'color'],
    ['underLabelFontSize', 'number', 12, 'number'],
    ['majorColor', 'string', '#FFFFFF', 'color'],
    ['majorFontSize', 'number', 0, 'number'],
    ['majorValueField', 'string', '', 'text'],
    ['shouldAbbreviateMajorValue', 'boolean', false, 'checkbox'],
    ['shouldAbbreviateTrendValue', 'boolean', false, 'checkbox'],
    ['shouldUseThousandSeparators', 'boolean', true, 'checkbox'],
    ['trendColor', 'string', '#FFFFFF', 'color'],
    ['trendFontSize', 'number', 0, 'number'],
    ['sparkPointLabels', 'string', '', 'text'],
    ['showPointLabels', 'boolean', false, 'checkbox'],
    ['emptyText', 'string', 'No numeric results to display.', 'text'],
    ['splitByLayout', 'string', 'off', 'select', 'splitByLayout'],
    ['trellisSplitBy', 'string', '', 'text'],
    ['trellisBackgroundColor', 'string', '', 'color'],
    ['trellisColumns', 'number', 0, 'number'],
    ['trellisMinColumnWidth', 'number', 100, 'number'],
    ['trellisPageCount', 'number', 20, 'number'],
    ['trellisRowHeight', 'number', 70, 'number'],
    ['trellisSortBy', 'string', 'result', 'select', 'trellisSortBy'],
    ['trellisSortOrder', 'string', 'ascending', 'select', 'trellisSortOrder'],
];

const optionsSchema = {};
for (const [name, type, defaultValue, editorKind, selectKey] of optionDefinitions) {
    const schemaEntry = { type, default: defaultValue };
    if (editorKind === 'select' && selectKey && SELECTS[selectKey]) {
        schemaEntry.enum = SELECTS[selectKey].map((item) => item.value);
    }
    optionsSchema[name] = schemaEntry;
}

function editorRow(optionName, label, editor = 'editor.text', items) {
    const row = { editor, label, option: optionName };
    if (items && items.length) {
        row.items = items;
    }
    return [row];
}

function editorSelect(optionName, label, selectKey) {
    return editorRow(optionName, label, 'editor.select', SELECTS[selectKey]);
}

function editorNumber(optionName, label) {
    return editorRow(optionName, label, 'editor.number');
}

function editorText(optionName, label) {
    return editorRow(optionName, label, 'editor.text');
}

function editorCheckbox(optionName, label) {
    return editorRow(optionName, label, 'editor.checkbox');
}

function editorColor(optionName, label) {
    return editorRow(optionName, label, 'editor.color');
}

const config = {
    showTitleAndDescription: true,
    includeInToolbar: true,
    includeInVizSwitcher: true,
    showDrilldown: false,
    canSetTokens: [],
    hasEventHandlers: false,
    config: {
        name: 'BGDHamp KPI + Sparkline',
        description:
            'Dashboard Studio KPI tile with delta, sparkline, optional area fill, annotations, thresholds, and trellis.',
        category: 'Custom',
        dataContract: {
            requiredDataSources: ['primary'],
            optionalDataSources: [],
        },
        size: { initialWidth: 400, initialHeight: 280 },
        optionsSchema,
        editorConfig: [
            {
                label: 'Layout',
                layout: [
                    editorSelect('align', 'Content align', 'align'),
                    editorSelect('headlineLayout', 'Headline layout', 'headlineLayout'),
                    editorSelect('labelPosition', 'Label position', 'labelPosition'),
                    editorSelect('subheaderStyle', 'Subheader style', 'subheaderStyle'),
                    editorCheckbox('sparkEdgeToEdge', 'Spark edge to edge'),
                    editorSelect('sparklineDisplay', 'Sparkline display', 'sparklineDisplay'),
                ],
            },
            {
                label: 'Major value',
                layout: [
                    editorColor('majorColor', 'Major color'),
                    editorNumber('majorFontSize', 'Major font size (px)'),
                    editorText('majorValueField', 'Major value field'),
                    editorNumber('numberPrecision', 'Decimal precision'),
                    editorCheckbox('shouldAbbreviateMajorValue', 'Abbreviate major'),
                    editorCheckbox('shouldUseThousandSeparators', 'Thousand separators'),
                    editorText('unit', 'Unit'),
                    editorSelect('unitPosition', 'Unit position', 'unitPosition'),
                    editorText('underLabel', 'Under label'),
                    editorColor('underLabelColor', 'Under label color'),
                    editorNumber('underLabelFontSize', 'Under label font size'),
                ],
            },
            {
                label: 'Trend',
                layout: [
                    editorColor('trendColor', 'Trend color'),
                    editorNumber('trendFontSize', 'Trend font size (px)'),
                    editorSelect('trendDisplay', 'Trend display', 'trendDisplay'),
                    editorCheckbox('shouldAbbreviateTrendValue', 'Abbreviate trend'),
                    editorCheckbox('showDelta', 'Show delta (legacy)'),
                    editorSelect('deltaMode', 'Delta mode (legacy)', 'deltaMode'),
                ],
            },
            {
                label: 'Colors and tile',
                layout: [
                    editorColor('backgroundColor', 'Background color'),
                    editorColor('goodColor', 'Up trend color'),
                    editorColor('badColor', 'Down trend color'),
                    editorCheckbox('invertTrend', 'Invert trend'),
                    editorColor('textColor', 'Text color'),
                    editorColor('background', 'Empty background'),
                    editorText('subheader', 'Subheader'),
                ],
            },
            {
                label: 'Sparkline',
                layout: [
                    editorCheckbox('showSparkline', 'Show sparkline'),
                    editorCheckbox('showSparklineAreaGraph', 'Area graph'),
                    editorColor('sparklineStrokeColor', 'Stroke color'),
                    editorColor('sparklineAreaColor', 'Area color'),
                    editorNumber('sparkStrokeWidth', 'Stroke width'),
                    editorSelect('sparklineNullValueDisplay', 'Null value display', 'sparklineNullValueDisplay'),
                    editorNumber('sparklineHighlightDots', 'Highlight dots'),
                    editorNumber('sparklineHighlightSegments', 'Highlight segments'),
                    editorText('sparkMin', 'Spark min'),
                    editorText('sparkMax', 'Spark max'),
                    editorCheckbox('sparkAuto', 'Auto scale'),
                ],
            },
            {
                label: 'Annotations',
                layout: [
                    editorText('annotationField', 'Annotation field'),
                    editorCheckbox('showAnnotationHover', 'Annotation on hover'),
                    editorCheckbox('showAnnotationLabels', 'Annotation on spark'),
                ],
            },
            {
                label: 'Targets and thresholds',
                layout: [
                    editorCheckbox('showTarget', 'Show target'),
                    editorNumber('target', 'Target value'),
                    editorCheckbox('showThresholdBand', 'Threshold band'),
                    editorNumber('thresholdMin', 'Threshold min'),
                    editorNumber('thresholdMax', 'Threshold max'),
                ],
            },
            {
                label: 'Interaction',
                layout: [
                    editorCheckbox('showSparklineTooltip', 'Spark tooltip'),
                    editorCheckbox('showHoverAnnotation', 'In-chart hover text'),
                    editorText('tooltipPrefix', 'Tooltip prefix'),
                ],
            },
            {
                label: 'Labels',
                layout: [
                    editorText('majorLabel', 'Major label'),
                    editorText('deltaLabel', 'Delta label'),
                    editorText('badgeText', 'Badge text'),
                    editorText('sparkPointLabels', 'Point labels'),
                    editorCheckbox('showPointLabels', 'Show point labels'),
                ],
            },
            {
                label: 'Trellis',
                layout: [
                    editorSelect('splitByLayout', 'Split layout', 'splitByLayout'),
                    editorText('trellisSplitBy', 'Split by field'),
                    editorColor('trellisBackgroundColor', 'Trellis background'),
                    editorNumber('trellisColumns', 'Columns'),
                    editorNumber('trellisMinColumnWidth', 'Min column width'),
                    editorNumber('trellisPageCount', 'Page size'),
                    editorNumber('trellisRowHeight', 'Row height'),
                    editorSelect('trellisSortBy', 'Sort by', 'trellisSortBy'),
                    editorSelect('trellisSortOrder', 'Sort order', 'trellisSortOrder'),
                ],
            },
            {
                label: 'Empty state',
                layout: [editorText('emptyText', 'Empty message')],
            },
        ],
    },
};

fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 4)}\n`);
console.log('generate-config: wrote', outputPath);
