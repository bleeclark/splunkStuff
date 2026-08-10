import assert from 'node:assert/strict';
import test from 'node:test';

import {
    FILTER_OPTIONS,
    getMetricFeeds,
    getProfileFeed,
    isValidProfileFeedShape,
    metricFeeds,
    profileFeeds,
} from '../../src/main/webapp/pages/profile/profileFeeds.js';

test('FILTER_OPTIONS covers all / region_a / region_b', () => {
    assert.deepEqual(
        FILTER_OPTIONS.map((o) => o.value),
        ['all', 'region_a', 'region_b']
    );
});

test('getProfileFeed returns filter-keyed feeds with UI contract shape', () => {
    for (const key of ['all', 'region_a', 'region_b']) {
        const feed = getProfileFeed(key);
        assert.equal(isValidProfileFeedShape(feed), true, key);
        assert.equal(feed.cards.length, 3);
        assert.equal(feed.viz.length, 3);
        assert.equal(feed, profileFeeds[key]);
    }
});

test('getProfileFeed falls back to all for unknown or empty keys', () => {
    assert.equal(getProfileFeed('unknown'), profileFeeds.all);
    assert.equal(getProfileFeed(undefined), profileFeeds.all);
    assert.equal(getProfileFeed(''), profileFeeds.all);
    assert.equal(getProfileFeed(null), profileFeeds.all);
});

test('region feeds differ from all (filter actually swaps values)', () => {
    const all = getProfileFeed('all');
    const a = getProfileFeed('region_a');
    const b = getProfileFeed('region_b');
    assert.notDeepEqual(a.viz[0].values, all.viz[0].values);
    assert.notDeepEqual(b.viz[0].values, all.viz[0].values);
    assert.notDeepEqual(a.cards[0].value, b.cards[0].value);
});

test('metric feeds are independent of profile filter keys', () => {
    const metrics = getMetricFeeds();
    assert.equal(metrics, metricFeeds);
    assert.ok(Array.isArray(metrics.cards));
    assert.equal(metrics.cards.length, 2);
    assert.ok(metrics.cards.every((c) => c.title && c.feed && Array.isArray(c.feed.values)));
    assert.notEqual(metrics, getProfileFeed('all'));
});

test('isValidProfileFeedShape rejects broken objects', () => {
    assert.equal(isValidProfileFeedShape(null), false);
    assert.equal(isValidProfileFeedShape({}), false);
    assert.equal(isValidProfileFeedShape({ cards: [], viz: [] }), false);
    assert.equal(
        isValidProfileFeedShape({
            cards: [{ title: 'x', value: '1', delta: '' }],
            viz: [{ subheader: 's', values: [1], times: [] }],
        }),
        false
    );
});
