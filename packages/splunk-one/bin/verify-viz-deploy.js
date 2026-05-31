#!/usr/bin/env node
/* eslint-disable no-console */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const staticRoot = path.join(pkgRoot, 'src/main/resources/splunk/appserver/static/visualizations');

const REACT_VIZ_IDS = [
    'fixed_loaded_line',
    'fixed_single_value_react',
    'simple_small_viz_react',
    'splunkstuff_pie_chart_react',
    'splunkstuff_kpi_sparkline_react',
    'radial_meter_react',
    'radial_meter_react_advanced',
];

const VIZ_IDS = [
    'splunkstuff_pie_chart',
    'splunkstuff_pie_showcase',
    'splunkstuff_sparkline_value',
    'splunkstuff_kpi_sparkline',
    'splunkstuff_kpi_sparkline_react_remade',
    'splunkstuff_sparkline_showcase',
    'radial_meter',
    'radial_meter_showcase',
];

const EXTRA_ASSETS = {
    radial_meter: ['radialMeterArc.js'],
    radial_meter_showcase: ['radialMeterArc.js'],
};

const TARGET_ROOTS = [
    path.join(staticRoot),
    path.join(pkgRoot, 'stage/appserver/static/visualizations'),
    path.join(pkgRoot, 'deliver'),
];

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg || 'assertion failed');
    }
}

function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assetsFor(vizId) {
    const base = ['visualization.js', 'visualization.css', 'formatter.html'];
    const extra = EXTRA_ASSETS[vizId] || [];
    return base.concat(extra);
}

function verifyVizFolder(vizId, assets) {
    const hashesByAsset = {};

    assets.forEach((asset) => {
        const srcPath = path.join(staticRoot, vizId, asset);
        assert(fs.existsSync(srcPath), asset + ' missing in resources for ' + vizId);
        hashesByAsset[asset] = sha256(srcPath);
    });

    TARGET_ROOTS.forEach((root) => {
        if (!fs.existsSync(root)) {
            return;
        }
        const destDir = path.join(root, vizId);
        if (!fs.existsSync(destDir)) {
            throw new Error(vizId + ' missing at ' + destDir + ' (run yarn build)');
        }
        assets.forEach((asset) => {
            const destPath = path.join(destDir, asset);
            assert(fs.existsSync(destPath), asset + ' missing at ' + destPath);
            const h = sha256(destPath);
            assert(
                h === hashesByAsset[asset],
                asset + ' out of sync for ' + vizId + ' at ' + destDir
            );
        });
    });
}

function main() {
    VIZ_IDS.forEach((vizId) => {
        verifyVizFolder(vizId, assetsFor(vizId));
    });

    REACT_VIZ_IDS.forEach((vizId) => {
        verifyVizFolder(vizId, ['visualization.js']);
    });

    console.log(
        'verify-viz-deploy: ok (' +
            VIZ_IDS.length +
            ' vanilla viz folders, ' +
            REACT_VIZ_IDS.length +
            ' react bundles, 3 deploy roots)'
    );
}

try {
    main();
} catch (err) {
    console.error('verify-viz-deploy: failed', err.message || err);
    process.exit(1);
}
