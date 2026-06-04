/* eslint-disable */

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const VANILLA_VIZ_IDS = [
    'simple_small_viz',
    'fixed_single_value',
    'line_single_value',
    'fixed_loaded_line_vanilla',
    'splunkstuff_kpi_line',
    'splunkstuff_kpi_line_verbose',
    'refactor_viz_manual',
    'splunkstuff_pie_chart',
    'splunkstuff_sparkline_value',
    'splunkstuff_kpi_sparkline',
    'splunkstuff_kpi_sparkline_react_remade',
    'splunkstuff_sparkline_showcase',
    'splunkstuff_pie_showcase',
    'radial_meter',
    'radial_meter_showcase',
];

/**
 * Per-viz copies of _shared AMD modules (same folder as visualization.js — no ../_shared in define()).
 * Source of truth: visualizations/_shared/*.js — synced before each deliver/stage copy.
 */
const VIZ_SELF_CONTAINED_SHARED = {
    line_single_value: ['splunkstuffTrendColors.js'],
    fixed_loaded_line_vanilla: ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'],
    splunkstuff_kpi_line: ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'],
    refactor_viz_manual: ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'],
    radial_meter: ['radialMeterArc.js'],
    radial_meter_showcase: ['radialMeterArc.js'],
};

/** Webpack writes these to src/.../static; pages copy can leave stage/ stale — sync after build. */
const REACT_VIZ_IDS = [
    'fixed_loaded_line',
    'fixed_single_value_react',
    'simple_small_viz_react',
    'splunkstuff_pie_chart_react',
    'splunkstuff_kpi_sparkline_react',
    'radial_meter_react',
    'radial_meter_react_advanced',
];

/**
 * Copy _shared AMD helpers into viz directories that use same-folder defines (portable deliver/).
 */
function syncSelfContainedSharedModules(pkgRoot) {
    const root = pkgRoot || path.join(__dirname, '..');
    const staticVizRoot = path.join(
        root,
        'src/main/resources/splunk/appserver/static/visualizations'
    );
    Object.keys(VIZ_SELF_CONTAINED_SHARED).forEach((vizId) => {
        const destDir = path.join(staticVizRoot, vizId);
        shell.mkdir('-p', destDir);
        VIZ_SELF_CONTAINED_SHARED[vizId].forEach((name) => {
            const sharedSrc = path.join(staticVizRoot, '_shared', name);
            if (!fs.existsSync(sharedSrc)) {
                return;
            }
            fs.copyFileSync(sharedSrc, path.join(destDir, name));
        });
    });
}

/**
 * Copy webpack-built visualization.js from resources/ into stage/ and deliver/
 * (pages copy + parallel webpack targets can leave deploy roots stale).
 */
function syncReactVizBundlesToStage(pkgRoot) {
    const root = pkgRoot || path.join(__dirname, '..');
    const staticVizRoot = path.join(
        root,
        'src/main/resources/splunk/appserver/static/visualizations'
    );
    const deployRoots = [
        path.join(root, 'stage/appserver/static/visualizations'),
        path.join(root, 'deliver'),
    ];

    REACT_VIZ_IDS.forEach((vizId) => {
        const src = path.join(staticVizRoot, vizId, 'visualization.js');
        if (!fs.existsSync(src)) {
            return;
        }
        deployRoots.forEach((deployRoot) => {
            const destDir = path.join(deployRoot, vizId);
            shell.mkdir('-p', destDir);
            fs.copyFileSync(src, path.join(destDir, 'visualization.js'));
        });
    });
}

/**
 * Copy hand-maintained vanilla AMD viz sources + per-viz splunkstuff*.js copies to deliver/ and stage/.
 */
