import assert from 'node:assert/strict';
import test from 'node:test';

import {
    FILTER_OPTIONS,
    emptyProfileFeed,
    isValidProfileFeedShape,
    mapRowsToMetricFeeds,
    mapRowsToProfileFeed,
} from '../../src/main/webapp/pages/profile/profileContract.js';
import { filtersToSplunkParams, substituteSplTokens } from '../../src/main/webapp/pages/profile/filters/filtersToSplunkParams.js';

test('FILTER_OPTIONS covers all / region_a / region_b', () => {
    assert.deepEqual(
        FILTER_OPTIONS.map((o) => o.value),
        ['all', 'region_a', 'region_b']
    );
});

test('emptyProfileFeed is a valid empty shape', () => {
    const feed = emptyProfileFeed();
    assert.equal(isValidProfileFeedShape(feed), true);
    assert.equal(feed.cards.length, 0);
    assert.equal(feed.viz.length, 0);
});

test('mapRowsToProfileFeed builds cards + viz from live rows', () => {
    const feed = mapRowsToProfileFeed(
        [{ title: 'Active users', value: '12', delta: '+1%' }],
        [
            { series: 'Active users', _time: '2024-06-01T00:00:00Z', value: 10 },
            { series: 'Active users', _time: '2024-06-01T01:00:00Z', value: 12 },
        ]
    );
    assert.equal(isValidProfileFeedShape(feed), true);
    assert.equal(feed.cards[0].title, 'Active users');
    assert.equal(feed.viz[0].values.length, 2);
    assert.equal(feed.viz[0].subheader, 'Active users');
    assert.equal(feed.viz[0].title, 'Trend 1');
    assert.notEqual(feed.viz[0].title, feed.viz[0].subheader);
});

test('mapRowsToProfileFeed uses card_title when it differs from viz subheader', () => {
    const feed = mapRowsToProfileFeed(
        [],
        [
            {
                series: 'Revenue trend (USD)',
                card_title: 'Revenue',
                _time: '2024-06-01T00:00:00Z',
                value: 10,
            },
        ]
    );
    assert.equal(feed.viz[0].title, 'Revenue');
    assert.equal(feed.viz[0].subheader, 'Revenue trend (USD)');
});

test('mapRowsToMetricFeeds groups by title', () => {
    const metrics = mapRowsToMetricFeeds([
        { title: 'Throughput', _time: '2024-06-01T00:00:00Z', value: 5 },
        { title: 'Throughput', _time: '2024-06-01T01:00:00Z', value: 8 },
    ]);
    assert.equal(metrics.cards.length, 1);
    assert.equal(metrics.cards[0].feed.values.length, 2);
    assert.equal(metrics.cards[0].title, 'Throughput');
    assert.equal(metrics.cards[0].feed.subheader, 'Throughput trend');
});

test('filtersToSplunkParams maps region filter', () => {
    assert.equal(filtersToSplunkParams('all').filter_region, '*');
    assert.equal(filtersToSplunkParams('region_a').filter_region, 'region_a');
});

test('substituteSplTokens replaces $tokens$', () => {
    const out = substituteSplTokens('region=$filter_region$', { filter_region: 'region_b' });
    assert.equal(out, 'region=region_b');
});

test('getSplunkRestBase resolves locale splunkd proxy path', async () => {
    const { getSplunkRestBase } = await import(
        '../../src/main/webapp/pages/profile/data/profileSearchClient.js'
    );
    global.window = {
        location: { origin: 'http://127.0.0.1:8001', pathname: '/en-US/app/so_BUI_pickulationts/profile' },
        __splunkd_partials__: {
            '/services/session': { entry: [{ content: { lang: 'en-US' } }] },
        },
    };
    assert.equal(getSplunkRestBase(), 'http://127.0.0.1:8001/en-US/splunkd/__raw');
    delete global.window;
});

test('demo profile feeds are valid and differ by filter', async () => {
    const { getDemoProfileFeed, isProfileDemoMode } = await import(
        '../../src/main/webapp/pages/profile/data/profileDemoFeeds.js'
    );
    assert.equal(isProfileDemoMode(), false);
    const all = getDemoProfileFeed('all');
    const regionA = getDemoProfileFeed('region_a');
    assert.equal(isValidProfileFeedShape(all), true);
    assert.equal(all.cards[0].title, 'Total revenue');
    assert.notEqual(all.cards[0].title, regionA.cards[0].title);
    assert.notEqual(all.viz[0].subheader, regionA.viz[0].subheader);
    assert.equal(all.viz[0].title, 'Revenue');
    assert.equal(all.viz[0].subheader, 'Revenue trend (USD)');
    all.viz.forEach((panel) => {
        assert.notEqual(panel.title, panel.subheader);
    });
});
