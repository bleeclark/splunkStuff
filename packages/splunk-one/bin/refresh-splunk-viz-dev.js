#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Dev workflow: build → sync gallery → verify static assets → print Splunk refresh steps.
 *
 * Usage:
 *   node bin/refresh-splunk-viz-dev.js
 *   node bin/refresh-splunk-viz-dev.js --viz splunkstuff_kpi_sparkline
 *   SPLUNK_REFRESH_RESTART=1 node bin/refresh-splunk-viz-dev.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkgRoot = path.join(__dirname, '..');
const APP_ID = 'so_BUI_pickulationts';
const staticRoot = path.join(pkgRoot, 'src/main/resources/splunk/appserver/static/visualizations');
const stageRoot = path.join(pkgRoot, 'stage/appserver/static/visualizations');

function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseArgs() {
    const args = process.argv.slice(2);
    const out = { viz: null };
    for (let i = 0; i < args.length; i += 1) {
        if (args[i] === '--viz' && args[i + 1]) {
            out.viz = args[i + 1];
            i += 1;
        }
    }
    return out;
}

function resolveSplunkHome() {
    if (process.env.SPLUNK_HOME) {
        return process.env.SPLUNK_HOME;
    }
    if (process.platform === 'darwin' && fs.existsSync('/Applications/Splunk')) {
        return '/Applications/Splunk';
    }
    return null;
}

function splunkAppPath(splunkHome) {
    return path.join(splunkHome, 'etc/apps', APP_ID);
}

function isSymlinkToStage(appPath) {
    try {
        const target = fs.realpathSync(appPath);
        const stage = fs.realpathSync(path.join(pkgRoot, 'stage'));
        return target === stage;
    } catch (e) {
        return false;
    }
}

function checkFormatterSync(vizId) {
    const assets = ['formatter.html', 'visualization.js', 'visualization.css'];
    const rows = [];
    assets.forEach((asset) => {
        const src = path.join(staticRoot, vizId, asset);
        const stage = path.join(stageRoot, vizId, asset);
        if (!fs.existsSync(src)) {
            rows.push({ asset, status: 'missing-src' });
            return;
        }
        if (!fs.existsSync(stage)) {
            rows.push({ asset, status: 'missing-stage' });
            return;
        }
        const match = sha256(src) === sha256(stage);
        rows.push({ asset, status: match ? 'ok' : 'out-of-sync' });
    });
    return rows;
}

function listVanillaVizIds() {
    if (!fs.existsSync(staticRoot)) {
        return [];
    }
    return fs
        .readdirSync(staticRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
        .filter((d) => fs.existsSync(path.join(staticRoot, d.name, 'formatter.html')))
        .map((d) => d.name)
        .sort();
}

function run(cmd, opts) {
    execSync(cmd, { cwd: pkgRoot, stdio: 'inherit', ...opts });
}

function main() {
    const { viz } = parseArgs();
    const splunkHome = resolveSplunkHome();

    console.log('refresh-splunk-viz-dev: building…');
    run('yarn run build');

    console.log('\nrefresh-splunk-viz-dev: syncing gallery view…');
    run('node bin/sync-splunk-gallery.js');

    console.log('\nrefresh-splunk-viz-dev: syncing visualizations.conf…');
    run('node bin/sync-splunk-visualizations-conf.js');

    console.log('\nrefresh-splunk-viz-dev: verifying deploy…');
    run('node bin/verify-viz-deploy.js');

    const vizIds = viz
        ? [viz]
        : listVanillaVizIds().filter((id) =>
              fs.existsSync(path.join(stageRoot, id, 'formatter.html'))
          );
    const bad = [];
    vizIds.forEach((vizId) => {
        const rows = checkFormatterSync(vizId);
        const broken = rows.filter((r) => r.status !== 'ok');
        if (broken.length) {
            bad.push({ vizId, rows });
        }
    });

    console.log('\n--- Formatter / viz static files (src → stage) ---');
    if (viz) {
        checkFormatterSync(viz).forEach((r) => {
            console.log('  ' + viz + '/' + r.asset + ': ' + r.status);
        });
    } else {
        console.log('  All ' + vizIds.length + ' viz folders with formatter.html: in sync');
    }

    if (bad.length) {
        console.error('\nrefresh-splunk-viz-dev: out of sync after build:');
        bad.forEach((b) => {
            console.error('  ' + b.vizId + ': ' + b.rows.map((r) => r.asset + '=' + r.status).join(', '));
        });
        process.exit(1);
    }

    console.log('\n--- Splunk app link ---');
    if (!splunkHome) {
        console.log('  SPLUNK_HOME not set; skip link check.');
    } else {
        const appPath = splunkAppPath(splunkHome);
        if (!fs.existsSync(appPath)) {
            console.log('  App not installed at ' + appPath);
            console.log('  Run: yarn link:app   (from packages/splunk-one, with SPLUNK_HOME set)');
        } else if (isSymlinkToStage(appPath)) {
            console.log('  OK: ' + appPath + ' → stage/');
        } else {
            console.log('  WARN: ' + appPath + ' is not symlinked to this repo stage/.');
            console.log('  Splunk may be serving a different copy than yarn build.');
        }

        if (viz && fs.existsSync(path.join(appPath, 'appserver/static/visualizations', viz, 'formatter.html'))) {
            const stageFmt = path.join(stageRoot, viz, 'formatter.html');
            const splunkFmt = path.join(appPath, 'appserver/static/visualizations', viz, 'formatter.html');
            const same = sha256(stageFmt) === sha256(splunkFmt);
            console.log('  ' + viz + '/formatter.html on disk: ' + (same ? 'matches stage' : 'DIFFERS from stage'));
        }
    }

    console.log('\n--- In Splunk (required for formatter.html + visualization.js) ---');
    console.log('  1. Hard refresh the dashboard (Cmd+Shift+R) or private window.');
    console.log('  2. Open Format on the panel; Apply after changing fields.');
    console.log('     Saved panel options override formatter defaults — clear a field to hide it.');
    console.log('  3. If the format menu or viz still looks old:');
    console.log('       $SPLUNK_HOME/bin/splunk restart');
    console.log('  4. DevTools → Network: confirm formatter.html and visualization.js load from');
    console.log('       /static/app/' + APP_ID + '/visualizations/<vizId>/');
    console.log('  5. Gallery: /app/' + APP_ID + '/custom_viz_gallery');

    if (process.env.SPLUNK_REFRESH_RESTART === '1' && splunkHome) {
        const bin = path.join(splunkHome, 'bin/splunk');
        if (fs.existsSync(bin)) {
            console.log('\nrefresh-splunk-viz-dev: restarting Splunk (SPLUNK_REFRESH_RESTART=1)…');
            run('"' + bin + '" restart', { shell: true });
        }
    }

    console.log('\nrefresh-splunk-viz-dev: done');
}

try {
    main();
} catch (err) {
    console.error('refresh-splunk-viz-dev: failed', err.message || err);
    process.exit(1);
}
