/**
 * Profile filter → Splunk SPL / REST params (live only).
 */

export function filtersToSplunkParams(filterKey = 'all') {
    const region = filterKey && filterKey !== 'all' ? filterKey : '*';
    return {
        filter_region: region,
        earliest: '-24h',
        latest: 'now',
    };
}

export function substituteSplTokens(splTemplate, params) {
    let out = splTemplate;
    Object.entries(params).forEach(([key, value]) => {
        const token = `$${key}$`;
        out = out.split(token).join(String(value ?? ''));
    });
    return out;
}
