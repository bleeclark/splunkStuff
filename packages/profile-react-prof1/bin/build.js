/* eslint-disable */

const shell = require('shelljs');
const path = require('path');
const webpack = require('webpack');
const OS = require('os').platform().toLocaleLowerCase();

const arg = process.argv[2];
const commands = ['build', 'link', 'watch'];

if (!arg || !commands.includes(arg)) {
    shell.echo(`Usage: node bin/build.js <${commands.join('|')}>`);
    shell.exit(1);
}

/** Splunk app id — change here + app.conf + templates when transferring. */
const appId = 'so_profile_prof1';

const webpackConfigJs = path.join(__dirname, '..', 'webpack.config.js');
const pkgRoot = path.join(__dirname, '..');

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
        shell.exec(`mklink /J "${target}" "${stageDir}"`);
    } else {
        shell.ln('-sf', stageDir, target);
    }
    shell.echo(`Linked ${target} -> ${stageDir}`);
}

async function main() {
    if (arg === 'build') {
        await runWebpackBuild();
        shell.echo(`Built ${appId} → stage/`);
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
