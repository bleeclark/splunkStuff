/**
 * Maps AppliedFilters to Splunk search tokens and REST job parameters.
 * Single serializer for panels, saved searches, and Classic XML tokens.
 *
 * MODULE: Bridge between React filter state and Splunk SPL token substitution,
 * REST job earliest/latest bounds, and cache key generation for panel queries.
 */

/**
 * WHAT: Converts AppliedFilters into Splunk token names and earliest/latest bounds.
 * WORKS WITH: AppliedFilters, substituteSplTokens, runSavedSearch, Classic XML $token$ placeholders.
 */
/** @param {import('./filterCatalog.js').AppliedFilters} filters */
export function filtersToSplunkParams(filters) {
    const { dateRange, businessUnit, domains, entityType, entityIds, severities } = filters;
    const earliest = dateRange.earliest || dateRange.from;
    const latest = dateRange.latest || dateRange.to;

    return {
        filter_earliest: earliest,
        filter_latest: latest,
        filter_bu: businessUnit || '*',
        filter_domain: domains.length ? domains.join(',') : '*',
        filter_entity_type: entityType || '*',
        filter_entity_ids: entityIds.length ? entityIds.join(',') : '*',
        filter_severity: severities.length ? severities.join(',') : '*',
        filter_entity_id: '*',
        earliest,
        latest,
    };
}

/**
 * WHAT: Replaces $token$ placeholders in an SPL template with param values.
 * WORKS WITH: filtersToSplunkParams, SEARCH_TEMPLATES, runSavedSearch, Splunk saved searches.
 */
export function substituteSplTokens(splTemplate, params) {
    let out = splTemplate;
    Object.entries(params).forEach(([key, value]) => {
        const token = `$${key}$`;
        out = out.split(token).join(String(value ?? ''));
    });
    return out;
}

/**
 * WHAT: Produces a stable JSON cache key from the current filter-derived Splunk params.
 * WORKS WITH: filtersToSplunkParams, panel data hooks, React Query key invalidation.
 */
/** @param {import('./filterCatalog.js').AppliedFilters} filters */
export function filtersToQueryKey(filters) {
    return JSON.stringify(filtersToSplunkParams(filters));
}
