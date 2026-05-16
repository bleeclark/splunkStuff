/* eslint-disable */

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const VANILLA_VIZ_IDS = ['simple_small_viz', 'line_single_value', 'fixed_loaded_line_vanilla', 'splunkstuff_kpi_line', 'splunkstuff_kpi_line_verbose', 'refactor_viz_manual'];

/**
 * Per-viz copies of _shared AMD modules (same folder as visualization.js — no ../_shared in define()).
 * Source of truth: visualizations/_shared/*.js — synced before each deliver/stage copy.
 */
const VIZ_SELF_CONTAINED_SHARED = {
    line_single_value: ['splunkstuffTrendColors.js'],
    fixed_single_value: ['splunkstuffTrendColors.js'],
    fixed_loaded_line_vanilla: ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'],
    splunkstuff_kpi_line: ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'],
    refactor_viz_manual: ['splunkstuffTrendColors.js', 'splunkstuffVizHoverMath.js'],
};

/** Webpack writes these to src/.../static; pages copy can leave stage/ stale — sync after build. */
const REACT_VIZ_IDS = ['fixed_loaded_line', 'fixed_single_value_react'];

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
 * Restore readable React-built AMD visualization.js into stage/ when Webpack emitted minified output.
 */
function syncReactVizBundlesToStage(pkgRoot) {
    const root = pkgRoot || path.join(__dirname, '..');
    const staticVizRoot = path.join(
        root,
        'src/main/resources/splunk/appserver/static/visualizations'
    );
    const stageVizRoot = path.join(root, 'stage/appserver/static/visualizations');

    REACT_VIZ_IDS.forEach((vizId) => {
        const src = path.join(staticVizRoot, vizId, 'visualization.js');
        if (!fs.existsSync(src)) {
            return;
        }
        const destDir = path.join(stageVizRoot, vizId);
        shell.mkdir('-p', destDir);
        fs.copyFileSync(src, path.join(destDir, 'visualization.js'));
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

    const vanillaAssets = ['visualization.js', 'visualization.css'];
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

function postBuildVizSync(pkgRoot) {
    syncReactVizBundlesToStage(pkgRoot);
    syncSelfContainedSharedModules(pkgRoot);
    copyReadableVanillaViz(pkgRoot);
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
