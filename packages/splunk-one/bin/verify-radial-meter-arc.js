#!/usr/bin/env node
/* eslint-disable no-console */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pkgRoot = path.join(__dirname, '..');
const resourcesRadial = path.join(
    pkgRoot,
    'src/main/resources/splunk/appserver/static/visualizations/radial_meter'
);
const sharedArc = path.join(
    pkgRoot,
    'src/main/resources/splunk/appserver/static/visualizations/_shared/radialMeterArc.js'
);

const DEPLOY_PATHS = [
    resourcesRadial,
    path.join(pkgRoot, 'stage/appserver/static/visualizations/radial_meter'),
    path.join(pkgRoot, 'deliver/radial_meter'),
];

const SHOWCASE_DEPLOY_PATHS = [
    path.join(pkgRoot, 'src/main/resources/splunk/appserver/static/visualizations/radial_meter_showcase'),
    path.join(pkgRoot, 'stage/appserver/static/visualizations/radial_meter_showcase'),
    path.join(pkgRoot, 'deliver/radial_meter_showcase'),
];

const FORBIDDEN_PATTERNS = ['rotate(-90', "WIDTH / 2 + ',' + HEIGHT / 2 + ') rotate"];

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg || 'assertion failed');
    }
}

function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function loadAmdModule(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    var exported;
    function define(factory) {
        exported = typeof factory === 'function' ? factory() : undefined;
    }
    define.amd = true;
    vm.runInNewContext(code, { define, Math, isFinite, parseFloat });
    return exported;
}

function assertDeploySyncForRoots(roots, label) {
    const assets = ['visualization.js', 'radialMeterArc.js'];
    const existingRoots = roots.filter((p) => fs.existsSync(p));
    assert(existingRoots.length >= 1, label + ' resources directory missing');

    assets.forEach((asset) => {
        const hashes = [];
        existingRoots.forEach((root) => {
            const filePath = path.join(root, asset);
            if (!fs.existsSync(filePath)) {
                return;
            }
            hashes.push({ root, hash: sha256(filePath) });
        });

        assert(hashes.length >= 1, asset + ' missing from all deploy paths for ' + label);

        const first = hashes[0].hash;
        hashes.forEach((entry) => {
            assert(
                entry.hash === first,
                asset + ' out of sync: ' + entry.root + ' vs ' + hashes[0].root
            );
        });

        existingRoots.forEach((root) => {
            const filePath = path.join(root, asset);
            if (!fs.existsSync(filePath)) {
                throw new Error(asset + ' missing at ' + root + ' (run yarn build to sync stage/deliver)');
            }
        });
    });

    console.log('  deploy sync (' + label + '): ok (' + existingRoots.length + ' paths)');
}

function assertDeploySync() {
    assertDeploySyncForRoots(DEPLOY_PATHS, 'radial_meter');
    assertDeploySyncForRoots(SHOWCASE_DEPLOY_PATHS, 'radial_meter_showcase');
}

function assertNoForbiddenPatterns() {
    DEPLOY_PATHS.concat(SHOWCASE_DEPLOY_PATHS).forEach((root) => {
        if (!fs.existsSync(root)) {
            return;
        }
        const vizPath = path.join(root, 'visualization.js');
        if (!fs.existsSync(vizPath)) {
            return;
        }
        const content = fs.readFileSync(vizPath, 'utf8');
        FORBIDDEN_PATTERNS.forEach((pattern) => {
            assert(
                content.indexOf(pattern) === -1,
                'forbidden pattern "' + pattern + '" in ' + vizPath
            );
        });
        assert(
            content.indexOf("'./radialMeterArc'") !== -1,
            'visualization.js must require ./radialMeterArc at ' + vizPath
        );
    });
    console.log('  forbidden patterns: ok');
}

function writeSvg(filePath, paths, WIDTH, HEIGHT) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g transform="translate(${WIDTH / 2}, ${HEIGHT / 2})">
    <path d="${paths.track}" fill="#d3d3d3"/>
    <path d="${paths.fill}" fill="#f7bc38"/>
    <text text-anchor="middle" dominant-baseline="middle" fill="#f7bc38" x="0" y="20" font-size="40" font-weight="200" font-family="sans-serif">${paths.displayValue}</text>
  </g>
</svg>
`;
    fs.writeFileSync(filePath, svg, 'utf8');
}

async function main() {
    const mod = await import(path.join(pkgRoot, 'src/main/webapp/lib/radialMeterArc.mjs'));
    const {
        ARC_START,
        ARC_END,
        OUTER_R,
        WIDTH,
        HEIGHT,
        pointAt,
        valueToAngle,
        buildRadialMeterPaths,
    } = mod;

    const apex = pointAt(0, OUTER_R);
    const startPt = pointAt(ARC_START, OUTER_R);
    const endPt = pointAt(ARC_END, OUTER_R);
    assert(
        apex.y < startPt.y && apex.y < endPt.y,
        "apex at 12 o'clock should be highest (min y) on outer arc"
    );
    assert(
        startPt.y > apex.y && endPt.y > apex.y,
        'track endpoints should sit below apex (bottom opening between them)'
    );

    const fillEnd = valueToAngle(73, 100);
    const span = ARC_END - ARC_START;
    const fillSpan = fillEnd - ARC_START;
    assert(
        Math.abs(fillSpan / span - 0.73) < 0.01,
        'value 73 should map to ~73% of angular span'
    );

    const esmPaths = buildRadialMeterPaths(73, 100);
    assert(esmPaths.track && esmPaths.track.length > 0, 'track path non-empty');
    assert(esmPaths.fill && esmPaths.fill.length > 0, 'fill path non-empty');
    assert(
        esmPaths.valueEnd > esmPaths.trackStart + 1e-6 &&
            esmPaths.valueEnd < esmPaths.trackEnd - 1e-6,
        'fill arc should end between track start and full track end for value 73'
    );
    console.log('  ESM geometry: ok');

    const amdArcPath = path.join(resourcesRadial, 'radialMeterArc.js');
    assert(fs.existsSync(amdArcPath), 'radial_meter/radialMeterArc.js missing (sync from _shared)');
    const amdArc = loadAmdModule(amdArcPath);
    const amdPaths = amdArc.buildRadialMeterPaths(73, 100);
    assert(amdPaths.track === esmPaths.track, 'AMD track path must match ESM');
    assert(amdPaths.fill === esmPaths.fill, 'AMD fill path must match ESM');
    assert(amdPaths.displayValue === esmPaths.displayValue, 'AMD displayValue must match ESM');
    console.log('  AMD path parity: ok');

    assertDeploySync();
    assertNoForbiddenPatterns();

    const tmpDir = path.join(pkgRoot, 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    writeSvg(path.join(tmpDir, 'radial-meter-verify.svg'), esmPaths, WIDTH, HEIGHT);
    writeSvg(path.join(tmpDir, 'radial-meter-amd-verify.svg'), amdPaths, WIDTH, HEIGHT);

    console.log('verify-radial-meter: ok');
    console.log('  wrote', path.join(tmpDir, 'radial-meter-verify.svg'));
    console.log('  wrote', path.join(tmpDir, 'radial-meter-amd-verify.svg'));
}

main().catch((err) => {
    console.error('verify-radial-meter: failed', err.message || err);
    process.exit(1);
});
