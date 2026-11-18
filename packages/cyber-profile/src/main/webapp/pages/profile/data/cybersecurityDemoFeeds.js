/**
 * Demo fixtures for Cybersecurity Profile remake (KPI row, asset table, drill-downs).
 */

function buildSeries(base, points, shape) {
    const times = [];
    const values = [];
    const now = Date.now();
    for (let i = 0; i < points; i += 1) {
        times.push(new Date(now - (points - 1 - i) * 3600000).toISOString());
        let v = base;
        if (shape === 'up') v = base + i * 1.8;
        else if (shape === 'down') v = base - i * 1.4;
        else if (shape === 'wave') v = base + Math.sin(i / 1.5) * 8;
        else v = base + (i % 3) - 1;
        values.push(Math.max(0, Math.round(v * 10) / 10));
    }
    return { times, values };
}

function vizFeed(title, base, shape, unit = '') {
    const { times, values } = buildSeries(base, 14, shape);
    const last = values[values.length - 1];
    const prev = values[values.length - 2] ?? last;
    return {
        title,
        subheader: title,
        unit,
        times,
        values,
        last,
        delta: Math.round((last - prev) * 10) / 10,
    };
}

export const PROFILE_DRILLDOWNS = [
    {
        id: 'assets',
        title: 'Assets',
        href: '/app/so_cyber_profile/profile_assets',
        feed: vizFeed('Assets', 72, 'down', '%'),
    },
    {
        id: 'high_patches',
        title: 'High Patches',
        href: '/app/so_cyber_profile/profile_high_patches',
        feed: vizFeed('High Patches', 18, 'wave'),
    },
    {
        id: 'critical_patches',
        title: 'Critical Patches',
        href: '/app/so_cyber_profile/profile_critical_patches',
        feed: vizFeed('Critical Patches', 6, 'up'),
    },
    {
        id: 'endpoints',
        title: 'Endpoints',
        href: '/app/so_cyber_profile/profile_endpoints',
        feed: vizFeed('Endpoints', 940, 'wave'),
    },
];

/** Extra KPI tiles on the main row (titles not drillable). */
export const PROFILE_EXTRA_KPIS = [
    vizFeed('Coverage', 81, 'flat', '%'),
    vizFeed('Risk score', 42, 'down'),
];

export const ENTITY_OPTIONS = [
    { value: '', label: 'Pick An Entity' },
    { value: 'finance', label: 'Finance BU' },
    { value: 'retail', label: 'Retail BU' },
    { value: 'corp', label: 'Corporate' },
];

export const DEMO_ASSETS = [
    {
        id: 'a1',
        name: 'web-prod-01',
        category: 'Server',
        facing: 'public',
        hosts: 'all',
        devices: 'all',
        stale: false,
        entity: 'finance',
        mode: 'assets',
    },
    {
        id: 'a2',
        name: 'db-core-02',
        category: 'Database',
        facing: 'all',
        hosts: 'recent',
        devices: 'all',
        stale: false,
        entity: 'finance',
        mode: 'assets',
    },
    {
        id: 'a3',
        name: 'laptop-jdoe',
        category: 'Endpoint',
        facing: 'all',
        hosts: 'all',
        devices: 'all',
        stale: true,
        entity: 'retail',
        mode: 'endpoints',
    },
    {
        id: 'a4',
        name: 'vpn-gw-east',
        category: 'Network',
        facing: 'public',
        hosts: 'all',
        devices: 'exclude_stale',
        stale: false,
        entity: 'corp',
        mode: 'assets',
    },
    {
        id: 'a5',
        name: 'pos-store-14',
        category: 'Endpoint',
        facing: 'all',
        hosts: 'recent',
        devices: 'only_stale',
        stale: true,
        entity: 'retail',
        mode: 'endpoints',
    },
    {
        id: 'a6',
        name: 'api-edge-03',
        category: 'Server',
        facing: 'public',
        hosts: 'all',
        devices: 'exclude_stale',
        stale: false,
        entity: 'corp',
        mode: 'assets',
    },
];

/**
 * @param {object} filters
 * @returns {Array}
 */
export function filterDemoAssets(filters = {}) {
    const {
        entity = '',
        mode = 'assets',
        facing = 'all',
        hosts = 'all',
        devices = 'all',
        category = 'all',
        search = '',
    } = filters;
    const q = String(search || '')
        .trim()
        .toLowerCase();

    return DEMO_ASSETS.filter((row) => {
        if (mode === 'endpoints' && row.mode !== 'endpoints' && row.category !== 'Endpoint') {
            return false;
        }
        if (mode === 'assets' && row.category === 'Endpoint' && row.mode === 'endpoints') {
            // still allow mixed; prefer assets mode shows servers/network too
        }
        if (entity && row.entity !== entity) return false;
        if (facing === 'public' && row.facing !== 'public') return false;
        if (hosts === 'recent' && row.hosts !== 'recent') return false;
        if (devices === 'exclude_stale' && row.stale) return false;
        if (devices === 'only_stale' && !row.stale) return false;
        if (category && category !== 'all' && row.category !== category) return false;
        if (q && !String(row.name).toLowerCase().includes(q) && !String(row.id).toLowerCase().includes(q)) {
            return false;
        }
        return true;
    });
}

/** True when Asset Details should show populated rows. */
export function assetFiltersActive(filters = {}) {
    const {
        facing = 'all',
        hosts = 'all',
        devices = 'all',
        category = 'all',
        search = '',
    } = filters;
    if (String(search || '').trim()) return true;
    if (category && category !== 'all') return true;
    if (facing !== 'all') return true;
    if (hosts !== 'all') return true;
    if (devices !== 'all') return true;
    return false;
}

export function getDrilldownMetrics(pageId) {
    const map = {
        assets: [
            vizFeed('Asset coverage', 78, 'up', '%'),
            vizFeed('New assets (7d)', 24, 'wave'),
            vizFeed('Unscanned', 11, 'down'),
        ],
        high_patches: [
            vizFeed('High open', 18, 'wave'),
            vizFeed('High aging (d)', 9, 'up'),
            vizFeed('High closed (7d)', 14, 'up'),
        ],
        critical_patches: [
            vizFeed('Critical open', 6, 'down'),
            vizFeed('SLA breach risk', 2, 'flat'),
            vizFeed('Critical closed (7d)', 5, 'up'),
        ],
        endpoints: [
            vizFeed('Endpoints online', 940, 'wave'),
            vizFeed('Stale agents', 38, 'down'),
            vizFeed('Compliance', 91, 'flat', '%'),
        ],
        page_assets: [
            vizFeed('Matched hosts', 128, 'wave'),
            vizFeed('Open findings', 17, 'down'),
            vizFeed('Coverage', 88, 'up', '%'),
        ],
    };
    return map[pageId] || map.assets;
}

export const DRILLDOWN_PAGE_META = {
    assets: { title: 'Assets', pageId: 'assets' },
    high_patches: { title: 'High Patches', pageId: 'high_patches' },
    critical_patches: { title: 'Critical Patches', pageId: 'critical_patches' },
    endpoints: { title: 'Endpoints', pageId: 'endpoints' },
};
