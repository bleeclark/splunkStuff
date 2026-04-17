/* eslint-disable */

const shell = require('shelljs');
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

// prettier-ignore
const runCommands = {
    win32: {
        build: () => shell.exec('set NODE_ENV=production&&.\\node_modules\\.bin\\webpack --mode=production'),
        link: () => shell.exec(`mklink /D "%SPLUNK_HOME%\\etc\\apps\\${appId}" "%cd%\\stage"`),
    },
    nix: {
        build: () => shell.exec('export NODE_ENV=production && ./node_modules/.bin/webpack --mode=production'),
        link: () => shell.exec(`ln -snf "$PWD/stage" "$SPLUNK_HOME/etc/apps/${appId}"`),
    },
};

try {
    const isWindows = OS === 'win32' || OS === 'win64';
    const os = isWindows ? 'win32' : 'nix';
    runCommands[os][arg]();
} catch (error) {
    shell.echo(error);
}
