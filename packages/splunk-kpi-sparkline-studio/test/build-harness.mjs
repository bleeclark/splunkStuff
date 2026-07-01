/**
 * @file build-harness.mjs
 * @description Bundles the local Studio KPI harness for browser verification.
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const studioRoot = path.join(testRoot, '..');
const harnessDir = path.join(testRoot, 'harness');
const deliverCss = path.join(studioRoot, '..', 'splunk-one', 'deliver', 'splunkstuff_kpi_sparkline_studio', 'visualization.css');
const distCss = path.join(studioRoot, 'dist', 'splunkstuff_kpi_sparkline_studio', 'visualization.css');

fs.mkdirSync(harnessDir, { recursive: true });
fs.mkdirSync(path.join(testRoot, 'output'), { recursive: true });

await esbuild.build({
    entryPoints: [path.join(harnessDir, 'harness-entry.js')],
    bundle: true,
    format: 'esm',
    outfile: path.join(harnessDir, 'harness.bundle.js'),
    target: ['es2020'],
    sourcemap: false,
    minify: false,
});

const cssSource = fs.existsSync(deliverCss) ? deliverCss : distCss;
fs.copyFileSync(cssSource, path.join(harnessDir, 'visualization.css'));

const indexHtml = fs.readFileSync(path.join(harnessDir, 'index.html'), 'utf8');
const patchedHtml = indexHtml.replace(
    '../../deliver/splunkstuff_kpi_sparkline_studio/visualization.css',
    './visualization.css'
);
fs.writeFileSync(path.join(harnessDir, 'index.patched.html'), patchedHtml, 'utf8');

console.log('studio-kpi harness build: ok');
console.log('  wrote', path.join(harnessDir, 'harness.bundle.js'));
console.log('  wrote', path.join(harnessDir, 'visualization.css'));
console.log('  wrote', path.join(harnessDir, 'index.patched.html'));
