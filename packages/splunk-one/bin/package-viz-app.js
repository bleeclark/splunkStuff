/* eslint-disable */

const path = require('path');
const shell = require('shelljs');

const pkgRoot = path.join(__dirname, '..');
const appId = 'so_BUI_pickulationts';
const stageDir = path.join(pkgRoot, 'stage');
const distDir = path.join(pkgRoot, 'dist');
const packageRoot = path.join(distDir, appId);
const archiveName = `${appId}-custom-viz-test.tgz`;
const archivePath = path.join(distDir, archiveName);

if (!shell.test('-d', stageDir)) {
    shell.echo('Missing stage/. Run yarn build first.');
    shell.exit(1);
}

shell.rm('-rf', distDir);
shell.mkdir('-p', packageRoot);
shell.cp('-R', path.join(stageDir, '*'), packageRoot);

const result = shell.exec(`tar -czf "${archivePath}" -C "${distDir}" "${appId}"`, { silent: true });
if (result.code !== 0) {
    shell.echo(result.stderr || result.stdout || 'Failed to create archive.');
    shell.exit(result.code);
}

shell.echo(`Packaged Splunk app: ${archivePath}`);
shell.echo('');
shell.echo('To install on another Splunk instance:');
shell.echo(`  mkdir -p "$SPLUNK_HOME/etc/apps/${appId}"`);
shell.echo(`  tar -xzf "${archivePath}" -C "$SPLUNK_HOME/etc/apps"`);
shell.echo('  splunk restart');
