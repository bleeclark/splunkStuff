/** Mock risk dashboard datasets for development before Splunk indexes exist. */

export const mockRiskSummary = {
    totalRiskScore: 847,
    previousTotalRiskScore: 756,
    deltaPercent: 12.0,
    anomalyCount: 23,
    previousAnomalyCount: 18,
    severityCounts: { critical: 8, high: 15, medium: 42, low: 103 },
    meanTimeToDetectHours: 4.2,
    sparklineMttd: [5.1, 4.8, 4.5, 4.3, 4.2, 4.0, 3.9],
};

export const mockTimeSeries = [
    { timestamp: '2026-06-10T08:00:00Z', riskScore: 720, baselineScore: 700, isAnomaly: false },
    { timestamp: '2026-06-10T09:00:00Z', riskScore: 890, baselineScore: 705, isAnomaly: true, anomalySeverity: 'high', entityId: 'host-abc-01' },
    { timestamp: '2026-06-10T10:00:00Z', riskScore: 810, baselineScore: 708, isAnomaly: false },
    { timestamp: '2026-06-10T11:00:00Z', riskScore: 760, baselineScore: 710, isAnomaly: false },
    { timestamp: '2026-06-10T12:00:00Z', riskScore: 920, baselineScore: 712, isAnomaly: true, anomalySeverity: 'critical', entityId: 'user-jdoe' },
    { timestamp: '2026-06-10T13:00:00Z', riskScore: 880, baselineScore: 715, isAnomaly: false },
    { timestamp: '2026-06-10T14:00:00Z', riskScore: 847, baselineScore: 718, isAnomaly: false },
];

export const mockHeatmapCells = [
    { rowKey: 'host-abc-01', colKey: 'network', value: 92, entityIds: ['host-abc-01'] },
    { rowKey: 'host-abc-01', colKey: 'endpoint', value: 78, entityIds: ['host-abc-01'] },
    { rowKey: 'user-jdoe', colKey: 'identity', value: 88, entityIds: ['user-jdoe'] },
    { rowKey: 'host-db-02', colKey: 'cloud', value: 65, entityIds: ['host-db-02'] },
    { rowKey: 'svc-api-gw', colKey: 'network', value: 71, entityIds: ['svc-api-gw'] },
];

export const mockDomainBreakdown = [
    { domain: 'identity', score: 312 },
    { domain: 'network', score: 245 },
    { domain: 'endpoint', score: 178 },
    { domain: 'cloud', score: 112 },
];

export const mockCalendarCells = [
    { rowKey: 'Mon', colKey: '9', value: 72 },
    { rowKey: 'Mon', colKey: '14', value: 85 },
    { rowKey: 'Tue', colKey: '10', value: 68 },
    { rowKey: 'Wed', colKey: '3', value: 91 },
    { rowKey: 'Thu', colKey: '15', value: 77 },
    { rowKey: 'Fri', colKey: '11', value: 63 },
];

export const mockAnomalies = [
    {
        id: 'anom-001',
        entityId: 'host-abc-01',
        entityName: 'host-abc-01',
        domain: 'network',
        category: 'lateral_movement',
        severity: 'critical',
        riskScore: 92,
        deltaFromBaseline: 45,
        firstSeen: '2026-06-10T09:00:00Z',
        lastSeen: '2026-06-10T14:00:00Z',
        status: 'open',
        recurrenceCount: 3,
        sparkline: [70, 72, 75, 88, 92, 90, 92],
        evidenceSummary: 'Unusual east-west traffic spike',
        businessUnit: 'engineering',
        entityType: 'host',
    },
    {
        id: 'anom-002',
        entityId: 'user-jdoe',
        entityName: 'user-jdoe',
        domain: 'identity',
        category: 'privilege_escalation',
        severity: 'high',
        riskScore: 88,
        deltaFromBaseline: 38,
        firstSeen: '2026-06-10T12:00:00Z',
        lastSeen: '2026-06-10T13:00:00Z',
        status: 'acknowledged',
        recurrenceCount: 1,
        sparkline: [55, 58, 62, 70, 88, 85, 84],
        evidenceSummary: 'Admin role assignment outside change window',
        businessUnit: 'finance',
        entityType: 'user',
    },
    {
        id: 'anom-003',
        entityId: 'host-db-02',
        entityName: 'host-db-02',
        domain: 'cloud',
        category: 'misconfiguration',
        severity: 'medium',
        riskScore: 65,
        deltaFromBaseline: 22,
        firstSeen: '2026-06-09T18:00:00Z',
        lastSeen: '2026-06-10T08:00:00Z',
        status: 'open',
        recurrenceCount: 2,
        sparkline: [40, 42, 48, 55, 60, 65, 63],
        evidenceSummary: 'Public storage bucket detected',
        businessUnit: 'engineering',
        entityType: 'host',
    },
];

export const mockEntityDetails = {
    'host-abc-01': {
        entityId: 'host-abc-01',
        entityName: 'host-abc-01',
        entityType: 'host',
        currentRiskScore: 92,
        threshold: 80,
        owner: 'SecOps-East',
        domain: 'network',
        businessUnit: 'engineering',
        scoreByCategory: [
            { category: 'lateral_movement', score: 45 },
            { category: 'exfiltration', score: 28 },
            { category: 'vulnerability', score: 19 },
        ],
        timeline: mockTimeSeries.filter((p) => p.entityId === 'host-abc-01' || !p.entityId),
        signals: [
            {
                signalId: 'sig-1',
                name: 'East-west traffic anomaly',
                category: 'network',
                contribution: 35,
                lastObserved: '2026-06-10T14:00:00Z',
                severity: 'critical',
            },
            {
                signalId: 'sig-2',
                name: 'Failed auth burst',
                category: 'identity',
                contribution: 18,
                lastObserved: '2026-06-10T13:30:00Z',
                severity: 'high',
            },
        ],
    },
    'user-jdoe': {
        entityId: 'user-jdoe',
        entityName: 'user-jdoe',
        entityType: 'user',
        currentRiskScore: 88,
        threshold: 75,
        owner: 'IAM Team',
        domain: 'identity',
        businessUnit: 'finance',
        scoreByCategory: [{ category: 'privilege_escalation', score: 52 }],
        timeline: mockTimeSeries,
        signals: [
            {
                signalId: 'sig-3',
                name: 'Admin role grant',
                category: 'identity',
                contribution: 42,
                lastObserved: '2026-06-10T12:00:00Z',
                severity: 'high',
            },
        ],
    },
};
