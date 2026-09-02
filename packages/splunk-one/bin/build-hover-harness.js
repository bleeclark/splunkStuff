#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const esbuild = require('esbuild');

const pkgRoot = path.join(__dirname, '..');
const publicDir = path.join(pkgRoot, 'test/playwright/public');
const indexHtmlPath = path.join(publicDir, 'index.html');

async function main() {
    fs.mkdirSync(publicDir, { recursive: true });

    await esbuild.build({
        entryPoints: [path.join(pkgRoot, 'test/harness/LineChartHoverHarness.jsx')],
        outfile: path.join(publicDir, 'bundle.js'),
        bundle: true,
        format: 'iife',
        platform: 'browser',
        jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"production"' },
        absWorkingDir: pkgRoot,
    });

    const indexHtml =
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BGDHamp LineChart hover harness</title>
</head>
<body>
  <div id="root"></div>
  <script src="./bundle.js"></script>
</body>
</html>
`;
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log('build-hover-harness: wrote', path.relative(pkgRoot, publicDir));
}

main().catch((err) => {
    console.error('build-hover-harness: failed', err);
    process.exit(1);
});
