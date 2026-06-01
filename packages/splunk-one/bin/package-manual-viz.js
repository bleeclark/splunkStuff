/* eslint-disable */

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const pkgRoot = path.join(__dirname, '..');
const appId = 'so_BUI_pickulationts';
const vizId = process.argv[2];

if (!vizId) {
    shell.echo('Usage: yarn package:manual-viz <viz_id>');
    shell.echo('Example: yarn package:manual-viz simple_small_viz');
    shell.exit(1);
}

if (!/^[A-Za-z0-9_]+$/.test(vizId)) {
    shell.echo('Viz id can only contain letters, numbers, and underscores.');
    shell.exit(1);
}

const vizSourceDir = path.join(
    pkgRoot,
    'src/main/resources/splunk/appserver/static/visualizations',
    vizId
);
const requiredFiles = ['visualization.js', 'visualization.css', 'formatter.html'];

if (!shell.test('-d', vizSourceDir)) {
    shell.echo(`Missing viz folder: ${vizSourceDir}`);
    shell.exit(1);
}

requiredFiles.forEach((file) => {
    const filePath = path.join(vizSourceDir, file);
    if (!shell.test('-f', filePath)) {
        shell.echo(`Missing required file: ${filePath}`);
        shell.exit(1);
    }
});

const distDir = path.join(pkgRoot, 'dist');
const workDir = path.join(distDir, 'manual-viz-test');
const appRoot = path.join(workDir, appId);
const appVizDir = path.join(appRoot, 'appserver/static/visualizations', vizId);
const defaultDir = path.join(appRoot, 'default');
const viewsDir = path.join(defaultDir, 'data/ui/views');
const navDir = path.join(defaultDir, 'data/ui/nav');
const metadataDir = path.join(appRoot, 'metadata');
const archivePath = path.join(distDir, `${appId}-${vizId}-manual-test.tgz`);

function readSnippet() {
    const snippetPath = path.join(vizSourceDir, 'visualizations.conf.snippet');
    if (shell.test('-f', snippetPath)) {
        return fs.readFileSync(snippetPath, 'utf8')
            .split('\n')
            .filter((line) => !line.trim().startsWith('#'))
            .join('\n')
            .trim();
    }

    return [
        `[${vizId}]`,
        `label = ${vizId}`,
        'description = Manual custom visualization test package.',
        'default_height = 200',
        'search_fragment = | makeresults count=5 | streamstats count as value',
        'supports_drilldown = 0',
        'supports_trellis = 0',
    ].join('\n');
}

function writeFile(filePath, contents) {
    shell.mkdir('-p', path.dirname(filePath));
    fs.writeFileSync(filePath, contents);
}

shell.rm('-rf', workDir);
shell.mkdir('-p', appVizDir);
shell.cp('-R', path.join(vizSourceDir, '*'), appVizDir);
shell.mkdir('-p', defaultDir, viewsDir, navDir, metadataDir);

writeFile(path.join(defaultDir, 'app.conf'), [
    '[id]',
    `name = ${appId}`,
    'version = 0.1.0',
    '',
    '[ui]',
    'is_visible = 1',
    `label = Manual Viz Test - ${vizId}`,
    'supported_themes = light,dark',
    '',
    '[launcher]',
    'author = local',
    `description = Temporary Splunk app for testing ${vizId}`,
    'version = 0.1.0',
    '',
    '[package]',
    'check_for_updates = 0',
    `id = ${appId}`,
    '',
    '[install]',
    'is_configured = 1',
    'build = 1',
    '',
].join('\n'));

writeFile(path.join(defaultDir, 'visualizations.conf'), `${readSnippet()}\n`);

writeFile(path.join(metadataDir, 'default.meta'), [
    '[]',
    'access = read : [ * ], write : [ admin ]',
    'export = system',
    '',
].join('\n'));

writeFile(path.join(navDir, 'default.xml'), [
    '<nav search_view="search" color="#5CC05C">',
    '    <view name="manual_viz_test" default="true" />',
    '</nav>',
    '',
].join('\n'));

writeFile(path.join(viewsDir, 'manual_viz_test.xml'), [
    '<?xml version="1.0"?>',
    '<dashboard version="1.1">',
    `    <label>Manual viz test - ${vizId}</label>`,
    '    <row>',
    '        <panel>',
    `            <title>${vizId}</title>`,
    '            <search id="manual_viz_test_search">',
    '                <query>',
    '| makeresults count=5',
    '| streamstats count as value',
    '| eval _time = relative_time(now(), "-" . (5 - value) . "m@m")',
    '| fields _time value',
    '                </query>',
    '                <earliest>-15m</earliest>',
    '                <latest>now</latest>',
    '            </search>',
    `            <viz type="${appId}.${vizId}">`,
    '                <search base="manual_viz_test_search" />',
    '            </viz>',
    '            <table>',
    '                <title>Test data</title>',
    '                <search base="manual_viz_test_search" />',
    '                <option name="count">5</option>',
    '                <option name="drilldown">none</option>',
    '            </table>',
    '        </panel>',
    '    </row>',
    '</dashboard>',
    '',
].join('\n'));

const result = shell.exec(`tar -czf "${archivePath}" -C "${workDir}" "${appId}"`, { silent: true });
if (result.code !== 0) {
    shell.echo(result.stderr || result.stdout || 'Failed to create archive.');
    shell.exit(result.code);
}

shell.echo(`Packaged manual viz test app: ${archivePath}`);
shell.echo('');
shell.echo('On the other computer:');
shell.echo(`  tar -xzf "${path.basename(archivePath)}" -C "$SPLUNK_HOME/etc/apps"`);
shell.echo('  splunk restart');
shell.echo('');
shell.echo(`Then open app "${appId}" and the "Manual viz test - ${vizId}" dashboard.`);
