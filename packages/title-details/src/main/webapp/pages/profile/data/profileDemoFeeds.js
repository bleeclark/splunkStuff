/**
 * Demo-only fixtures for Profile. Enable with ?data=demo on the page URL.
 * Cards and viz use different content so KPI tiles vs chart panels are easy to compare.
 */

import { isValidProfileFeedShape } from '../profileContract.js';

/** True when the page URL has `?data=demo`. Works with useProfileData and the profile demo banner. */
export function isProfileDemoMode() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('data') === 'demo';
}

/** Builds an hourly time series that rises, falls, or waves. Works with demo chart and KPI feeds. */
function buildSeries(base, points, shape) {
    const times = [];
    const values = [];
    const now = Date.now();
    for (let i = 0; i < points; i += 1) {
        times.push(new Date(now - (points - 1 - i) * 3600000).toISOString());
        let v = base;
        if (shape === 'up') v = base + i * 2.4;
        else if (shape === 'down') v = base - i * 1.8;
        else if (shape === 'wave') v = base + Math.sin(i / 1.6) * 9;
        else v = base + (i % 3) - 1;
        values.push(Math.max(0, Math.round(v * 10) / 10));
    }
    return { times, values };
}

/** One demo viz series with times, values, and a title. Works with getDemoProfileFeed. */
function vizEntry(subheader, base, shape, title) {
    const { times, values } = buildSeries(base, 14, shape);
    return { title, subheader, tooltipText: subheader, times, values };
}

/** @type {Record<string, { cards: Array, viz: Array }>} */
const PROFILE_DEMO_BY_FILTER = {
    all: {
        cards: [
            { title: 'Total revenue', value: '$284K', delta: '+12.4% vs last week' },
            { title: 'Active users', value: '18,420', delta: '+3.1% daily average' },
            { title: 'Conversion rate', value: '4.8%', delta: '-0.2 pts vs target' },
        ],
        viz: [
            vizEntry(
                'Trailing 24-hour revenue trend in USD, including refunds, tax, and channel mix',
                220,
                'up',
                'Revenue'
            ),
            vizEntry('Hourly sessions', 920, 'wave', 'Sessions'),
            vizEntry('Churn risk index', 38, 'down', 'Churn risk'),
        ],
    },
    region_a: {
        cards: [
            { title: 'Region A revenue', value: '$112K', delta: '+18.2% QoQ' },
            { title: 'Region A accounts', value: '6,240', delta: '+410 new' },
            { title: 'Region A SLA', value: '99.2%', delta: 'Within target' },
        ],
        viz: [
            vizEntry('Region A — ticket volume', 140, 'up', 'Tickets'),
            vizEntry('Region A — latency (p95)', 62, 'down', 'Latency'),
            vizEntry('Region A — adoption curve', 48, 'wave', 'Adoption'),
        ],
    },
    region_b: {
        cards: [
            { title: 'Region B revenue', value: '$172K', delta: '+6.7% QoQ' },
            { title: 'Region B accounts', value: '12,180', delta: '+880 new' },
            { title: 'Region B SLA', value: '97.8%', delta: 'Below target' },
        ],
        viz: [
            vizEntry('Region B — ticket volume', 210, 'wave', 'Tickets'),
            vizEntry('Region B — latency (p95)', 88, 'up', 'Latency'),
            vizEntry('Region B — adoption curve', 72, 'flat', 'Adoption'),
        ],
    },
};

/** Builds the text-row and info tools object for a demo chart. Works with VizTools and getProfileStandardCharts. */
function chartTools(infoText, cells) {
    return {
        showTextRow: true,
        showInfo: Boolean(infoText),
        infoText: infoText || '',
        linkTarget: 'newTab',
        linkEarliest: '-24h',
        linkLatest: 'now',
        cells,
    };
}

const METRIC_DEMO = {
    cards: [
        {
            title: 'API throughput',
            chart: false,
            feed: {
                ...vizEntry('Requests / min', 1240, 'wave'),
                tools: chartTools('Requests per minute across the selected entity.', [
                    { label: 'Service', value: 'gateway', search: 'search index=_internal service="$value$" | stats count' },
                    { label: 'Window', value: '24h' },
                ]),
            },
        },
        {
            title: 'Search duration (p95)',
            chart: true,
            feed: {
                ...vizEntry('Milliseconds', 420, 'down'),
                tools: chartTools('95th percentile search duration.', [
                    { label: 'Unit', value: 'ms' },
                    { label: 'Tier', value: 'p95' },
                ]),
            },
        },
    ],
};

