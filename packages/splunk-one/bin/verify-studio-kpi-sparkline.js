#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const splunkOneRoot = path.join(__dirname, '..');
const studioRoot = path.join(splunkOneRoot, '..', 'splunk-kpi-sparkline-studio');
const visualizationId = 'splunkstuff_kpi_sparkline_studio';
const builtJs = path.join(studioRoot, 'dist', visualizationId, 'visualization.js');
const configJson = path.join(studioRoot, 'visualizations', visualizationId, 'config.json');
const sourceDir = path.join(studioRoot, 'visualizations', visualizationId, 'src');

const requiredOptionKeys = [
    'align',
    'headlineLayout',
    'labelPosition',
    'subheaderStyle',
    'sparkEdgeToEdge',
    'sparklineDisplay',
    'sparkMin',
    'sparkMax',
    'sparkAuto',
    'goodColor',
    'badColor',
    'invertTrend',
    'textColor',
    'background',
    'backgroundColor',
    'subheader',
    'unit',
    'unitPosition',
    'precision',
    'numberPrecision',
    'showDelta',
    'deltaMode',
    'trendDisplay',
    'showSparkline',
    'sparkStroke',
    'sparklineStrokeColor',
    'sparkStrokeWidth',
    'showSparklineAreaGraph',
    'sparklineAreaColor',
    'sparklineNullValueDisplay',
    'sparklineHighlightDots',
    'sparklineHighlightSegments',
    'annotationField',
    'showAnnotationHover',
    'showAnnotationLabels',
    'showTarget',
    'target',
    'showThresholdBand',
    'thresholdMin',
    'thresholdMax',
    'showHover',
    'showSparklineTooltip',
    'showHoverAnnotation',
    'tooltipPrefix',
    'majorLabel',
    'deltaLabel',
    'badgeText',
    'underLabel',
    'underLabelColor',
    'underLabelFontSize',
    'majorColor',
    'majorFontSize',
    'majorValueField',
    'shouldAbbreviateMajorValue',
    'shouldAbbreviateTrendValue',
    'shouldUseThousandSeparators',
    'trendColor',
    'trendFontSize',
    'sparkPointLabels',
    'showPointLabels',
    'emptyText',
    'splitByLayout',
    'trellisSplitBy',
    'trellisBackgroundColor',
    'trellisColumns',
    'trellisMinColumnWidth',
    'trellisPageCount',
    'trellisRowHeight',
    'trellisSortBy',
    'trellisSortOrder',
];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function readSourceFiles(directory) {
    const files = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    entries.forEach((entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...readSourceFiles(fullPath));
            return;
        }
        if (entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    });
    return files;
}

function main() {
    assert(fs.existsSync(builtJs), `missing built visualization: ${builtJs}`);
    assert(fs.existsSync(configJson), `missing config.json: ${configJson}`);

    const previewPng = path.join(studioRoot, 'dist', visualizationId, 'preview.png');
    assert(fs.existsSync(previewPng), `missing preview.png: ${previewPng}`);

    const bundleSource = fs.readFileSync(builtJs, 'utf8');
    assert(bundleSource.indexOf('addDataSourcesListener') !== -1, 'bundle must register addDataSourcesListener');
    assert(bundleSource.indexOf('addOptionsListener') !== -1, 'bundle must register addOptionsListener');
    assert(bundleSource.indexOf('showSparklineAreaGraph') !== -1, 'bundle must support area graph option');
    assert(bundleSource.indexOf('splitByLayout') !== -1, 'bundle must support trellis splitByLayout');
    assert(bundleSource.indexOf('buildSparklineAreaPath') !== -1, 'bundle must build sparkline area path');
    assert(bundleSource.indexOf('splunkstuff-sparkline-value-viz__hoverOverlay') !== -1, 'bundle must use HTML hover overlay');

    const config = JSON.parse(fs.readFileSync(configJson, 'utf8'));
    const schema = config.config && config.config.optionsSchema;
    assert(schema, 'config.json must define config.optionsSchema');

    requiredOptionKeys.forEach((optionKey) => {
        assert(schema[optionKey], `config.optionsSchema missing key: ${optionKey}`);
    });

    const sourceFiles = readSourceFiles(sourceDir);
    assert(sourceFiles.some((filePath) => fs.readFileSync(filePath, 'utf8').includes('resolveOptions')), 'src must define resolveOptions');

    const opaquePatterns = [/var NS\s*=/, /function sparkXY\s*\(/];
    opaquePatterns.forEach((pattern) => {
        sourceFiles.forEach((filePath) => {
            const sourceText = fs.readFileSync(filePath, 'utf8');
            assert(!pattern.test(sourceText), `opaque legacy pattern ${pattern} found in ${filePath}`);
        });
    });

    const vizConf = fs.readFileSync(
        path.join(splunkOneRoot, 'src/main/resources/splunk/default/visualizations.conf'),
        'utf8'
    );
    assert(
        vizConf.indexOf('[splunkstuff_kpi_sparkline_studio]') !== -1,
        'visualizations.conf must register splunkstuff_kpi_sparkline_studio'
    );
    assert(
        vizConf.indexOf('framework_type = studio_visualization') !== -1,
        'visualizations.conf must set framework_type = studio_visualization'
    );

    console.log('verify-studio-kpi-sparkline: ok');
    console.log(`  checked ${requiredOptionKeys.length} config options`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('verify-studio-kpi-sparkline: failed');
        console.error(error.message || error);
        process.exit(1);
    }
}

module.exports = { main, requiredOptionKeys };
