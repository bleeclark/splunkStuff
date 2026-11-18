/* eslint-disable */

const fs = require('fs');
const shell = require('shelljs');
const path = require('path');
const webpack = require('webpack');
const OS = require('os').platform().toLowerCase();

const arg = process.argv[2];
const commands = ['build', 'link', 'watch'];

if (!arg || !commands.includes(arg)) {
    shell.echo(`Usage: node bin/build.js <${commands.join('|')}>`);
    shell.exit(1);
}

/** Splunk app id — change here + app.conf + templates when transferring. */
const appId = 'so_cyber_profile';

const webpackConfigJs = path.join(__dirname, '..', 'webpack.config.js');
const pkgRoot = path.join(__dirname, '..');
const splunkSrcRoot = path.join(pkgRoot, 'src/main/resources/splunk');
const appConfPath = path.join(splunkSrcRoot, 'default/app.conf');
const templatesDir = path.join(splunkSrcRoot, 'appserver/templates');

/**
 * Splunk cache-bust: bump app.conf build + every template page_asset_version
 * so ?v=... invalidates appserver/static page bundles after rebuild.
 */
function stampPageAssetVersion() {
    const stamp = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, '')
        .slice(0, 12);

    if (!fs.existsSync(appConfPath)) {
        throw new Error(`Missing app.conf at ${appConfPath}`);
    }
    const conf = fs.readFileSync(appConfPath, 'utf8');
    if (!/^\s*build\s*=\s*\S+/m.test(conf)) {
        throw new Error('app.conf must contain build = <version>');
    }
    fs.writeFileSync(appConfPath, conf.replace(/^\s*build\s*=\s*\S+/m, `build = ${stamp}`));

    if (!fs.existsSync(templatesDir)) {
        throw new Error(`Missing templates dir at ${templatesDir}`);
    }
    const templates = fs.readdirSync(templatesDir).filter((name) => name.endsWith('.html'));
    if (!templates.length) {
        throw new Error('No HTML templates found to stamp page_asset_version');
    }
    templates.forEach((name) => {
        const full = path.join(templatesDir, name);
        const tpl = fs.readFileSync(full, 'utf8');
        if (!/page_asset_version\s*=\s*"[^"]*"/.test(tpl)) {
            throw new Error(`${name}: missing page_asset_version assignment`);
        }
        fs.writeFileSync(
            full,
            tpl.replace(/page_asset_version\s*=\s*"[^"]*"/, `page_asset_version = "${stamp}"`)
        );
    });

    shell.echo(`Cache-bust stamp ${stamp} → app.conf + ${templates.length} templates`);
    return stamp;
}

function runWebpackBuild() {
    process.chdir(pkgRoot);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configs = require(webpackConfigJs);
    const compiler = webpack(configs);

    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            compiler.close(() => {
                if (err) {
                    reject(err);
                    return;
                }
                const info = stats.toJson({ all: false, warnings: true, errors: true });
                if (stats.hasErrors()) {
                    const msg = info.errors
                        .map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e)))
                        .join('\n');
                    reject(new Error(msg));
                    return;
                }
                if (stats.hasWarnings()) {
                    // eslint-disable-next-line no-console
                    console.warn(info.warnings.map((w) => String(w)).join('\n'));
                }
                resolve();
            });
        });
    });
}

function runWebpackWatch() {
    process.chdir(pkgRoot);
    // Stamp once at watch start (not every rebuild — avoids watch loops on templates).
    stampPageAssetVersion();
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configs = require(webpackConfigJs);
    const compiler = webpack(configs);
    // eslint-disable-next-line no-console
    console.log(`Watching ${appId}. Refresh Splunk after changes.`);
    compiler.watch({}, (err, stats) => {
        if (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            return;
        }
        if (stats.hasErrors()) {
            // eslint-disable-next-line no-console
            console.error(stats.toString({ colors: true }));
            return;
        }
        // eslint-disable-next-line no-console
        console.log(stats.toString({ colors: true, modules: false, chunks: false }));
    });
}

function linkApp() {
    const stageDir = path.join(pkgRoot, 'stage');
    if (!shell.test('-d', stageDir)) {
        shell.echo('Missing stage/. Run yarn build first.');
        shell.exit(1);
    }

    const splunkHome = process.env.SPLUNK_HOME;
    if (!splunkHome) {
        shell.echo('Set SPLUNK_HOME to link the app.');
        shell.exit(1);
    }

    const target = path.join(splunkHome, 'etc', 'apps', appId);
    shell.mkdir('-p', path.dirname(target));
    if (shell.test('-e', target) || shell.test('-L', target)) {
        shell.rm('-rf', target);
    }

    if (OS.startsWith('win')) {
        const result = shell.exec(`mklink /J "${target}" "${stageDir}"`);
        if (!result || result.code !== 0) {
            shell.echo(
                `Failed to link ${target} -> ${stageDir}` +
                    (result && result.stderr ? `: ${String(result.stderr).trim()}` : '')
            );
            shell.exit(result && typeof result.code === 'number' ? result.code : 1);
        }
    } else {
        const result = shell.ln('-sf', stageDir, target);
        if (result && typeof result.code === 'number' && result.code !== 0) {
            shell.echo(`Failed to link ${target} -> ${stageDir}`);
            shell.exit(result.code);
        }
        if (!shell.test('-e', target) && !shell.test('-L', target)) {
            shell.echo(`Failed to link ${target} -> ${stageDir}`);
            shell.exit(1);
        }
    }
    shell.echo(`Linked ${target} -> ${stageDir}`);
}

async function main() {
    if (arg === 'build') {
        const stamp = stampPageAssetVersion();
        await runWebpackBuild();
        shell.echo(`Built ${appId} → stage/ (page_asset_version=${stamp})`);
        return;
    }
    if (arg === 'watch') {
        runWebpackWatch();
        return;
    }
    if (arg === 'link') {
        linkApp();
    }
}

main().catch((err) => {
    shell.echo(String(err && err.stack ? err.stack : err));
    shell.exit(1);
});
