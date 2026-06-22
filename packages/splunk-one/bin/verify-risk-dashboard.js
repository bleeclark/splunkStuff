#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Verifies risk dashboard page assets are present after build.
 */
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const stageRoot = path.join(pkgRoot, 'stage');

const required = [
    'appserver/static/pages/risk.js',
    'default/data/ui/views/risk.xml',
    'default/data/ui/views/risk_dashboard.xml',
    'appserver/templates/risk.html',
    'default/savedsearches.conf',
];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function main() {
    required.forEach((rel) => {
        const full = path.join(stageRoot, rel);
        assert(fs.existsSync(full), `Missing ${rel} — run yarn build`);
    });

    const conf = fs.readFileSync(
        path.join(stageRoot, 'default/savedsearches.conf'),
        'utf8'
    );
    assert(conf.includes('[risk_summary]'), 'savedsearches.conf missing [risk_summary]');
    assert(
        !/^\s*display\.visualizations\.custom/m.test(conf),
        'savedsearches.conf must not contain display.visualizations.custom keys (10.2+)'
    );

    const nav = fs.readFileSync(
        path.join(stageRoot, 'default/data/ui/nav/default.xml'),
        'utf8'
    );
    assert(nav.includes('name="risk"'), 'nav missing risk view');
    assert(nav.includes('name="risk_dashboard"'), 'nav missing risk_dashboard view');

    console.log('verify-risk-dashboard: ok');
}

main();
