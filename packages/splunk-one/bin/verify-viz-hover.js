#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('path');

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg || 'assertion failed');
    }
}

async function main() {
    const mod = await import(
        path.join(__dirname, '../src/main/webapp/lib/splunkstuffVizHoverMath.mjs')
    );
    const { hitTestPointInRect, seriesIndexFromClientX, clamp } = mod;

    assert(clamp(5, 0, 10) === 5, 'clamp middle');
    assert(clamp(-1, 0, 10) === 0, 'clamp low');
    assert(clamp(99, 0, 10) === 10, 'clamp high');

    const r = { left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 };
    assert(hitTestPointInRect(100, 50, r), 'inside rect');
    assert(!hitTestPointInRect(201, 50, r), 'past right');
    assert(!hitTestPointInRect(100, -1, r), 'above top');

    // Index: 5 points, modelWidth 400, pads 10+10 → inner 380, xStep 95
    const mapRect = { left: 0, width: 400 };
    assert(
        seriesIndexFromClientX(10 + 0 * 95, mapRect, 400, 10, 10, 5) === 0,
        'index 0 at first sample x'
    );
    assert(
        seriesIndexFromClientX(10 + 4 * 95, mapRect, 400, 10, 10, 5) === 4,
        'index 4 at last sample'
    );

    // Regression (vanilla AMD): chartWrap taller than svg — hover in gold band BELOW svg must still hit chartWrap,
    // but index mapping still uses svg’s screen rect horizontally (same width in practice).
    const svgRectScreen = {
        left: 0,
        top: 0,
        right: 400,
        bottom: 60,
        width: 400,
        height: 60,
    };
    const chartWrapScreen = {
        left: 0,
        top: 0,
        right: 400,
        bottom: 200,
        width: 400,
        height: 200,
    };
    const px = 200;
    const pyBelowSvg = 150;
    assert(
        hitTestPointInRect(px, pyBelowSvg, chartWrapScreen),
        'below svg but inside chartWrap must count as chart hover region'
    );
    assert(!hitTestPointInRect(px, pyBelowSvg, svgRectScreen), 'same point must not be inside svg-only hit box');

    // X mapping unchanged: still anchored to svg (or chart-area) coords
    const idxMid = seriesIndexFromClientX(
        svgRectScreen.left + svgRectScreen.width / 2,
        { left: svgRectScreen.left, width: svgRectScreen.width },
        400,
        10,
        10,
        20
    );
    assert(idxMid === 10, `mid-screen index for n=20: expected 10, got ${idxMid}`);

    console.log('verify-viz-hover: ok');
}

main().catch((err) => {
    console.error('verify-viz-hover: failed', err.message || err);
    process.exit(1);
});