/** Demo cards and viz series for the profile tab. Works with useProfileData when `?data=demo` is set. */
export function getDemoProfileFeed(filterKey = 'all') {
    const feed = PROFILE_DEMO_BY_FILTER[filterKey] || PROFILE_DEMO_BY_FILTER.all;
    if (!isValidProfileFeedShape(feed)) {
        throw new Error('Invalid demo profile feed shape');
    }
    return feed;
}

/** Demo metric cards for the Metric tab. Works with useProfileData and StandardLineChart. */
export function getDemoMetricFeed() {
    return METRIC_DEMO;
}

const STANDARD_PIE = {
    all: [
        { label: 'Product', value: 42 },
        { label: 'Services', value: 28 },
        { label: 'Add-ons', value: 18 },
        { label: 'Other', value: 12 },
    ],
    region_a: [
        { label: 'Product', value: 55 },
        { label: 'Services', value: 22 },
        { label: 'Add-ons', value: 15 },
        { label: 'Other', value: 8 },
    ],
    region_b: [
        { label: 'Product', value: 31 },
        { label: 'Services', value: 36 },
        { label: 'Add-ons', value: 21 },
        { label: 'Other', value: 12 },
    ],
};

/** Text-row and info tools for the Assets, High Patches, and Critical Patches cards. Works with VizCard on the profile tab. */
export function getTopChartTools() {
    return {
        assets: chartTools('Asset inventory for the selected entity.', [
            { label: 'Owner', value: 'SOC', search: 'search index=_internal owner="$value$" | stats count' },
            { label: 'Class', value: 'Mixed' },
        ]),
        high: chartTools('High-severity patches still open.', [
            { label: 'Severity', value: 'High' },
            { label: 'Queue', value: 'Patch' },
        ]),
        critical: chartTools('Critical patch coverage and the latest delta.', [
            { label: 'SLA', value: '93%' },
            { label: 'Window', value: '24h' },
        ]),
    };
}

/** Demo pie, area, column, and single-value charts. Works with ProfileTabContent and StandardSplunkViz. */
export function getProfileStandardCharts(filterKey = 'all') {
    const pieSlices = STANDARD_PIE[filterKey] || STANDARD_PIE.all;
    return {
        pie: {
            title: 'Channels',
            slices: pieSlices,
            tools: chartTools('Share of assets by channel. Text cells link when a URL or search is set.', [
                { label: 'Owner', value: 'SOC', search: 'search index=_internal owner="$value$" | stats count' },
                { label: 'Region', value: 'Global' },
                { label: 'Window', value: '24h' },
            ]),
        },
        line: {
            ...vizEntry('Weekly feature adoption', 48, 'up', 'Adoption'),
            tools: chartTools('Adoption trend for the selected entity.', [
                { label: 'Product', value: 'Platform' },
                { label: 'Cohort', value: 'Weekly' },
            ]),
        },
        column: {
            ...vizEntry('Open ticket volume', 36, 'wave', 'Tickets'),
            tools: chartTools('Open ticket volume over the last day.', [
                { label: 'Queue', value: 'Patch' },
                { label: 'Priority', value: 'High' },
            ]),
        },
        singles: [
            {
                ...vizEntry('Net promoter score', 62, 'up', 'NPS'),
                tools: chartTools('Latest single value with sparkline.', [
                    { label: 'Segment', value: 'All' },
                ]),
            },
            {
                ...vizEntry('Service level', 97.2, 'flat', 'SLA'),
                tools: chartTools('Service level for the selected entity.', [
                    { label: 'Target', value: '99%' },
                ]),
            },
            {
                ...vizEntry('Feature coverage', 81, 'wave', 'Coverage'),
                tools: chartTools('Feature coverage across the catalog.', [
                    { label: 'Catalog', value: 'Core' },
                ]),
            },
        ],
    };
}
