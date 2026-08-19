#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pkgRoot = path.join(__dirname, '..');

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg || 'assertion failed');
    }
}

function parseSparkPointLabels(raw) {
    const map = {};
    const s = String(raw == null ? '' : raw).trim();
    if (!s) {
        return map;
    }
    const parts = s.split(/[,;]+/);
    parts.forEach((p) => {
        const trimmed = p.trim();
        if (!trimmed) {
            return;
        }
        const colon = trimmed.indexOf(':');
        if (colon < 0) {
            return;
        }
        const idx = parseInt(trimmed.slice(0, colon), 10);
        const label = trimmed.slice(colon + 1).trim();
        if (Number.isFinite(idx) && idx >= 0 && label) {
            map[idx] = label;
        }
    });
    return map;
}

function loadKpiSparklineViz() {
    const filePath = path.join(
        pkgRoot,
        'src/main/resources/splunk/appserver/static/visualizations/splunkstuff_kpi_sparkline/visualization.js'
    );
    const src = fs.readFileSync(filePath, 'utf8');
    assert(src.indexOf('DEMO_LABELS') !== -1, 'kpi sparkline must define DEMO_LABELS');
    assert(src.indexOf('data-bgdhamp-viz-build') !== -1, 'kpi sparkline must set data-bgdhamp-viz-build');
    assert(src.indexOf('inlineCaptionStyle') !== -1, 'kpi sparkline must use inlineCaptionStyle');
    assert(
        src.indexOf('splunkstuff_kpi_sparkline') !== -1,
        'kpi sparkline namespace missing'
    );
    assert(
        src.indexOf('bgdhamp-sparkline-value-viz__indicatorLabel') !== -1,
        'sparkline must render indicatorLabel class'
    );
    assert(src.indexOf('bgdhamp-sparkline-value-viz__badge') !== -1, 'sparkline must render badge class');
    assert(src.indexOf('function optLabel') !== -1, 'kpi sparkline must define optLabel');
    assert(
        src.indexOf("if (badgeText)") !== -1,
        'kpi sparkline must only render badge when badgeText is set'
    );
    assert(src.indexOf('appendIndicatorPair') !== -1, 'kpi sparkline must support indicator pair layout');
    assert(src.indexOf('stringFields') !== -1, 'kpi sparkline must extract stringFields in formatData');
    assert(src.indexOf('valueField') !== -1, 'kpi sparkline must support valueField');
    assert(src.indexOf('buildSeriesFromRaw') !== -1, 'kpi sparkline must soft-build series via buildSeriesFromRaw');
    assert(
        src.indexOf('Sparkline value needs a numeric column') === -1,
        'kpi sparkline must not throw Single Value–incompatible VisualizationError'
    );
    assert(src.indexOf('headlineLayout') !== -1, 'kpi sparkline must support headlineLayout');
    assert(src.indexOf('showAnnotationHover') !== -1, 'kpi sparkline must support annotation hover');
    assert(src.indexOf('subheaderStyle') !== -1, 'kpi sparkline must support subheaderStyle');
    assert(src.indexOf('applySubheaderStyle') !== -1, 'kpi sparkline must apply subheader styles');
    assert(src.indexOf('getBoundingClientRect') !== -1, 'kpi sparkline must measure spark via layout rect');
    assert(src.indexOf('sparkAreaPath') !== -1, 'kpi sparkline must draw area fill under the spark line');
    assert(src.indexOf('showSparkArea') !== -1, 'kpi sparkline must support showSparkArea');
    assert(src.indexOf('sparkHeight') !== -1, 'kpi sparkline must support sparkHeight');
    assert(src.indexOf('sparkAreaColor') !== -1, 'kpi sparkline must support sparkAreaColor');
    assert(src.indexOf('vizHeight') !== -1, 'kpi sparkline must support vizHeight');
    assert(src.indexOf('applyVizHeight') !== -1, 'kpi sparkline must apply vizHeight to the host panel');
    assert(
        src.indexOf('bgdhamp-sparkline-value-viz__hoverOverlay') !== -1,
        'kpi sparkline must use HTML hover overlay'
    );
    return filePath;
}

function buildFixtureHtml() {
    const values = [];
    for (let n = 1; n <= 20; n += 1) {
        values.push(28 + ((n * 13) % 52));
    }
    const last = values[values.length - 1];
    const prev = values[values.length - 2];
    const delta = last - prev;
    const labels = parseSparkPointLabels('0:Oldest,9:Mid,19:Latest');
    const bg = '#DFA611';
    const textColor = '#FFFFFF';

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Sparkline showcase fixture</title>
<style>
body{font-family:sans-serif;margin:16px;background:#f5f5f5}
.fixture{width:360px;height:280px;background:${bg};color:${textColor};position:relative;
font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;display:flex;flex-direction:column}
.badge{position:absolute;top:8px;right:10px;padding:5px 12px;background:rgba(0,0,0,.55);
border:1px solid rgba(255,255,255,.25);border-radius:4px;font-size:12px;font-weight:700}
.body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:56px}
.lbl{font-size:13px;font-weight:700;background:rgba(0,0,0,.28);padding:2px 8px;border-radius:3px}
.majorVal{font-size:32px;font-weight:600;margin-top:2px}
.trendVal{font-size:16px;font-weight:600;margin-top:2px}
.spark{position:absolute;left:10px;right:10px;bottom:8px;height:40px;border-top:1px dashed rgba(255,255,255,.35)}
</style></head><body>
<div class="fixture" id="fixture">
  <div class="badge">Demo KPI</div>
  <div class="body">
    <div><div class="lbl">Current:</div><div class="majorVal">${last}</div></div>
    <div style="margin-top:8px"><div class="lbl">Change:</div><div class="trendVal">▼${delta}</div></div>
    <div class="spark">sparkline + labels: ${labels[0]}, ${labels[9]}, ${labels[19]}</div>
  </div>
</div>
<p>Reference layout for Splunk <code>splunkstuff_sparkline_value</code> / <code>_showcase</code> gallery panels.</p>
</body></html>`;
}

function main() {
    loadKpiSparklineViz();

    const baseCss = fs.readFileSync(
        path.join(
            pkgRoot,
            'src/main/resources/splunk/appserver/static/visualizations/splunkstuff_sparkline_value/visualization.css'
        ),
        'utf8'
    );
    assert(baseCss.indexOf('flex-direction: column') !== -1, 'sparkline CSS must stack labels');

    const labels = parseSparkPointLabels('0:Oldest,9:Mid,19:Latest');
    assert(labels[0] === 'Oldest', 'point label index 0');
    assert(labels[9] === 'Mid', 'point label index 9');
    assert(labels[19] === 'Latest', 'point label index 19');

    const tmpDir = path.join(pkgRoot, 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    const htmlPath = path.join(tmpDir, 'sparkline-showcase-fixture.html');
    fs.writeFileSync(htmlPath, buildFixtureHtml(), 'utf8');

    console.log('verify-sparkline-features: ok');
    console.log('  wrote', htmlPath);
}

try {
    main();
} catch (err) {
    console.error('verify-sparkline-features: failed', err.message || err);
    process.exit(1);
}
