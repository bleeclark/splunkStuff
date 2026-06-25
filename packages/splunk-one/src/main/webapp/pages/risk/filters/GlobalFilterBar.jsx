/**
 * MODULE: Top-level investigation filter card that renders all global filter
 * controls, submit/reset actions, validation messages, and applied-filter chips.
 */

import React, { useMemo, useState } from 'react';

import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import Chip from '@splunk/react-ui/Chip';
import Message from '@splunk/react-ui/Message';

import { FILTER_CATALOG, FILTER_IDS } from './filterCatalog.js';
import FilterControl, { TimeRangeSelectorPanel } from './FilterControl.jsx';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';

/**
 * WHAT: Builds human-readable summary strings for each active applied filter.
 * WORKS WITH: AppliedFilters, GlobalFilterBar appliedChips, Splunk React UI Chip.
 */
function formatAppliedSummary(applied) {
    const parts = [];
    parts.push(`Time: ${applied.dateRange.label || `${applied.dateRange.from} → ${applied.dateRange.to}`}`);
    if (applied.businessUnit) {
        parts.push(`BU: ${applied.businessUnit}`);
    }
    if (applied.domains.length) {
        parts.push(`Domain: ${applied.domains.join(', ')}`);
    }
    if (applied.entityType) {
        parts.push(`Type: ${applied.entityType}`);
    }
    if (applied.entityIds.length) {
        parts.push(`Entity: ${applied.entityIds.join(', ')}`);
    }
    if (applied.severities.length) {
        parts.push(`Severity: ${applied.severities.join(', ')}`);
    }
    if (applied.hideEmptyPanels) {
        parts.push('Hide empty panels');
    }
    return parts;
}

/**
 * WHAT: Renders the global filter bar with controls, submit/reset, and active filter chips.
 * WORKS WITH: DashboardFilterProvider, FilterControl, FILTER_CATALOG, Splunk React UI Card/Button/Message.
 */
export default function GlobalFilterBar() {
    const {
        apply,
        reset,
        isDirty,
        lastRefreshedAt,
        appliedFilters,
        filtersValid,
        draftFilters,
        setFilter,
    } = useDashboardFilters();
    const [timeRangeOpen, setTimeRangeOpen] = useState(false);

    const appliedChips = useMemo(
        () => formatAppliedSummary(appliedFilters),
        [appliedFilters]
    );

    const refreshedLabel = lastRefreshedAt
        ? new Date(lastRefreshedAt).toLocaleTimeString()
        : '—';

    const handleApply = () => {
        if (!filtersValid && draftFilters.entityIds.length && !draftFilters.entityType) {
            return;
        }
        apply();
    };

    const dateEntry = FILTER_CATALOG.find((f) => f.id === FILTER_IDS.DATE_RANGE);
    const buEntry = FILTER_CATALOG.find((f) => f.id === FILTER_IDS.BUSINESS_UNIT);
    const severityEntry = FILTER_CATALOG.find((f) => f.id === FILTER_IDS.SEVERITY);
    const domainEntry = FILTER_CATALOG.find((f) => f.id === FILTER_IDS.DOMAIN);
    const entityTypeEntry = FILTER_CATALOG.find((f) => f.id === FILTER_IDS.ENTITY_TYPE);
    const entityEntry = FILTER_CATALOG.find((f) => f.id === FILTER_IDS.ENTITY);

    return (
        <Card
            style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: 20,
                border: '1px solid #d5dce5',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
        >
            <Card.Body style={{ padding: 0, overflow: 'hidden' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        padding: '16px 16px 18px',
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 700, color: '#2f3b47', marginBottom: 4 }}>
                            Investigation filters
                        </div>
                        <div style={{ color: '#5f6f7f', fontSize: 13, lineHeight: 1.4 }}>
                            Scope every table and trend panel to the risk period and entities
                            currently under review.
                        </div>
                    </div>
                    <span
                        style={{
                            color: '#5f6f7f',
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                            paddingTop: 2,
                        }}
                    >
                        Last refreshed {refreshedLabel}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        padding: '16px',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                            gap: 14,
                            alignItems: 'end',
                        }}
                    >
                        <FilterControl
                            catalogEntry={dateEntry}
                            timeRangeOpen={timeRangeOpen}
                            onTimeRangeOpenChange={setTimeRangeOpen}
                        />
                        <FilterControl catalogEntry={buEntry} />
                        <FilterControl catalogEntry={severityEntry} />
                    </div>
                    {timeRangeOpen ? (
                        <TimeRangeSelectorPanel onClose={() => setTimeRangeOpen(false)} />
                    ) : null}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                            gap: 14,
                            alignItems: 'end',
                        }}
                    >
                        <FilterControl catalogEntry={domainEntry} />
                        <FilterControl catalogEntry={entityTypeEntry} />
                        <FilterControl catalogEntry={entityEntry} />
                    </div>
                    <label
                        htmlFor="risk-hide-empty-panels"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#2f3b47',
                            fontSize: 13,
                            width: 'fit-content',
                        }}
                    >
                        <input
                            id="risk-hide-empty-panels"
                            type="checkbox"
                            checked={Boolean(draftFilters.hideEmptyPanels)}
                            onChange={(e) =>
                                setFilter(FILTER_IDS.HIDE_EMPTY_PANELS, e.target.checked)
                            }
                        />
                        Hide empty panels
                    </label>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                        gap: 12,
                        padding: '0 16px 16px',
                    }}
                >
                    <Button
                        label="Submit"
                        appearance="primary"
                        onClick={handleApply}
                        style={{ width: '100%' }}
                    />
                    <Button
                        label="Reset"
                        appearance="secondary"
                        onClick={reset}
                        style={{ width: '100%' }}
                    />
                </div>

                {isDirty ? (
                    <Message style={{ margin: '0 16px 16px' }} type="warning">
                        You have unsaved filter changes. Click <strong>Submit</strong> to update
                        all panels.
                    </Message>
                ) : null}

                {!filtersValid && draftFilters.entityIds.length && !draftFilters.entityType ? (
                    <Message style={{ margin: '0 16px 16px' }} type="error">
                        Select an entity type before choosing specific entities.
                    </Message>
                ) : null}

                {!isDirty && appliedChips.length ? (
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            padding: '0 16px 16px',
                            alignItems: 'center',
                        }}
                    >
                        <span style={{ fontSize: 12, color: '#666', marginRight: 4 }}>
                            Active filters:
                        </span>
                        {appliedChips.map((chip) => (
                            <Chip key={chip}>{chip}</Chip>
                        ))}
                    </div>
                ) : null}
            </Card.Body>
        </Card>
    );
}
