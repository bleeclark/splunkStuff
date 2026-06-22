/** Mock filter dropdown options keyed by filter id and parent context. */

export const BUSINESS_UNITS = [
    { value: 'finance', label: 'Finance' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'operations', label: 'Operations' },
];

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

export const ENTITY_TYPES = [
    { value: 'user', label: 'User' },
    { value: 'host', label: 'Host' },
    { value: 'app', label: 'Application' },
    { value: 'service', label: 'Service' },
];

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

export const SEVERITY_OPTIONS = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

/**
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
