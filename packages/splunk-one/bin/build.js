/* eslint-disable */

const shell = require('shelljs');
const path = require('path');
const webpack = require('webpack');
const OS = require('os').platform().toLocaleLowerCase();

const arg = process.argv[2];
const commands = ['build', 'link'];

if (!arg) {
    shell.echo(
        `No command received, please supply a command to run. \nCommands: ${commands.join(', ')}`
    );
    shell.exit(1);
}

if (!commands.includes(arg)) {
    shell.echo(`Please supply one of the following command to run: ${commands.join(', ')}`);
    shell.exit(1);
}

const appId = 'splunk-one';

const webpackConfigJs = path.join(__dirname, '..', 'webpack.config.js');

function runWebpackBuild() {
    const pkgRoot = path.join(__dirname, '..');
    process.chdir(pkgRoot);

    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configs = require(webpackConfigJs);
    const compiler = webpack(configs);

    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            // Always close the compiler so watchers / persistent hooks don't keep the process alive.
            // eslint-disable-next-line no-shadow
            compiler.close(() => {
                if (err) {
                    reject(err);
                    return;
                }

                const info = stats.toJson({ all: false, warnings: true, errors: true });
                if (stats.hasErrors()) {
                    reject(new Error(info.errors.map((e) => String(e)).join('\n')));
                    return;
                }

                // Print warnings (if any) but do not fail the build.
                if (stats.hasWarnings()) {
                    // eslint-disable-next-line no-console
                    console.warn(info.warnings.map((w) => String(w)).join('\n'));
                }

                resolve();
            });
        });
    });
}

// prettier-ignore
const runCommands = {
    win32: {
        build: () => {
            process.env.NODE_ENV = 'production';
            return runWebpackBuild();
        },
        link: () => shell.exec(`mklink /D "%SPLUNK_HOME%\\etc\\apps\\${appId}" "%cd%\\stage"`),
    },
    nix: {
        build: () => {
            process.env.NODE_ENV = 'production';
            return runWebpackBuild();
        },
        link: () => shell.exec(`ln -snf "$PWD/stage" "$SPLUNK_HOME/etc/apps/${appId}"`),
    },
};

try {
    const isWindows = OS === 'win32' || OS === 'win64';
    const os = isWindows ? 'win32' : 'nix';
    const result = runCommands[os][arg]();

    // `build` returns a Promise; `link` returns a shelljs result object.
    if (result && typeof result.then === 'function') {
        result
            .then(() => {
                shell.exit(0);
            })
            .catch((error) => {
                shell.echo(error);
                shell.exit(1);
            });
    } else {
        shell.exit(result && typeof result.code === 'number' ? result.code : 0);
    }
} catch (error) {
    shell.echo(error);
    shell.exit(1);
}
