/* eslint-disable */

/**
 * Package so_BUI_pickulationts from stage/ into a Manage Apps–safe tarball.
 * COPYFILE_DISABLE avoids macOS AppleDouble (._*) sidecars that break installs.
 */
const path = require('path');
const shell = require('shelljs');

const pkgRoot = path.join(__dirname, '..');
const appId = 'so_BUI_pickulationts';
const stageDir = path.join(pkgRoot, 'stage');
const distDir = path.join(pkgRoot, 'dist');
const releasesDir = path.join(pkgRoot, 'releases');
const packageRoot = path.join(distDir, appId);
const archiveName = `${appId}.tgz`;
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
const stamped = path.join(releasesDir, `${appId}-visualizations-${stamp}.tgz`);
const latest = path.join(releasesDir, `${appId}-visualizations-latest.tgz`);
shell.cp(archivePath, stamped);
shell.cp(archivePath, latest);

shell.echo(`Packaged: ${archivePath}`);
shell.echo(`Release:  ${stamped}`);
shell.echo(`Latest:   ${latest}`);
shell.echo('');
shell.echo('Install on another Splunk (Windows or Mac):');
shell.echo(`  tar -xzf "${path.basename(latest)}" -C "%SPLUNK_HOME%/etc/apps"   # or $SPLUNK_HOME/etc/apps`);
shell.echo('  splunk restart');
shell.echo('');
shell.echo('Then in Search: Visualization → SplunkStuff - KPI loaded line / Data pie');
shell.echo('Format panels open with defaults (line Y Auto; pie Studio colors). No extra setup.');
