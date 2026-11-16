/* eslint-disable */

const path = require('path');
const shell = require('shelljs');

const pkgRoot = path.join(__dirname, '..');
const appId = 'so_title_details';
const stageDir = path.join(pkgRoot, 'stage');
const distDir = path.join(pkgRoot, 'dist');
const releasesDir = path.join(pkgRoot, 'releases');
const packageRoot = path.join(distDir, appId);
const archiveName = `${appId}-title-details.tgz`;
const archivePath = path.join(distDir, archiveName);

if (!shell.test('-d', stageDir)) {
    shell.echo('Missing stage/. Run yarn build first.');
    shell.exit(1);
}

shell.rm('-rf', distDir);
shell.mkdir('-p', packageRoot);
shell.cp('-R', path.join(stageDir, '*'), packageRoot);

// macOS AppleDouble (._*) sidecars break Splunk Manage Apps:
// "archive contains more than one immediate subdirectory".
const result = shell.exec(`tar -czf "${archivePath}" -C "${distDir}" "${appId}"`, {
    silent: true,
    env: Object.assign({}, process.env, { COPYFILE_DISABLE: '1' }),
});
if (result.code !== 0) {
    shell.echo(result.stderr || result.stdout || 'Failed to create archive.');
    shell.exit(result.code);
}

const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 12);
shell.mkdir('-p', releasesDir);
const stamped = path.join(releasesDir, `${appId}-${stamp}.tgz`);
const latest = path.join(releasesDir, `${appId}-latest.tgz`);
shell.cp(archivePath, stamped);
shell.cp(archivePath, latest);

shell.echo(`Packaged: ${archivePath}`);
shell.echo(`Release:  ${stamped}`);
shell.echo(`Latest:   ${latest}`);
shell.echo('');
shell.echo('Install:');
shell.echo(`  tar -xzf "${latest}" -C "$SPLUNK_HOME/etc/apps"`);
shell.echo('  splunk restart');
