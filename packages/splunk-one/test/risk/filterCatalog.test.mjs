import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createDefaultFilters,
    setFilterValue,
    filtersAreValid,
    FILTER_IDS,
    resolveTimeRangePreset,
} from '../../src/main/webapp/pages/risk/filters/filterCatalog.js';
import { filtersToSplunkParams } from '../../src/main/webapp/pages/risk/filters/filtersToSplunkParams.js';
import { parseFiltersFromUrl } from '../../src/main/webapp/pages/risk/filters/filterUrlSync.js';
import { applyFiltersToFixtures } from '../../src/main/webapp/pages/risk/data/applyFiltersToFixtures.js';

test('F2 change clears F3-F5 descendants', () => {
    let filters = createDefaultFilters();
    filters = setFilterValue(filters, FILTER_IDS.BUSINESS_UNIT, 'finance');
    filters = setFilterValue(filters, FILTER_IDS.DOMAIN, ['identity']);
    filters = setFilterValue(filters, FILTER_IDS.ENTITY_TYPE, 'host');
    filters = setFilterValue(filters, FILTER_IDS.ENTITY, ['host-abc-01']);

    filters = setFilterValue(filters, FILTER_IDS.BUSINESS_UNIT, 'engineering');

    assert.equal(filters.domains.length, 0);
    assert.equal(filters.entityType, null);
    assert.equal(filters.entityIds.length, 0);
});

test('filtersToSplunkParams maps tokens', () => {
    const filters = createDefaultFilters();
    filters.businessUnit = 'finance';
    filters.domains = ['identity', 'network'];
    const params = filtersToSplunkParams(filters);
    assert.equal(params.filter_bu, 'finance');
    assert.equal(params.filter_domain, 'identity,network');
});

test('relative time range maps exact Splunk earliest latest tokens', () => {
    const filters = createDefaultFilters();
    filters.dateRange = resolveTimeRangePreset('last_24h');
    const params = filtersToSplunkParams(filters);
    assert.equal(params.earliest, '-24h');
    assert.equal(params.latest, 'now');
    assert.equal(params.filter_earliest, '-24h');
    assert.equal(params.filter_latest, 'now');
});

test('URL parsing only preserves runtime data mode', () => {
    const parsed = parseFiltersFromUrl(
        new URLSearchParams(
            'data=splunk&timeRange=realtime_5m&bu=engineering&domain=cloud&hideEmpty=1'
        )
    );
    const defaults = createDefaultFilters();

    assert.equal(parsed.dataMode, 'splunk');
    assert.equal(parsed.dateRange.preset, defaults.dateRange.preset);
    assert.equal(parsed.businessUnit, null);
    assert.deepEqual(parsed.domains, []);
    assert.equal(parsed.hideEmptyPanels, false);
});

test('applyFiltersToFixtures filters anomalies by severity', () => {
    const filters = createDefaultFilters();
    filters.severities = ['critical'];
    const result = applyFiltersToFixtures(filters);
    assert.ok(result.anomalies.every((a) => a.severity === 'critical'));
});

test('filtersAreValid rejects entity without type', () => {
    const filters = createDefaultFilters();
    filters.entityIds = ['host-abc-01'];
    filters.entityType = null;
    assert.equal(filtersAreValid(filters), false);
});
