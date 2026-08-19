import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    FILTER_OPTIONS,
    getProfileFeed,
    isValidProfileFeedShape,
    profileFeeds,
} from '../src/main/webapp/pages/profile/profileFeeds.js';

describe('PROF-1 profileFeeds', () => {
    it('exposes All / Region A / Region B options', () => {
        assert.deepEqual(
            FILTER_OPTIONS.map((o) => o.value),
            ['all', 'region_a', 'region_b']
        );
    });

    it('returns a valid feed shape for each filter key', () => {
        for (const key of Object.keys(profileFeeds)) {
            const feed = getProfileFeed(key);
            assert.equal(isValidProfileFeedShape(feed), true, key);
            assert.ok(feed.cards.length >= 3, `${key} cards`);
            assert.ok(feed.viz.length >= 3, `${key} viz`);
        }
    });

    it('falls back to all for unknown keys', () => {
        assert.equal(getProfileFeed('missing'), profileFeeds.all);
        assert.equal(getProfileFeed(), profileFeeds.all);
    });

    it('swaps numeric content between regions', () => {
        const a = getProfileFeed('region_a');
        const b = getProfileFeed('region_b');
        assert.notEqual(a.cards[0].value, b.cards[0].value);
        assert.notDeepEqual(a.viz[0].values, b.viz[0].values);
    });
});