function copyReadableVanillaViz(pkgRoot) {
    const root = pkgRoot || path.join(__dirname, '..');
    const staticVizRoot = path.join(
        root,
        'src/main/resources/splunk/appserver/static/visualizations'
    );
    const copyTargets = [
        path.join(root, 'deliver'),
        path.join(root, 'stage/appserver/static/visualizations'),
    ];

    const vanillaAssets = ['visualization.js', 'visualization.css', 'formatter.html'];
    const vizIdsForAssetCopy = Array.from(new Set([].concat(VANILLA_VIZ_IDS, Object.keys(VIZ_SELF_CONTAINED_SHARED))));

    vizIdsForAssetCopy.forEach((vizId) => {
        copyTargets.forEach((targetRoot) => {
            const destDir = path.join(targetRoot, vizId);
            shell.mkdir('-p', destDir);
            vanillaAssets.forEach((asset) => {
                const src = path.join(staticVizRoot, vizId, asset);
                if (!fs.existsSync(src)) {
                    return;
                }
                fs.copyFileSync(src, path.join(destDir, asset));
            });
            const embeddedShared = VIZ_SELF_CONTAINED_SHARED[vizId];
            if (embeddedShared) {
                embeddedShared.forEach((name) => {
                    const srcFile = path.join(staticVizRoot, vizId, name);
                    if (!fs.existsSync(srcFile)) {
                        return;
                    }
                    fs.copyFileSync(srcFile, path.join(destDir, name));
                });
            }
        });
    });

    const sharedFiles = ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'];
    sharedFiles.forEach((name) => {
        const sharedSrc = path.join(staticVizRoot, '_shared', name);
        if (!fs.existsSync(sharedSrc)) {
            return;
        }
        copyTargets.forEach((targetRoot) => {
            const destDir = path.join(targetRoot, '_shared');
            shell.mkdir('-p', destDir);
            fs.copyFileSync(sharedSrc, path.join(destDir, name));
        });
    });
}

/** Watch hand-edited vanilla viz sources (webpack watch does not see these files). */
function watchReadableVanillaViz(pkgRoot, onChange) {
    const root = pkgRoot || path.join(__dirname, '..');
    const staticVizRoot = path.join(
        root,
        'src/main/resources/splunk/appserver/static/visualizations'
    );
    let timer = null;

    const schedule = () => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = null;
            onChange();
        }, 100);
    };

    const vizIdsToWatch = Array.from(new Set([].concat(VANILLA_VIZ_IDS, Object.keys(VIZ_SELF_CONTAINED_SHARED))));
    vizIdsToWatch.forEach((vizId) => {
        const src = path.join(staticVizRoot, vizId, 'visualization.js');
        if (!fs.existsSync(src)) {
            return;
        }
        fs.watch(src, schedule);
    });

    const sharedFiles = ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'];
    sharedFiles.forEach((name) => {
        const sharedSrc = path.join(staticVizRoot, '_shared', name);
        if (fs.existsSync(sharedSrc)) {
            fs.watch(sharedSrc, schedule);
        }
    });
}

function syncSplunkGalleryView(pkgRoot) {
    // eslint-disable-next-line global-require
    require('./sync-splunk-gallery');
}

function syncSplunkVisualizationsConf(pkgRoot) {
    void pkgRoot;
    // eslint-disable-next-line global-require
    require('./sync-splunk-visualizations-conf');
}

function postBuildVizSync(pkgRoot) {
    syncReactVizBundlesToStage(pkgRoot);
    syncSelfContainedSharedModules(pkgRoot);
    copyReadableVanillaViz(pkgRoot);
    try {
        syncSplunkVisualizationsConf(pkgRoot);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('postBuildVizSync: sync-splunk-visualizations-conf skipped', err.message || err);
    }
    try {
        syncSplunkGalleryView(pkgRoot);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('postBuildVizSync: sync-splunk-gallery skipped', err.message || err);
    }
}

module.exports = {
    VANILLA_VIZ_IDS,
    REACT_VIZ_IDS,
    VIZ_SELF_CONTAINED_SHARED,
    copyReadableVanillaViz,
    syncSelfContainedSharedModules,
    syncReactVizBundlesToStage,
    postBuildVizSync,
    watchReadableVanillaViz,
};
