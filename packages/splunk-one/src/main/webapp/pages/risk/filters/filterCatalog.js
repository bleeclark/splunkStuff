/** Filter IDs and dependency graph for the risk dashboard global filter bar. */

export const FILTER_IDS = {
    DATE_RANGE: 'F1',
    BUSINESS_UNIT: 'F2',
    DOMAIN: 'F3',
    ENTITY_TYPE: 'F4',
    ENTITY: 'F5',
    SEVERITY: 'F6',
};

/** @typedef {{ from: string, to: string, timezone: string }} DateRange */

/**
 * @typedef {Object} AppliedFilters
 * @property {DateRange} dateRange
 * @property {string|null} businessUnit
 * @property {string[]} domains
 * @property {string|null} entityType
 * @property {string[]} entityIds
 * @property {string[]} severities
 * @property {string|null} entityFocus
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

/** @returns {AppliedFilters} */
export function createDefaultFilters() {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 7);

    return {
        dateRange: {
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        },
        businessUnit: null,
        domains: [],
        entityType: null,
        entityIds: [],
        severities: ['critical', 'high'],
        entityFocus: null,
    };
}

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

/** Strip navigation-only fields before comparing draft vs applied. */
export function normalizeFiltersForCompare(filters) {
    if (!filters) {
        return {};
    }
    const { entityFocus, dataMode, ...rest } = filters;
    return rest;
}

/** @param {AppliedFilters} a @param {AppliedFilters} b */
export function filtersEqual(a, b) {
    return (
        JSON.stringify(normalizeFiltersForCompare(a)) ===
        JSON.stringify(normalizeFiltersForCompare(b))
    );
}

/** Whether dropdown options can be loaded for this filter given current draft parents. */
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

/** @param {AppliedFilters} draft @param {AppliedFilters} applied */
export function getDescendantIdsToClear(changedFilterId) {
    const entry = FILTER_CATALOG.find((f) => f.id === changedFilterId);
    return entry ? [...entry.clears] : [];
}
