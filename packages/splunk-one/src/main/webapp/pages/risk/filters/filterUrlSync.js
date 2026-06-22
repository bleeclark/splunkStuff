import { createDefaultFilters } from './filterCatalog.js';

/** @returns {import('./filterCatalog.js').AppliedFilters} */
export function parseFiltersFromUrl(searchParams) {
    const defaults = createDefaultFilters();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const bu = searchParams.get('bu');
    const domain = searchParams.get('domain');
    const entityType = searchParams.get('entityType');
    const entity = searchParams.get('entity');
    const entities = searchParams.get('entities');
    const severity = searchParams.get('severity');
    const entityFocus = searchParams.get('entityFocus');
    const dataMode = searchParams.get('data');

    return {
        dateRange: {
            ...defaults.dateRange,
            from: from || defaults.dateRange.from,
            to: to || defaults.dateRange.to,
        },
        businessUnit: bu && bu !== 'all' ? bu : null,
        domains: domain ? domain.split(',').filter(Boolean) : [],
        entityType: entityType && entityType !== 'all' ? entityType : null,
        entityIds: entities
            ? entities.split(',').filter(Boolean)
            : entity
              ? [entity]
              : [],
        severities: severity ? severity.split(',').filter(Boolean) : defaults.severities,
        entityFocus: entityFocus || null,
        dataMode: dataMode === 'splunk' ? 'splunk' : 'mock',
    };
}

/** @param {import('./filterCatalog.js').AppliedFilters & { dataMode?: string }} filters */
export function serializeFiltersToUrl(filters) {
    const params = new URLSearchParams();

    params.set('from', filters.dateRange.from);
    params.set('to', filters.dateRange.to);

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
