import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createDefaultFilters,
    setFilterValue,
    filtersAreValid,
    FILTER_IDS,
} from '../../src/main/webapp/pages/risk/filters/filterCatalog.js';
import { filtersToSplunkParams } from '../../src/main/webapp/pages/risk/filters/filtersToSplunkParams.js';
import { parseFiltersFromUrl, serializeFiltersToUrl } from '../../src/main/webapp/pages/risk/filters/filterUrlSync.js';
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

test('URL round-trip', () => {
    const filters = createDefaultFilters();
    filters.businessUnit = 'engineering';
    filters.domains = ['cloud'];
    const params = serializeFiltersToUrl(filters);
    const parsed = parseFiltersFromUrl(params);
    assert.equal(parsed.businessUnit, 'engineering');
    assert.deepEqual(parsed.domains, ['cloud']);
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
