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
        path.join(__dirname, '../src/main/webapp/lib/bgdhampVizHoverMath.mjs')
    );
    const {
        hitTestPointInRect,
        seriesIndexFromClientX,
        seriesIndexFromPointerMeet,
        seriesIndexFromPointerNone,
        viewportToSvgUserXY,
        viewportToSvgUserXYNone,
        clampTooltipViewport,
        clamp,
    } = mod;

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

    // Letterboxing (default SVG meet): wide viewport 800×100, user 400×100 → scale 1, x-offset 200
    const wideRect = { left: 0, top: 0, width: 800, height: 100 };
    const mWide = viewportToSvgUserXY(400, 50, wideRect, 400, 100);
    assert(mWide && Math.abs(mWide.x - 200) < 1e-9 && Math.abs(mWide.y - 50) < 1e-9, 'horizontal letterbox');

    // Vertical letterbox: 400×200 viewport, user 400×100
    const tallRect = { left: 0, top: 0, width: 400, height: 200 };
    const mTall = viewportToSvgUserXY(200, 100, tallRect, 400, 100);
    assert(mTall && Math.abs(mTall.x - 200) < 1e-9 && Math.abs(mTall.y - 50) < 1e-9, 'vertical letterbox');

    // seriesIndexFromPointerMeet: center of wide rect → user x 200, n=5 pads 10 → idx 2
    const idxMeet = seriesIndexFromPointerMeet(400, 50, wideRect, 400, 100, 10, 10, 5);
    assert(idxMeet === 2, `meet index: expected 2, got ${idxMeet}`);

    assert(
        seriesIndexFromPointerMeet(0, 0, { left: 0, top: 0, width: 0, height: 100 }, 400, 100, 10, 10, 5) === null,
        'null when viewport has no width'
    );
    assert(seriesIndexFromPointerMeet(400, 50, wideRect, 400, 100, 10, 10, 1) === null, 'null when n < 2');

    // none stretch: wide 800×100 viewport, user 400×100 → center maps to user x 200
    const mNone = viewportToSvgUserXYNone(400, 50, wideRect, 400, 100);
    assert(mNone && Math.abs(mNone.x - 200) < 1e-9 && Math.abs(mNone.y - 50) < 1e-9, 'none stretch center');
    const idxNone = seriesIndexFromPointerNone(400, 50, wideRect, 400, 100, 10, 10, 5);
    assert(idxNone === 2, `none index: expected 2, got ${idxNone}`);

    const tip = clampTooltipViewport(5, 5, { innerWidth: 320, innerHeight: 568 });
    assert(tip.x >= 8 && tip.x <= 320 - 8, 'tooltip x clamped');
    assert(tip.y >= 8, 'tooltip y clamped from top');

    console.log('verify-viz-hover: ok');
}

main().catch((err) => {
    console.error('verify-viz-hover: failed', err.message || err);
    process.exit(1);
});
