// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('@playwright/test');
const path = require('path');

const pkgRoot = __dirname;

/** @see https://playwright.dev/docs/test-configuration */
module.exports = defineConfig({
    testDir: path.join(pkgRoot, 'test/playwright'),
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: [['list']],
    use: {
        baseURL: `http://127.0.0.1:${process.env.PLAYWRIGHT_HARNESS_PORT || 4173}`,
        trace: 'on-first-retry',
    },
    webServer: {
        command: `node "${path.join(pkgRoot, 'bin/serve-playwright-public.mjs')}"`,
        url: `http://127.0.0.1:${process.env.PLAYWRIGHT_HARNESS_PORT || 4173}/`,
        reuseExistingServer: !process.env.CI,
        cwd: pkgRoot,
        timeout: 120_000,
    },
});
