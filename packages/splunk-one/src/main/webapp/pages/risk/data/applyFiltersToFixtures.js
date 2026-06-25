/**
 * MODULE: Client-side mock data filtering that applies AppliedFilters to
 * riskFixtures datasets when the dashboard runs in mock (non-Splunk) data mode.
 */

import {
    mockAnomalies,
    mockCalendarCells,
    mockDomainBreakdown,
    mockHeatmapCells,
    mockRiskSummary,
    mockTimeSeries,
} from './riskFixtures.js';

/**
 * WHAT: Returns true when no filter list is set or the value is included in the list.
 * WORKS WITH: applyFiltersToFixtures, AppliedFilters severities/domains/entityIds matching.
 */
function matchesList(value, filterList) {
    if (!filterList || filterList.length === 0) {
        return true;
    }
    return filterList.includes(value);
}

/**
 * WHAT: Filters mock fixture datasets and scales summary metrics to match applied filters.
 * WORKS WITH: riskFixtures, AppliedFilters, mock data mode panels, DashboardFilterProvider.
 */
/** @param {import('../filters/filterCatalog.js').AppliedFilters} filters */
export function applyFiltersToFixtures(filters) {
    const filteredAnomalies = mockAnomalies.filter((row) => {
        if (filters.businessUnit && row.businessUnit !== filters.businessUnit) {
            return false;
        }
        if (filters.domains.length && !filters.domains.includes(row.domain)) {
            return false;
        }
        if (filters.entityType && row.entityType !== filters.entityType) {
            return false;
        }
        if (filters.entityIds.length && !filters.entityIds.includes(row.entityId)) {
            return false;
        }
        if (!matchesList(row.severity, filters.severities)) {
            return false;
        }
        return true;
    });

    const severityScale =
        filteredAnomalies.length / Math.max(mockAnomalies.length, 1);

    return {
        summary: {
            ...mockRiskSummary,
            anomalyCount: filteredAnomalies.length,
            previousAnomalyCount: Math.max(
                1,
                Math.round(mockRiskSummary.previousAnomalyCount * severityScale)
            ),
            totalRiskScore: Math.round(
                mockRiskSummary.totalRiskScore * (0.85 + severityScale * 0.15)
            ),
            severityCounts: {
                critical: filteredAnomalies.filter((a) => a.severity === 'critical').length,
                high: filteredAnomalies.filter((a) => a.severity === 'high').length,
                medium: filteredAnomalies.filter((a) => a.severity === 'medium').length,
                low: filteredAnomalies.filter((a) => a.severity === 'low').length,
            },
        },
        timeSeries: mockTimeSeries,
        heatmapCells: mockHeatmapCells.filter((cell) => {
            if (filters.domains.length && !filters.domains.includes(cell.colKey)) {
                return false;
            }
            if (filters.entityIds.length) {
                return cell.entityIds.some((id) => filters.entityIds.includes(id));
            }
            return true;
        }),
        domainBreakdown: mockDomainBreakdown.filter((row) => {
            if (filters.businessUnit === 'finance') {
                return row.domain === 'identity' || row.domain === 'compliance';
            }
            if (filters.businessUnit === 'engineering') {
                return ['network', 'endpoint', 'cloud'].includes(row.domain);
            }
            if (filters.domains.length) {
                return filters.domains.includes(row.domain);
            }
            return true;
        }),
        calendarCells: mockCalendarCells,
        anomalies: filteredAnomalies,
    };
}
