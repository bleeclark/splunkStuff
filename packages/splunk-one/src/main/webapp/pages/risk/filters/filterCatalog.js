/**
 * Filter IDs and dependency graph for the risk dashboard global filter bar.
 *
 * MODULE: Central catalog of filter definitions, time-range presets, and pure
 * helpers that create, mutate, validate, and compare AppliedFilters state
 * shared by the filter bar, runtime mode parsing, Splunk param mapping, and mock data layer.
 */

/**
 * WHAT: Stable string IDs for each global filter control in the risk dashboard.
 * WORKS WITH: FILTER_CATALOG, FilterControl, GlobalFilterBar, filterUrlSync, getMockFilterOptions.
 */
export const FILTER_IDS = {
    DATE_RANGE: 'F1',
    BUSINESS_UNIT: 'F2',
    DOMAIN: 'F3',
    ENTITY_TYPE: 'F4',
    ENTITY: 'F5',
    SEVERITY: 'F6',
    HIDE_EMPTY_PANELS: 'F7',
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * WHAT: Formats a Date as an ISO calendar date string (YYYY-MM-DD).
 * WORKS WITH: resolveTimeRangePreset, TIME_RANGE_OPTIONS, AppliedFilters.dateRange.
 */
function toDateValue(date) {
    return date.toISOString().slice(0, 10);
}

/**
 * WHAT: Returns a new Date shifted backward by the given milliseconds.
 * WORKS WITH: toDateValue, startOfLocalDay, TIME_RANGE_OPTIONS preset fromDate handlers.
 */
function subtractMs(date, ms) {
    return new Date(date.getTime() - ms);
}

/**
 * WHAT: Returns midnight at the start of the given date in local timezone.
 * WORKS WITH: TIME_RANGE_OPTIONS (today, yesterday presets), subtractMs.
 */
function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * WHAT: Preset time-range choices with Splunk earliest/latest tokens and date math.
 * WORKS WITH: resolveTimeRangePreset, FilterControl, TimeRangeSelectorPanel, Splunk search time bounds.
 */
export const TIME_RANGE_OPTIONS = [
    {
        value: 'last_15m',
        label: 'Last 15 minutes',
        mode: 'relative',
        earliest: '-15m',
        latest: 'now',
        fromDate: (now) => subtractMs(now, 15 * MINUTE_MS),
    },
    {
        value: 'last_60m',
        label: 'Last 60 minutes',
        mode: 'relative',
        earliest: '-60m',
        latest: 'now',
        fromDate: (now) => subtractMs(now, HOUR_MS),
    },
    {
        value: 'last_24h',
        label: 'Last 24 hours',
        mode: 'relative',
        earliest: '-24h',
        latest: 'now',
        fromDate: (now) => subtractMs(now, DAY_MS),
    },
    {
        value: 'last_7d',
        label: 'Last 7 days',
        mode: 'relative',
        earliest: '-7d@d',
        latest: 'now',
        fromDate: (now) => subtractMs(now, 7 * DAY_MS),
    },
    {
        value: 'today',
        label: 'Today',
        mode: 'relative',
        earliest: '@d',
        latest: 'now',
        fromDate: (now) => startOfLocalDay(now),
    },
    {
        value: 'yesterday',
        label: 'Yesterday',
        mode: 'relative',
        earliest: '-1d@d',
        latest: '@d',
        fromDate: (now) => subtractMs(startOfLocalDay(now), DAY_MS),
        toDate: (now) => subtractMs(startOfLocalDay(now), DAY_MS),
    },
    {
        value: 'realtime_5m',
        label: 'Real-time 5 minutes',
        mode: 'real-time',
        earliest: 'rt-5m',
        latest: 'rt',
        fromDate: (now) => subtractMs(now, 5 * MINUTE_MS),
    },
    {
        value: 'realtime_30m',
        label: 'Real-time 30 minutes',
        mode: 'real-time',
        earliest: 'rt-30m',
        latest: 'rt',
        fromDate: (now) => subtractMs(now, 30 * MINUTE_MS),
    },
    {
        value: 'custom',
        label: 'Custom date range',
        mode: 'absolute',
        earliest: null,
        latest: null,
    },
];

/**
 * WHAT: Resolves a preset or custom time-range value into a full dateRange object.
 * WORKS WITH: TIME_RANGE_OPTIONS, createDefaultFilters, TimeRangeSelectorPanel.
 */
export function resolveTimeRangePreset(value, now = new Date(), currentRange = {}) {
    const option =
        TIME_RANGE_OPTIONS.find((entry) => entry.value === value) ||
        TIME_RANGE_OPTIONS.find((entry) => entry.value === 'last_7d');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    if (option.value === 'custom') {
        const from = currentRange.from || toDateValue(subtractMs(now, 7 * DAY_MS));
        const to = currentRange.to || toDateValue(now);
        return {
            ...currentRange,
            from,
            to,
            timezone: currentRange.timezone || timezone,
            preset: option.value,
            label: option.label,
            mode: option.mode,
            earliest: from,
            latest: to,
        };
    }

    const fromDate = option.fromDate ? option.fromDate(now) : subtractMs(now, 7 * DAY_MS);
    const toDate = option.toDate ? option.toDate(now) : now;

    return {
        ...currentRange,
        from: toDateValue(fromDate),
        to: toDateValue(toDate),
        timezone: currentRange.timezone || timezone,
        preset: option.value,
        label: option.label,
        mode: option.mode,
        earliest: option.earliest,
        latest: option.latest,
    };
}

/** @typedef {{ from: string, to: string, timezone: string, preset?: string, label?: string, mode?: string, earliest?: string, latest?: string }} DateRange */

/**
 * @typedef {Object} AppliedFilters
 * @property {DateRange} dateRange
 * @property {string|null} businessUnit
 * @property {string[]} domains
 * @property {string|null} entityType
 * @property {string[]} entityIds
 * @property {string[]} severities
 * @property {boolean} hideEmptyPanels
 */

/**
 * WHAT: Metadata for each filter control including type, dependencies, and cascade clears.
 * WORKS WITH: FILTER_IDS, GlobalFilterBar, FilterControl, setFilterValue, canLoadFilterOptions.
 */
export const FILTER_CATALOG = [
    {
        id: FILTER_IDS.DATE_RANGE,
        label: 'Date range',
        type: 'dateRange',
        dependsOn: [],
        clears: [],
        required: true,
    },
    {
        id: FILTER_IDS.BUSINESS_UNIT,
        label: 'Business unit',
        type: 'single',
        dependsOn: [FILTER_IDS.DATE_RANGE],
        clears: [FILTER_IDS.DOMAIN, FILTER_IDS.ENTITY_TYPE, FILTER_IDS.ENTITY],
        required: false,
    },
    {
        id: FILTER_IDS.DOMAIN,
        label: 'Domain',
        type: 'multi',
        dependsOn: [FILTER_IDS.DATE_RANGE, FILTER_IDS.BUSINESS_UNIT],
        clears: [FILTER_IDS.ENTITY_TYPE, FILTER_IDS.ENTITY],
        required: false,
    },
    {
        id: FILTER_IDS.ENTITY_TYPE,
        label: 'Entity type',
        type: 'single',
        dependsOn: [FILTER_IDS.DATE_RANGE, FILTER_IDS.BUSINESS_UNIT, FILTER_IDS.DOMAIN],
        clears: [FILTER_IDS.ENTITY],
        required: false,
    },
    {
        id: FILTER_IDS.ENTITY,
        label: 'Entity',
        type: 'multi',
        dependsOn: [
            FILTER_IDS.DATE_RANGE,
            FILTER_IDS.BUSINESS_UNIT,
            FILTER_IDS.DOMAIN,
            FILTER_IDS.ENTITY_TYPE,
        ],
        clears: [],
        required: false,
    },
    {
        id: FILTER_IDS.SEVERITY,
        label: 'Severity',
        type: 'multi',
        dependsOn: [FILTER_IDS.DATE_RANGE],
        clears: [],
        required: false,
    },
];

/**
 * WHAT: Builds the initial AppliedFilters object with default time range and severities.
 * WORKS WITH: resolveTimeRangePreset, DashboardFilterProvider.
 */
/** @returns {AppliedFilters} */
export function createDefaultFilters() {
    const dateRange = resolveTimeRangePreset('last_7d');

    return {
        dateRange,
        businessUnit: null,
        domains: [],
        entityType: null,
        entityIds: [],
        severities: ['critical', 'high'],
        hideEmptyPanels: false,
    };
}

/**
 * WHAT: Immutably updates one filter field and clears dependent child filters per catalog rules.
 * WORKS WITH: FILTER_CATALOG, FILTER_IDS, DashboardFilterProvider, FilterControl.
 */
/** @param {AppliedFilters} filters @param {string} filterId @param {*} value */
export function setFilterValue(filters, filterId, value) {
    const next = { ...filters };

    switch (filterId) {
        case FILTER_IDS.DATE_RANGE:
            next.dateRange = { ...filters.dateRange, ...value };
            break;
        case FILTER_IDS.BUSINESS_UNIT:
            next.businessUnit = value || null;
            break;
        case FILTER_IDS.DOMAIN:
            next.domains = Array.isArray(value) ? value : [];
            break;
        case FILTER_IDS.ENTITY_TYPE:
            next.entityType = value || null;
            break;
        case FILTER_IDS.ENTITY:
            next.entityIds = Array.isArray(value) ? value : [];
            break;
        case FILTER_IDS.SEVERITY:
            next.severities = Array.isArray(value) ? value : [];
            break;
        case FILTER_IDS.HIDE_EMPTY_PANELS:
            next.hideEmptyPanels = Boolean(value);
            break;
        default:
            break;
    }

    const catalogEntry = FILTER_CATALOG.find((f) => f.id === filterId);
    if (catalogEntry && catalogEntry.clears.length) {
        catalogEntry.clears.forEach((childId) => {
            switch (childId) {
                case FILTER_IDS.DOMAIN:
                    next.domains = [];
                    break;
                case FILTER_IDS.ENTITY_TYPE:
                    next.entityType = null;
                    break;
                case FILTER_IDS.ENTITY:
                    next.entityIds = [];
                    break;
                default:
                    break;
            }
        });
    }

    return next;
}

/**
 * WHAT: Strips navigation-only fields before comparing draft vs applied filter state.
 * WORKS WITH: filtersEqual, DashboardFilterProvider, dataMode.
 */
export function normalizeFiltersForCompare(filters) {
    if (!filters) {
        return {};
    }
    const { dataMode, ...rest } = filters;
    return rest;
}

/**
 * WHAT: Deep-compares two filter objects after normalizing out non-filter fields.
 * WORKS WITH: normalizeFiltersForCompare, DashboardFilterProvider isDirty checks.
 */
/** @param {AppliedFilters} a @param {AppliedFilters} b */
export function filtersEqual(a, b) {
    return (
        JSON.stringify(normalizeFiltersForCompare(a)) ===
        JSON.stringify(normalizeFiltersForCompare(b))
    );
}

/**
 * WHAT: Returns whether dropdown options can load for a filter given current parent selections.
 * WORKS WITH: FILTER_IDS, useFilterOptions, FilterControl, getMockFilterOptions.
 */
export function canLoadFilterOptions(filterId, draft) {
    switch (filterId) {
        case FILTER_IDS.BUSINESS_UNIT:
        case FILTER_IDS.SEVERITY:
            return true;
        case FILTER_IDS.DOMAIN:
            return Boolean(draft.businessUnit);
        case FILTER_IDS.ENTITY_TYPE:
            return Boolean(draft.businessUnit);
        case FILTER_IDS.ENTITY:
            return Boolean(draft.entityType);
        default:
            return false;
    }
}

/**
 * WHAT: Validates that required date bounds exist and entity selections have a type.
 * WORKS WITH: AppliedFilters, GlobalFilterBar, DashboardFilterProvider filtersValid.
 */
/** @param {AppliedFilters} filters */
export function filtersAreValid(filters) {
    if (!filters?.dateRange?.from || !filters?.dateRange?.to) {
        return false;
    }
    if (filters.entityIds.length > 0 && !filters.entityType) {
        return false;
    }
    return true;
}
