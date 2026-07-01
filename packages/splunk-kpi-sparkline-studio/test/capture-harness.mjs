/**
 * @file capture-harness.mjs
 * @description Serves the harness and saves a verification screenshot.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const harnessDir = path.join(testRoot, 'harness');
const outputDir = path.join(testRoot, 'output');
const port = Number(process.env.STUDIO_KPI_HARNESS_PORT || 4175);
const screenshotPath = path.join(outputDir, 'studio-kpi-harness.png');

function serveHarness() {
    return new Promise((resolve, reject) => {
        const server = http.createServer((request, response) => {
            const requestPath = request.url === '/' ? '/index.patched.html' : request.url.split('?')[0];
            const filePath = path.join(harnessDir, requestPath.replace(/^\//, ''));
            if (!filePath.startsWith(harnessDir)) {
                response.writeHead(403);
                response.end('Forbidden');
                return;
            }
            fs.readFile(filePath, (error, data) => {
                if (error) {
                    response.writeHead(404);
                    response.end('Not found');
                    return;
                }
                const extension = path.extname(filePath);
                const contentType =
                    extension === '.html'
                        ? 'text/html; charset=utf-8'
                        : extension === '.js'
                          ? 'text/javascript; charset=utf-8'
                          : extension === '.css'
                            ? 'text/css; charset=utf-8'
                            : 'application/octet-stream';
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(data);
            });
        });
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server));
    });
}

async function captureWithPlaywright() {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const playwrightTestPath = path.join(testRoot, '..', '..', 'splunk-one', 'node_modules', '@playwright/test');
    const { chromium } = require(playwrightTestPath);

    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
        await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-harness-ready="true"]', { timeout: 15000 });
        await page.waitForTimeout(300);
        await page.screenshot({ path: screenshotPath, fullPage: true });
    } finally {
        await browser.close();
    }
}

async function main() {
    const server = await serveHarness();
    try {
        await captureWithPlaywright();
        console.log('studio-kpi harness capture: ok');
        console.log('  screenshot', screenshotPath);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

main().catch((error) => {
    console.error('studio-kpi harness capture: failed');
    console.error(error);
    process.exit(1);
});
