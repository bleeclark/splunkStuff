import { createDefaultFilters, resolveTimeRangePreset } from './filterCatalog.js';

/** @returns {import('./filterCatalog.js').AppliedFilters} */
export function parseFiltersFromUrl(searchParams) {
    const defaults = createDefaultFilters();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const timeRange = searchParams.get('timeRange');
    const earliest = searchParams.get('earliest');
    const latest = searchParams.get('latest');
    const bu = searchParams.get('bu');
    const domain = searchParams.get('domain');
    const entityType = searchParams.get('entityType');
    const entity = searchParams.get('entity');
    const entities = searchParams.get('entities');
    const severity = searchParams.get('severity');
    const entityFocus = searchParams.get('entityFocus');
    const dataMode = searchParams.get('data');
    const hideEmpty = searchParams.get('hideEmpty');
    const { dateRange: defaultDateRange } = defaults;

    let dateRange = defaultDateRange;
    if (timeRange === 'advanced') {
        dateRange = {
            ...defaultDateRange,
            from: from || defaultDateRange.from,
            to: to || defaultDateRange.to,
            earliest: earliest || defaultDateRange.earliest,
            latest: latest || defaultDateRange.latest,
            preset: 'advanced',
            label: 'Advanced',
            mode: 'advanced',
        };
    } else if (timeRange && timeRange !== 'custom') {
        dateRange = resolveTimeRangePreset(timeRange, new Date(), defaultDateRange);
    } else if (timeRange === 'custom' || from || to) {
        dateRange = resolveTimeRangePreset('custom', new Date(), {
            ...defaultDateRange,
            from: from || defaultDateRange.from,
            to: to || defaultDateRange.to,
        });
    }

    let entityIds = [];
    if (entities) {
        entityIds = entities.split(',').filter(Boolean);
    } else if (entity) {
        entityIds = [entity];
    }

    return {
        dateRange,
        businessUnit: bu && bu !== 'all' ? bu : null,
        domains: domain ? domain.split(',').filter(Boolean) : [],
        entityType: entityType && entityType !== 'all' ? entityType : null,
        entityIds,
        severities: severity ? severity.split(',').filter(Boolean) : defaults.severities,
        entityFocus: entityFocus || null,
        hideEmptyPanels: hideEmpty === '1',
        dataMode: dataMode === 'splunk' ? 'splunk' : 'mock',
    };
}

/** @param {import('./filterCatalog.js').AppliedFilters & { dataMode?: string }} filters */
export function serializeFiltersToUrl(filters) {
    const params = new URLSearchParams();

    params.set('from', filters.dateRange.from);
    params.set('to', filters.dateRange.to);
    if (filters.dateRange.preset) {
        params.set('timeRange', filters.dateRange.preset);
    }
    if (filters.dateRange.preset === 'advanced') {
        params.set('earliest', filters.dateRange.earliest || filters.dateRange.from);
        params.set('latest', filters.dateRange.latest || filters.dateRange.to);
    }

    if (filters.businessUnit) {
        params.set('bu', filters.businessUnit);
    }
    if (filters.domains.length) {
        params.set('domain', filters.domains.join(','));
    }
    if (filters.entityType) {
        params.set('entityType', filters.entityType);
    }
    if (filters.entityIds.length) {
        params.set('entities', filters.entityIds.join(','));
    }
    if (filters.severities.length) {
        params.set('severity', filters.severities.join(','));
    }
    if (filters.entityFocus) {
        params.set('entityFocus', filters.entityFocus);
    }
    if (filters.hideEmptyPanels) {
        params.set('hideEmpty', '1');
    }
    if (filters.dataMode === 'splunk') {
        params.set('data', 'splunk');
    }

    return params;
}

/** @param {import('./filterCatalog.js').AppliedFilters & { dataMode?: string }} filters */
export function syncFiltersToUrl(filters) {
    const params = serializeFiltersToUrl(filters);
    const qs = params.toString();
    const nextUrl = qs
        ? `${window.location.pathname}?${qs}`
        : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
}
