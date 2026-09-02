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
    line_single_value: ['bgdhampTrendColors.js'],
    fixed_loaded_line_vanilla: ['bgdhampTrendColors.js', 'bgdhampVizHoverMath.js'],
    splunkstuff_kpi_line: ['bgdhampTrendColors.js', 'bgdhampVizHoverMath.js'],
    refactor_viz_manual: ['bgdhampTrendColors.js', 'bgdhampVizHoverMath.js'],
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

const TRANSIENT_COPY_CODES = new Set(['EIO', 'EBUSY', 'EAGAIN', 'EMFILE', 'ENFILE']);

/**
 * copyFileSync with short retries — macOS/watchers sometimes throw transient EIO mid-sync
 * and would otherwise kill `yarn start`.
 */
function copyFileWithRetry(src, dest, attempts = 4) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            fs.copyFileSync(src, dest);
            return;
        } catch (err) {
            lastError = err;
            if (!err || !TRANSIENT_COPY_CODES.has(err.code) || attempt === attempts) {
                throw err;
            }
            const waitMs = attempt * 40;
            const end = Date.now() + waitMs;
            while (Date.now() < end) {
                /* busy-wait: sync path from webpack hooks */
            }
        }
    }
    throw lastError;
}

function tryCopyFile(src, dest, label) {
    try {
        copyFileWithRetry(src, dest);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
            `viz-sync: skip copy ${label || path.basename(src)} (${err.code || err.message})`
        );
    }
}

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
            tryCopyFile(sharedSrc, path.join(destDir, name), `${vizId}/${name}`);
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
            tryCopyFile(src, path.join(destDir, 'visualization.js'), `${vizId} -> ${deployRoot}`);
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
                tryCopyFile(src, path.join(destDir, asset), `${vizId}/${asset}`);
            });
            const embeddedShared = VIZ_SELF_CONTAINED_SHARED[vizId];
            if (embeddedShared) {
                embeddedShared.forEach((name) => {
                    const srcFile = path.join(staticVizRoot, vizId, name);
                    if (!fs.existsSync(srcFile)) {
                        return;
                    }
                    tryCopyFile(srcFile, path.join(destDir, name), `${vizId}/${name}`);
                });
            }
        });
    });

    const sharedFiles = ['bgdhampTrendColors.js', 'bgdhampVizHoverMath.js'];
    sharedFiles.forEach((name) => {
        const sharedSrc = path.join(staticVizRoot, '_shared', name);
        if (!fs.existsSync(sharedSrc)) {
            return;
        }
        copyTargets.forEach((targetRoot) => {
            const destDir = path.join(targetRoot, '_shared');
            shell.mkdir('-p', destDir);
            tryCopyFile(sharedSrc, path.join(destDir, name), `_shared/${name}`);
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

    const sharedFiles = ['bgdhampTrendColors.js', 'bgdhampVizHoverMath.js'];
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
    try {
        // eslint-disable-next-line global-require
        require('./sync-studio-kpi-sparkline').main();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('postBuildVizSync: sync-studio-kpi-sparkline skipped', err.message || err);
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
