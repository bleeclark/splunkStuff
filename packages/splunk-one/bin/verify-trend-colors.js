#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('path');

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg || 'assertion failed');
    }
}

async function main() {
    const mod = await import(
        path.join(__dirname, '../src/main/webapp/lib/splunkstuffTrendColors.js')
    );
    const {
        DEFAULT_UP_COLOR,
        DEFAULT_DOWN_COLOR,
        trendBackground,
        trendDelta,
    } = mod;

    assert(DEFAULT_UP_COLOR === '#01417F', 'DEFAULT_UP_COLOR');
    assert(DEFAULT_DOWN_COLOR === '#DFA611', 'DEFAULT_DOWN_COLOR');
    assert(
        trendBackground(0, DEFAULT_UP_COLOR, DEFAULT_DOWN_COLOR) === DEFAULT_UP_COLOR,
        'delta 0 → up color'
    );
    assert(
        trendBackground(-13, DEFAULT_UP_COLOR, DEFAULT_DOWN_COLOR) === DEFAULT_DOWN_COLOR,
        'delta -13 → down color'
    );
    assert(
        trendBackground(5, DEFAULT_UP_COLOR, DEFAULT_DOWN_COLOR) === DEFAULT_UP_COLOR,
        'delta 5 → up color'
    );
    assert(trendDelta([54, 41]) === -13, 'trendDelta last - prev');
    assert(Number.isNaN(trendDelta([])), 'empty → NaN');

    console.log('verify-trend-colors: ok');
}

main().catch((err) => {
    console.error('verify-trend-colors: failed', err.message || err);
    process.exit(1);
});
