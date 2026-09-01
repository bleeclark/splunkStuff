import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    FILTER_OPTIONS,
    emptyProfileFeed,
    isValidProfileFeedShape,
    mapRowsToProfileFeed,
} from '../src/main/webapp/pages/profile/profileContract.js';
import {
    filtersToSplunkParams,
    substituteSplTokens,
} from '../src/main/webapp/pages/profile/filters/filtersToSplunkParams.js';

describe('PROF-1 live profile contract', () => {
    it('exposes All / Region A / Region B options', () => {
        assert.deepEqual(
            FILTER_OPTIONS.map((o) => o.value),
            ['all', 'region_a', 'region_b']
        );
    });

    it('maps live rows into feed shape', () => {
        const feed = mapRowsToProfileFeed(
            [{ title: 'A', value: '1', delta: '' }],
            [{ series: 'A', _time: '2024-06-01T00:00:00Z', value: 1 }]
        );
        assert.equal(isValidProfileFeedShape(feed), true);
    });

    it('empty feed is valid', () => {
        assert.equal(isValidProfileFeedShape(emptyProfileFeed()), true);
    });

    it('maps filter to SPL params', () => {
        assert.equal(filtersToSplunkParams('region_a').filter_region, 'region_a');
        assert.equal(
            substituteSplTokens('$filter_region$', { filter_region: 'region_b' }),
            'region_b'
        );
    });
});
