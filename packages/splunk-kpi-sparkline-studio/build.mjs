/**
 * @file build.mjs
 * @description esbuild pipeline for the Dashboard Studio KPI sparkline extension.
 *   Bundles src/visualization.js (and lib imports) into dist/ as ESM visualization.js.
 *   minify: false preserves JSDoc/block comments in the runtime bundle for onboarding.
 *   Copies config.json and visualization.css alongside the JS artifact.
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const visualizationId = 'splunkstuff_kpi_sparkline_studio';
const sourceRoot = path.join(packageRoot, 'visualizations', visualizationId);
const sourceEntry = path.join(sourceRoot, 'src', 'visualization.js');
const outputDir = path.join(packageRoot, 'dist', visualizationId);

fs.mkdirSync(outputDir, { recursive: true });

await esbuild.build({
    entryPoints: [sourceEntry],
    bundle: true,
    format: 'esm',
    outfile: path.join(outputDir, 'visualization.js'),
    target: ['es2020'],
    sourcemap: false,
    minify: false,
});

fs.copyFileSync(path.join(sourceRoot, 'config.json'), path.join(outputDir, 'config.json'));
fs.copyFileSync(
    path.join(sourceRoot, 'src', 'visualization.css'),
    path.join(outputDir, 'visualization.css')
);

console.log('studio-kpi-sparkline build: ok');
console.log('  wrote', path.join(outputDir, 'visualization.js'));
