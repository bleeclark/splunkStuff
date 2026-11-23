/**
 * Profile UI contract + filter options (no fixture / mock datasets).
 * Live Splunk rows are mapped into this shape by useProfileData.
 */

export const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'region_a', label: 'Region A' },
    { value: 'region_b', label: 'Region B' },
];

/** Empty cards-and-viz feed used while a search is loading or returns nothing. Works with useProfileData. */
export function emptyProfileFeed() {
    return { cards: [], viz: [] };
}

/** Checks that a profile feed has cards and viz series with matching times and values. Works with the profile unit tests. */
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

/** Reads one text-row cell (`text1`–`text3` and its link fields) from a Splunk result row. Works with toolsFromRow and VizTools. */
function textCellFromRow(row, slot) {
    const value = row[`text${slot}`];
    if (value == null || String(value).trim() === '') return null;
    return {
        label: String(row[`text${slot}_label`] ?? row[`text${slot}Label`] ?? `Text${slot}`),
        value: String(value).trim(),
        url: String(row[`text${slot}_link_url`] ?? row[`text${slot}LinkUrl`] ?? ''),
        urlFromField: String(row[`text${slot}_link_url_value`] ?? ''),
        search: String(row[`text${slot}_link_search`] ?? row[`text${slot}LinkSearch`] ?? ''),
    };
}

/** Turns text, link, and info fields on a Splunk row into the chart tools object. Works with mapRowsToProfileFeed and VizCard. */
function toolsFromRow(row) {
    const cells = [1, 2, 3].map((slot) => textCellFromRow(row, slot)).filter(Boolean);
    const infoText = String(row.info ?? row.info_text ?? '').trim();
    if (!cells.length && !infoText) return null;
    return {
        showTextRow: true,
        showInfo: Boolean(infoText),
        infoText,
        linkTarget: 'newTab',
        linkEarliest: String(row.link_earliest ?? ''),
        linkLatest: String(row.link_latest ?? ''),
        cells,
    };
}

/** Picks a card title that stays different from the series subheader. Works with mapRowsToProfileFeed. */
function distinctVizCardTitle(row, subheader, index) {
    const explicit = row.card_title ?? row.panel_title ?? row.panel;
    if (explicit != null && String(explicit).trim() !== '') {
        return String(explicit);
    }
    const maybe = row.title;
    if (maybe != null && String(maybe).trim() !== '' && String(maybe) !== subheader) {
        return String(maybe);
    }
    return `Trend ${index + 1}`;
}

/** Maps Splunk card rows (title, value, delta) and viz rows (series, _time, value) into the profile feed. Works with useProfileData and the profile tab. */
export function mapRowsToProfileFeed(cardRows = [], vizRows = []) {
    const cards = (Array.isArray(cardRows) ? cardRows : []).map((row) => ({
        title: String(row.title ?? row.name ?? '—'),
        value: String(row.value ?? row.count ?? '—'),
        delta: String(row.delta ?? row.change ?? ''),
    }));

    const bySeries = new Map();
    (Array.isArray(vizRows) ? vizRows : []).forEach((row) => {
        const key = String(row.series ?? row.subheader ?? 'Series');
        if (!bySeries.has(key)) {
            bySeries.set(key, {
                title: distinctVizCardTitle(row, key, bySeries.size),
                subheader: key,
                tooltipText: key,
                values: [],
                times: [],
            });
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
        const tools = toolsFromRow(row);
        if (tools) series.tools = tools;
    });

    return {
        cards,
        viz: Array.from(bySeries.values()),
    };
}

/** Maps Splunk metric rows (title, series, _time, value, optional unit) into Metric-tab cards. Works with useProfileData and StandardLineChart. */
export function mapRowsToMetricFeeds(rows = []) {
    const byTitle = new Map();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
        const title = String(row.title ?? row.panel ?? row.card_title ?? 'Metric');
        let subheader = String(row.series ?? row.subheader ?? '');
        if (!subheader || subheader === title) {
            subheader = `${title} trend`;
        }
        if (!byTitle.has(title)) {
            byTitle.set(title, {
                title,
                chart: String(row.unit || '').toLowerCase() === 'ms',
                feed: {
                    subheader,
                    tooltipText: subheader,
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
        const tools = toolsFromRow(row);
        if (tools) item.feed.tools = tools;
    });
    return { cards: Array.from(byTitle.values()) };
}
