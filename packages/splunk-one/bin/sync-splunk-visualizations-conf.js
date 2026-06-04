#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Ensure stage/default/visualizations.conf matches source after build.
 * Splunk only registers custom viz types listed in this file.
 */

const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const srcConf = path.join(pkgRoot, 'src/main/resources/splunk/default/visualizations.conf');
const stageConf = path.join(pkgRoot, 'stage/default/visualizations.conf');

/** Gallery + common dev viz stanzas that must exist in visualizations.conf */
const REQUIRED_STANZAS = [
    'simple_small_viz',
    'simple_small_viz_react',
    'fixed_single_value',
    'fixed_single_value_react',
    'fixed_loaded_line_vanilla',
    'fixed_loaded_line',
    'splunkstuff_pie_chart',
    'splunkstuff_pie_chart_react',
    'splunkstuff_kpi_sparkline',
    'splunkstuff_kpi_sparkline_react',
    'splunkstuff_kpi_sparkline_react_remade',
    'radial_meter',
    'radial_meter_react',
    'radial_meter_react_advanced',
];

function parseStanzas(confText) {
    const ids = [];
    confText.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\[([^\]]+)\]\s*$/);
        if (m) {
            ids.push(m[1]);
        }
    });
    return ids;
}

function main() {
    if (!fs.existsSync(srcConf)) {
        throw new Error('missing source visualizations.conf: ' + srcConf);
    }

    fs.mkdirSync(path.dirname(stageConf), { recursive: true });
    fs.copyFileSync(srcConf, stageConf);

    const text = fs.readFileSync(stageConf, 'utf8');
    const stanzas = parseStanzas(text);
    const missing = REQUIRED_STANZAS.filter((id) => stanzas.indexOf(id) === -1);
    if (missing.length) {
        throw new Error(
            'visualizations.conf missing required stanzas: ' + missing.join(', ')
        );
    }

    const stageVizRoot = path.join(pkgRoot, 'stage/appserver/static/visualizations');
    const missingJs = REQUIRED_STANZAS.filter((id) => {
        const js = path.join(stageVizRoot, id, 'visualization.js');
        return !fs.existsSync(js);
    });
    if (missingJs.length) {
        throw new Error(
            'missing visualization.js for: ' +
                missingJs.join(', ') +
                ' (run yarn build)'
        );
    }

    console.log('sync-splunk-visualizations-conf: ok');
    console.log('  updated', stageConf);
    console.log('  stanzas:', stanzas.length);
}

try {
    main();
} catch (err) {
    console.error('sync-splunk-visualizations-conf: failed', err.message || err);
    process.exit(1);
}
