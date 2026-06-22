import React, { useMemo } from 'react';

import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import Chip from '@splunk/react-ui/Chip';
import Message from '@splunk/react-ui/Message';

import { FILTER_CATALOG, FILTER_IDS } from './filterCatalog.js';
import FilterControl from './FilterControl.jsx';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';

function formatAppliedSummary(applied) {
    const parts = [];
    parts.push(`${applied.dateRange.from} → ${applied.dateRange.to}`);
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
    return parts;
}

export default function GlobalFilterBar() {
    const {
        apply,
        reset,
        isDirty,
        lastRefreshedAt,
        appliedFilters,
        filtersValid,
        draftFilters,
    } = useDashboardFilters();

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
                marginBottom: 20,
                border: '1px solid #d5dce5',
                borderRadius: 8,
                overflow: 'hidden',
            }}
        >
            <Card.Body style={{ padding: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)',
                            gap: 12,
                            alignItems: 'end',
                        }}
                    >
                        <FilterControl catalogEntry={dateEntry} />
                        <FilterControl catalogEntry={buEntry} />
                        <FilterControl catalogEntry={severityEntry} />
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 12,
                            alignItems: 'end',
                        }}
                    >
                        <FilterControl catalogEntry={domainEntry} />
                        <FilterControl catalogEntry={entityTypeEntry} />
                        <FilterControl catalogEntry={entityEntry} />
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 16,
                        flexWrap: 'wrap',
                    }}
                >
                    <Button label="Apply filters" appearance="primary" onClick={handleApply} />
                    <Button label="Reset" appearance="secondary" onClick={reset} />
                    <span style={{ fontSize: 12, color: '#666' }}>
                        Last refreshed {refreshedLabel}
                    </span>
                </div>

                {isDirty ? (
                    <Message type="warning" style={{ marginTop: 12 }}>
                        You have unsaved filter changes. Click <strong>Apply filters</strong> to
                        update all panels.
                    </Message>
                ) : null}

                {!filtersValid && draftFilters.entityIds.length && !draftFilters.entityType ? (
                    <Message type="error" style={{ marginTop: 12 }}>
                        Select an entity type before choosing specific entities.
                    </Message>
                ) : null}

                {!isDirty && appliedChips.length ? (
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginTop: 12,
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
