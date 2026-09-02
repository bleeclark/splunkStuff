/**
 * Demo-only fixtures for Profile. Enable with ?data=demo on the page URL.
 * Cards and viz use different content so KPI tiles vs chart panels are easy to compare.
 */

import { isValidProfileFeedShape } from '../profileContract.js';

/** @returns {boolean} */
export function isProfileDemoMode() {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('data') === 'demo';
}

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
            vizEntry('Revenue trend (USD)', 220, 'up', 'Revenue'),
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

/** @type {Record<string, { cards: Array }>} */
const METRIC_DEMO = {
    cards: [
        {
            title: 'API throughput',
            chart: false,
            feed: vizEntry('Requests / min', 1240, 'wave'),
        },
        {
            title: 'Search duration (p95)',
            chart: true,
            feed: vizEntry('Milliseconds', 420, 'down'),
        },
    ],
};

/**
 * @param {string} filterKey
 * @returns {{ cards: Array, viz: Array }}
 */
export function getDemoProfileFeed(filterKey = 'all') {
    const feed = PROFILE_DEMO_BY_FILTER[filterKey] || PROFILE_DEMO_BY_FILTER.all;
    if (!isValidProfileFeedShape(feed)) {
        throw new Error('Invalid demo profile feed shape');
    }
    return feed;
}

/** @returns {{ cards: Array }} */
export function getDemoMetricFeed() {
    return METRIC_DEMO;
}
