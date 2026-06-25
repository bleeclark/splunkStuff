/**
 * Mock filter dropdown options keyed by filter id and parent context.
 *
 * MODULE: Static option lists for business unit, domain, entity type, entity,
 * and severity filters used by useFilterOptions in mock data mode.
 */

/**
 * WHAT: Business unit choices for the F2 global filter dropdown.
 * WORKS WITH: getMockFilterOptions, FILTER_IDS.BUSINESS_UNIT, useFilterOptions.
 */
export const BUSINESS_UNITS = [
    { value: 'finance', label: 'Finance' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'operations', label: 'Operations' },
];

/**
 * WHAT: Domain options grouped by parent business unit for the F3 multi-select filter.
 * WORKS WITH: getMockFilterOptions, BUSINESS_UNITS, FILTER_IDS.DOMAIN, canLoadFilterOptions.
 */
export const DOMAINS_BY_BU = {
    finance: [
        { value: 'identity', label: 'Identity' },
        { value: 'compliance', label: 'Compliance' },
    ],
    engineering: [
        { value: 'network', label: 'Network' },
        { value: 'endpoint', label: 'Endpoint' },
        { value: 'cloud', label: 'Cloud' },
    ],
    operations: [
        { value: 'identity', label: 'Identity' },
        { value: 'network', label: 'Network' },
    ],
};

/**
 * WHAT: Entity type choices for the F4 single-select filter.
 * WORKS WITH: getMockFilterOptions, FILTER_IDS.ENTITY_TYPE, ENTITIES_BY_TYPE.
 */
export const ENTITY_TYPES = [
    { value: 'user', label: 'User' },
    { value: 'host', label: 'Host' },
    { value: 'app', label: 'Application' },
    { value: 'service', label: 'Service' },
];

/**
 * WHAT: Entity ID options grouped by parent entity type for the F5 multi-select filter.
 * WORKS WITH: getMockFilterOptions, ENTITY_TYPES, FILTER_IDS.ENTITY, mockAnomalies.
 */
export const ENTITIES_BY_TYPE = {
    user: [
        { value: 'user-jdoe', label: 'user-jdoe' },
        { value: 'user-asmith', label: 'user-asmith' },
    ],
    host: [
        { value: 'host-abc-01', label: 'host-abc-01' },
        { value: 'host-db-02', label: 'host-db-02' },
        { value: 'host-web-03', label: 'host-web-03' },
    ],
    app: [{ value: 'app-payroll', label: 'app-payroll' }],
    service: [{ value: 'svc-api-gw', label: 'svc-api-gw' }],
};

/**
 * WHAT: Severity level choices for the F6 multi-select filter.
 * WORKS WITH: getMockFilterOptions, FILTER_IDS.SEVERITY, createDefaultFilters severities.
 */
export const SEVERITY_OPTIONS = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

/**
 * WHAT: Returns mock dropdown options for a filter ID given current parent context.
 * WORKS WITH: FILTER_IDS, AppliedFilters, useFilterOptions, BUSINESS_UNITS, DOMAINS_BY_BU, ENTITIES_BY_TYPE.
 * @param {string} filterId
 * @param {import('../filters/filterCatalog.js').AppliedFilters} parentContext
 */
export function getMockFilterOptions(filterId, parentContext) {
    switch (filterId) {
        case 'F2':
            return BUSINESS_UNITS;
        case 'F3': {
            if (!parentContext.businessUnit) {
                return [];
            }
            return DOMAINS_BY_BU[parentContext.businessUnit] || [];
        }
        case 'F4':
            return ENTITY_TYPES;
        case 'F5': {
            if (!parentContext.entityType) {
                return [];
            }
            return ENTITIES_BY_TYPE[parentContext.entityType] || [];
        }
        case 'F6':
            return SEVERITY_OPTIONS;
        default:
            return [];
    }
}
