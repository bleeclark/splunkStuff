/** Turns the profile filter into SPL tokens and a 24-hour window. Works with runProfileSearch. */
export function filtersToSplunkParams(filterKey = 'all') {
    const region = filterKey && filterKey !== 'all' ? filterKey : '*';
    return {
        filter_region: region,
        earliest: '-24h',
        latest: 'now',
    };
}

/** Replaces `$token$` placeholders in an SPL template. Works with the profile search templates. */
export function substituteSplTokens(splTemplate, params) {
    let out = splTemplate;
    Object.entries(params).forEach(([key, value]) => {
        const token = `$${key}$`;
        out = out.split(token).join(String(value ?? ''));
    });
    return out;
}
