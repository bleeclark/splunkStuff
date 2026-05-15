/* eslint-disable */

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const VANILLA_VIZ_IDS = ['line_single_value', 'fixed_loaded_line_vanilla'];

/** Webpack writes these to src/.../static; pages copy can leave stage/ stale — sync after build. */
const REACT_VIZ_IDS = ['fixed_loaded_line', 'fixed_single_value_react'];

/**
 * Production webpack minifies copied AMD visualization.js in stage/.
 * Restore readable hand-maintained sources for stage/ (Splunk link target) and deliver/.
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

    VANILLA_VIZ_IDS.forEach((vizId) => {
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
        });
    });

    const sharedSrc = path.join(staticVizRoot, '_shared', 'splunkstuffTrendColors.js');
    if (fs.existsSync(sharedSrc)) {
        copyTargets.forEach((targetRoot) => {
            const destDir = path.join(targetRoot, '_shared');
            shell.mkdir('-p', destDir);
            fs.copyFileSync(
                sharedSrc,
                path.join(destDir, 'splunkstuffTrendColors.js')
            );
        });
    }
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

    VANILLA_VIZ_IDS.forEach((vizId) => {
        const src = path.join(staticVizRoot, vizId, 'visualization.js');
        if (!fs.existsSync(src)) {
            return;
        }
        fs.watch(src, schedule);
    });

    const sharedSrc = path.join(staticVizRoot, '_shared', 'splunkstuffTrendColors.js');
    if (fs.existsSync(sharedSrc)) {
        fs.watch(sharedSrc, schedule);
    }
}

function postBuildVizSync(pkgRoot) {
    syncReactVizBundlesToStage(pkgRoot);
    copyReadableVanillaViz(pkgRoot);
}

module.exports = {
    VANILLA_VIZ_IDS,
    REACT_VIZ_IDS,
    copyReadableVanillaViz,
    syncReactVizBundlesToStage,
    postBuildVizSync,
    watchReadableVanillaViz,
};
