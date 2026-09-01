/**
 * Profile UI contract + filter options (no fixture / mock datasets).
 * Live Splunk rows are mapped into this shape by useProfileData.
 */

export const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'region_a', label: 'Region A' },
    { value: 'region_b', label: 'Region B' },
];

/** Empty feed used while loading or when a search returns nothing usable. */
export function emptyProfileFeed() {
    return { cards: [], viz: [] };
}

/**
 * @param {unknown} feedObj
 * @returns {boolean}
 */
export function isValidProfileFeedShape(feedObj) {
    if (!feedObj || typeof feedObj !== 'object') return false;
    if (!Array.isArray(feedObj.cards) || !Array.isArray(feedObj.viz)) return false;
    return feedObj.viz.every(
        (v) =>
            v &&
            typeof v.subheader === 'string' &&
            Array.isArray(v.values) &&
            Array.isArray(v.times) &&
            v.values.length === v.times.length
    );
}

/**
 * Map Splunk result rows → Profile feed shape.
 * Expected card rows: title, value, delta
 * Expected viz rows: series (or subheader), _time, count (or value)
 *
 * @param {Array<Record<string, unknown>>} cardRows
 * @param {Array<Record<string, unknown>>} vizRows
 * @returns {{ cards: Array, viz: Array }}
 */
export function mapRowsToProfileFeed(cardRows = [], vizRows = []) {
    const cards = (Array.isArray(cardRows) ? cardRows : []).map((row) => ({
        title: String(row.title ?? row.name ?? '—'),
        value: String(row.value ?? row.count ?? '—'),
        delta: String(row.delta ?? row.change ?? ''),
    }));

    const bySeries = new Map();
    (Array.isArray(vizRows) ? vizRows : []).forEach((row) => {
        const key = String(row.series ?? row.subheader ?? row.title ?? 'Series');
        if (!bySeries.has(key)) {
            bySeries.set(key, { subheader: key, tooltipText: key, values: [], times: [] });
        }
        const series = bySeries.get(key);
        const rawT = row._time ?? row.time;
        const rawV = row.value ?? row.count;
        const t =
            typeof rawT === 'number'
                ? new Date(rawT > 1e12 ? rawT : rawT * 1000).toISOString()
                : String(rawT ?? '');
        const v = Number(rawV);
        series.times.push(t);
        series.values.push(Number.isFinite(v) ? v : 0);
    });

    return {
        cards,
        viz: Array.from(bySeries.values()),
    };
}

/**
 * Metric tab: map rows into { cards: [{ title, feed, chart? }] }.
 * Expected: title, series, _time, value/count; optional unit=ms → chart flag.
 *
 * @param {Array<Record<string, unknown>>} rows
 */
export function mapRowsToMetricFeeds(rows = []) {
    const byTitle = new Map();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
        const title = String(row.title ?? row.series ?? 'Metric');
        if (!byTitle.has(title)) {
            byTitle.set(title, {
                title,
                chart: String(row.unit || '').toLowerCase() === 'ms',
                feed: {
                    subheader: title,
                    tooltipText: title,
                    values: [],
                    times: [],
                },
            });
        }
        const item = byTitle.get(title);
        const rawT = row._time ?? row.time;
        const rawV = row.value ?? row.count;
        const t =
            typeof rawT === 'number'
                ? new Date(rawT > 1e12 ? rawT : rawT * 1000).toISOString()
                : String(rawT ?? '');
        const v = Number(rawV);
        item.feed.times.push(t);
        item.feed.values.push(Number.isFinite(v) ? v : 0);
    });
    return { cards: Array.from(byTitle.values()) };
}
