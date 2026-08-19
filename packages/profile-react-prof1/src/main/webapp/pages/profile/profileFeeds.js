/** Filter-keyed demo feeds for the Profile tab (All / Region A / Region B). */

const times = [
    '2024-06-01T00:00:00Z',
    '2024-06-01T01:00:00Z',
    '2024-06-01T02:00:00Z',
    '2024-06-01T03:00:00Z',
    '2024-06-01T04:00:00Z',
    '2024-06-01T05:00:00Z',
];

function feed(subheader, values, tooltipText) {
    return {
        subheader,
        tooltipText: tooltipText || subheader,
        values,
        times,
    };
}

export const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'region_a', label: 'Region A' },
    { value: 'region_b', label: 'Region B' },
];

export const profileFeeds = {
    all: {
        cards: [
            { title: 'Active users', value: '12,480', delta: '+4.2% vs prior' },
            { title: 'Sessions', value: '38,210', delta: '+1.8% vs prior' },
            { title: 'Error rate', value: '0.42%', delta: '-0.05 pts' },
        ],
        viz: [
            feed('Active users', [40, 45, 42, 50, 55, 62], 'Active users over time'),
            feed('Sessions', [20, 28, 30, 35, 40, 48], 'Sessions over time'),
            feed('Error rate', [8, 7, 6, 5, 4, 3], 'Error rate trend'),
        ],
    },
    region_a: {
        cards: [
            { title: 'Active users', value: '7,120', delta: '+2.1% vs prior' },
            { title: 'Sessions', value: '21,400', delta: '+0.9% vs prior' },
            { title: 'Error rate', value: '0.31%', delta: '-0.02 pts' },
        ],
        viz: [
            feed('Active users (A)', [22, 24, 26, 28, 30, 34], 'Region A active users'),
            feed('Sessions (A)', [12, 14, 15, 18, 20, 22], 'Region A sessions'),
            feed('Error rate (A)', [5, 5, 4, 4, 3, 3], 'Region A error rate'),
        ],
    },
    region_b: {
        cards: [
            { title: 'Active users', value: '5,360', delta: '+6.4% vs prior' },
            { title: 'Sessions', value: '16,810', delta: '+3.0% vs prior' },
            { title: 'Error rate', value: '0.58%', delta: '+0.04 pts' },
        ],
        viz: [
            feed('Active users (B)', [18, 20, 19, 22, 25, 28], 'Region B active users'),
            feed('Sessions (B)', [8, 10, 12, 14, 16, 18], 'Region B sessions'),
            feed('Error rate (B)', [9, 8, 8, 7, 6, 6], 'Region B error rate'),
        ],
    },
};

/** Metric tab demo feeds (independent of Profile filter). */
export const metricFeeds = {
    cards: [
        {
            title: 'Throughput',
            feed: feed('Throughput', [10, 23, 15, 30, 25, 50], 'Requests per interval'),
        },
        {
            title: 'Latency',
            feed: feed('Latency', [80, 80, 70, 90, 90, 65], 'Latency ms'),
            chart: true,
        },
    ],
};

/**
 * Resolve Profile-tab demo feed by filter key. Unknown keys fall back to `all`.
 * Pure helper for UI + unit tests.
 *
 * @param {string} [filterKey]
 * @returns {{ cards: Array, viz: Array }}
 */
export function getProfileFeed(filterKey) {
    if (filterKey && Object.prototype.hasOwnProperty.call(profileFeeds, filterKey)) {
        return profileFeeds[filterKey];
    }
    return profileFeeds.all;
}

/**
 * Metric-tab feeds (not keyed by Profile filter).
 * @returns {{ cards: Array }}
 */
export function getMetricFeeds() {
    return metricFeeds;
}

/**
 * Assert a feed object matches the Profile UI contract (§9).
 * @param {unknown} feedObj
 * @returns {boolean}
 */
export function isValidProfileFeedShape(feedObj) {
    if (!feedObj || typeof feedObj !== 'object') return false;
    if (!Array.isArray(feedObj.cards) || !Array.isArray(feedObj.viz)) return false;
    if (feedObj.cards.length < 1 || feedObj.viz.length < 1) return false;
    return feedObj.viz.every(
        (v) =>
            v &&
            typeof v.subheader === 'string' &&
            Array.isArray(v.values) &&
            Array.isArray(v.times) &&
            v.values.length === v.times.length
    );
}
