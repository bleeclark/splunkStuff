#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, '..');
const publicRoot = path.join(pkgRoot, 'test/playwright/public');
const PORT = Number(process.env.PLAYWRIGHT_HARNESS_PORT || 4173);

spawnSync(process.execPath, [path.join(__dirname, 'build-hover-harness.js')], {
    cwd: pkgRoot,
    stdio: 'inherit',
});

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.map': 'application/json',
};

const server = http.createServer((req, res) => {
    try {
        const urlPath = (req.url && req.url.split('?')[0]) || '/';
        let rel = urlPath === '/' ? '/index.html' : urlPath;
        const safe = path.normalize(rel).replace(/^(\.\.[\/\\])+/, '');
        const filePath = path.join(publicRoot, safe);
        if (!filePath.startsWith(publicRoot)) {
            res.writeHead(403);
            res.end();
            return;
        }
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const body = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
        res.writeHead(200);
        res.end(body);
    } catch (_e) {
        res.writeHead(500);
        res.end('Error');
    }
});

server.listen(PORT, '127.0.0.1', () => {
    // stderr so Playwright / tooling can grep without cluttering artifact logs
    process.stderr.write(`serve-playwright-public: http://127.0.0.1:${PORT}\n`);
});
