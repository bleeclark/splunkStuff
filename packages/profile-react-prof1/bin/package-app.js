/* eslint-disable */

const path = require('path');
const shell = require('shelljs');

const pkgRoot = path.join(__dirname, '..');
const appId = 'so_profile_prof1';
const stageDir = path.join(pkgRoot, 'stage');
const distDir = path.join(pkgRoot, 'dist');
const packageRoot = path.join(distDir, appId);
const archiveName = `${appId}-prof1.tgz`;
const archivePath = path.join(distDir, archiveName);

if (!shell.test('-d', stageDir)) {
    shell.echo('Missing stage/. Run yarn build first.');
    shell.exit(1);
}

shell.rm('-rf', distDir);
shell.mkdir('-p', packageRoot);
shell.cp('-R', path.join(stageDir, '*'), packageRoot);

const result = shell.exec(`tar -czf "${archivePath}" -C "${distDir}" "${appId}"`, {
    silent: true,
});
if (result.code !== 0) {
    shell.echo(result.stderr || result.stdout || 'Failed to create archive.');
    shell.exit(result.code);
}

shell.echo(`Packaged: ${archivePath}`);
shell.echo('');
shell.echo('Install:');
shell.echo(`  tar -xzf "${archivePath}" -C "$SPLUNK_HOME/etc/apps"`);
shell.echo('  splunk restart');
