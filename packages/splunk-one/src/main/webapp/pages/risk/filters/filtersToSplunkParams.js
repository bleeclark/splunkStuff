/**
 * Maps AppliedFilters to Splunk search tokens and REST job parameters.
 * Single serializer for panels, saved searches, and Classic XML tokens.
 */

/** @param {import('./filterCatalog.js').AppliedFilters} filters */
export function filtersToSplunkParams(filters) {
    const { dateRange, businessUnit, domains, entityType, entityIds, severities, entityFocus } =
        filters;
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
        filter_entity_id: entityFocus || '*',
        earliest,
        latest,
    };
}

/** Substitute $token$ placeholders in SPL template strings. */
export function substituteSplTokens(splTemplate, params) {
    let out = splTemplate;
    Object.entries(params).forEach(([key, value]) => {
        const token = `$${key}$`;
        out = out.split(token).join(String(value ?? ''));
    });
    return out;
}

/** @param {import('./filterCatalog.js').AppliedFilters} filters */
export function filtersToQueryKey(filters) {
    return JSON.stringify(filtersToSplunkParams(filters));
}
