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
});

test('mapRowsToMetricFeeds groups by title', () => {
    const metrics = mapRowsToMetricFeeds([
        { title: 'Throughput', _time: '2024-06-01T00:00:00Z', value: 5 },
        { title: 'Throughput', _time: '2024-06-01T01:00:00Z', value: 8 },
    ]);
    assert.equal(metrics.cards.length, 1);
    assert.equal(metrics.cards[0].feed.values.length, 2);
});

test('filtersToSplunkParams maps region filter', () => {
    assert.equal(filtersToSplunkParams('all').filter_region, '*');
    assert.equal(filtersToSplunkParams('region_a').filter_region, 'region_a');
});

test('substituteSplTokens replaces $tokens$', () => {
    const out = substituteSplTokens('region=$filter_region$', { filter_region: 'region_b' });
    assert.equal(out, 'region=region_b');
});
