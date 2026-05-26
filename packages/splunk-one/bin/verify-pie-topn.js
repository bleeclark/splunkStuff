#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg || 'assertion failed');
    }
}

function applyTopN(slices, topN, otherLabel) {
    const sorted = slices.slice().sort((a, b) => b.value - a.value);
    const limit = parseInt(topN, 10);
    if (!Number.isFinite(limit) || limit <= 0 || sorted.length <= limit) {
        return sorted;
    }
    const keep = sorted.slice(0, limit);
    const rest = sorted.slice(limit);
    let otherSum = 0;
    rest.forEach((s) => {
        otherSum += s.value;
    });
    if (otherSum > 0) {
        keep.push({ label: String(otherLabel || 'Other'), value: otherSum });
    }
    return keep;
}

function galleryPieSlices() {
    const slices = [];
    const letters = 'ABCDEFGHIJKLMN';
    for (let i = 0; i < letters.length; i += 1) {
        slices.push({ label: letters[i], value: (i + 1) * 10 });
    }
    return slices;
}

function main() {
    const src = galleryPieSlices();
    const out = applyTopN(src, 5, 'Other');
    assert(out.length === 6, 'Top 5 + Other should yield 6 slices');

    const labels = out.map((s) => s.label);
    assert(labels.indexOf('N') !== -1 && labels.indexOf('M') !== -1, 'top slices include N and M');
    assert(labels.indexOf('Other') !== -1, 'must include Other bucket');

    const other = out.find((s) => s.label === 'Other');
    assert(other && other.value === 450, 'Other sum should be 450 for gallery demo data');

    const total = out.reduce((sum, s) => sum + s.value, 0);
    assert(total === 1050, 'total of all original slices is 1050');

    const nSlice = out.find((s) => s.label === 'N');
    assert(nSlice && nSlice.value === 140, 'N should be largest slice');

    const pct = (other.value / total) * 100;
    assert(Math.abs(pct - 42.857) < 0.1, 'Other percent ~42.9%');

    const tmpDir = path.join(pkgRoot, 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    const summaryPath = path.join(tmpDir, 'pie-topn-verify.json');
    fs.writeFileSync(
        summaryPath,
        JSON.stringify({ slices: out, total, otherPercent: pct }, null, 2),
        'utf8'
    );

    const pieShowcase = fs.readFileSync(
        path.join(
            pkgRoot,
            'src/main/resources/splunk/appserver/static/visualizations/splunkstuff_pie_showcase/visualization.js'
        ),
        'utf8'
    );
    assert(pieShowcase.indexOf('SHOWCASE_DEFAULTS') !== -1, 'pie showcase must define SHOWCASE_DEFAULTS');

    console.log('verify-pie-topn: ok');
    console.log('  wrote', summaryPath);
}

try {
    main();
} catch (err) {
    console.error('verify-pie-topn: failed', err.message || err);
    process.exit(1);
}
