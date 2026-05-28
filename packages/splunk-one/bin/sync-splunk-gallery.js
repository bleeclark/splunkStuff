#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Splunk loads local/data/ui/views before default/data/ui/views.
 * A stale local/custom_viz_gallery.xml overrides shipped gallery changes (old viz types, no row 5).
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
    if (src.indexOf('splunkstuff_kpi_sparkline') === -1) {
        throw new Error('gallery missing splunkstuff_kpi_sparkline viz');
    }
    if (src.indexOf('Showcase —') === -1) {
        throw new Error('gallery missing showcase row');
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
