#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Splunk loads local/data/ui/views before default/data/ui/views.
 * A stale local/custom_viz_gallery.xml overrides shipped gallery changes.
 * Run after build, or set SYNC_SPLUNK_GALLERY_KEEP_LOCAL=1 to skip removal.
 */

const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const srcGallery = path.join(
    pkgRoot,
    'src/main/resources/splunk/default/data/ui/views/custom_viz_gallery.xml'
);
const stageDefault = path.join(pkgRoot, 'stage/default/data/ui/views/custom_viz_gallery.xml');
const stageLocal = path.join(pkgRoot, 'stage/local/data/ui/views/custom_viz_gallery.xml');

function main() {
    if (!fs.existsSync(srcGallery)) {
        throw new Error('missing source gallery: ' + srcGallery);
    }

    fs.mkdirSync(path.dirname(stageDefault), { recursive: true });
    fs.copyFileSync(srcGallery, stageDefault);

    const keepLocal = process.env.SYNC_SPLUNK_GALLERY_KEEP_LOCAL === '1';
    if (fs.existsSync(stageLocal)) {
        if (keepLocal) {
            console.log('sync-splunk-gallery: kept local override', stageLocal);
        } else {
            fs.unlinkSync(stageLocal);
            console.log('sync-splunk-gallery: removed stale local override', stageLocal);
            console.log('  (Splunk uses default/data/ui/views from stage/ now)');
        }
    } else {
        console.log('sync-splunk-gallery: no local override present');
    }

    const src = fs.readFileSync(stageDefault, 'utf8');
    const requiredVizIds = [
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
        'radial_meter',
        'radial_meter_react',
        'radial_meter_react_advanced',
    ];

    const missing = requiredVizIds.filter((vizId) => src.indexOf(`.${vizId}`) === -1);
    if (missing.length) {
        throw new Error('gallery missing canonical viz ids: ' + missing.join(', '));
    }
    if (src.indexOf('Showcase') !== -1 || src.indexOf('refactor_viz_manual') !== -1) {
        throw new Error('gallery still contains repetitive showcase/manual entries');
    }

    console.log('sync-splunk-gallery: ok');
    console.log('  updated', stageDefault);
}

try {
    main();
} catch (err) {
    console.error('sync-splunk-gallery: failed', err.message || err);
    process.exit(1);
}
