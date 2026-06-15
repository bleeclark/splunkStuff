#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const splunkOneRoot = path.join(__dirname, '..');
const studioPackageRoot = path.join(splunkOneRoot, '..', 'splunk-kpi-sparkline-studio');
const visualizationId = 'splunkstuff_kpi_sparkline_studio';
const builtDir = path.join(studioPackageRoot, 'dist', visualizationId);

const copyTargets = [
    path.join(splunkOneRoot, 'deliver', visualizationId),
    path.join(splunkOneRoot, 'stage/appserver/static/visualizations', visualizationId),
];

function main() {
    const requiredFiles = ['visualization.js', 'visualization.css', 'config.json'];
    for (let fileIndex = 0; fileIndex < requiredFiles.length; fileIndex += 1) {
        const fileName = requiredFiles[fileIndex];
        const sourcePath = path.join(builtDir, fileName);
        if (!fs.existsSync(sourcePath)) {
            throw new Error(
                `missing studio build output ${sourcePath}; run: yarn workspace @splunk/kpi-sparkline-studio build`
            );
        }
    }

    copyTargets.forEach((targetDir) => {
        shell.mkdir('-p', targetDir);
        requiredFiles.forEach((fileName) => {
            fs.copyFileSync(path.join(builtDir, fileName), path.join(targetDir, fileName));
        });
    });

    console.log('sync-studio-kpi-sparkline: ok');
    copyTargets.forEach((targetDir) => {
        console.log('  updated', targetDir);
    });
}

if (require.main === module) {
    main();
}

module.exports = { main };
