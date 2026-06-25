/**
 * MODULE: Reusable filter input components for the risk dashboard—time range
 * picker panel, date fields, and catalog-driven single/multi select controls.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import ControlGroup from '@splunk/react-ui/ControlGroup';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import DatePicker from '@splunk/react-ui/Date';

import { FILTER_IDS, TIME_RANGE_OPTIONS, resolveTimeRangePreset } from './filterCatalog.js';
import { useFilterOptions } from '../hooks/useFilterOptions.js';
import { useFilterDraft } from '../context/DashboardFilterProvider.jsx';

const controlWrapStyle = {
    minWidth: 0,
    width: '100%',
};

const timeTabs = [
    { id: 'presets', label: 'Presets' },
    { id: 'relative', label: 'Relative' },
    { id: 'realtime', label: 'Real-time' },
    { id: 'date', label: 'Date Range' },
    { id: 'advanced', label: 'Advanced' },
];

const optionButtonStyle = {
    width: '100%',
    minHeight: 36,
    border: '1px solid #d5dce5',
    borderRadius: 4,
    background: '#fff',
    color: '#2f3b47',
    cursor: 'pointer',
    font: 'inherit',
    padding: '8px 10px',
    textAlign: 'left',
};

const activeOptionButtonStyle = {
    ...optionButtonStyle,
    borderColor: '#006d9c',
    background: '#eaf4fb',
    boxShadow: 'inset 3px 0 0 #006d9c',
};

const tabButtonStyle = {
    border: 0,
    borderBottom: '2px solid transparent',
    background: 'transparent',
    color: '#516173',
    cursor: 'pointer',
    font: 'inherit',
    fontWeight: 600,
    padding: '8px 10px',
};

const activeTabButtonStyle = {
    ...tabButtonStyle,
    borderBottomColor: '#006d9c',
    color: '#2f3b47',
};

const tokenInputStyle = {
    width: '100%',
    minHeight: 34,
    boxSizing: 'border-box',
    border: '1px solid #9aa6b2',
    borderRadius: 4,
    padding: '6px 8px',
    font: 'inherit',
};

/**
 * WHAT: Renders a labeled Splunk DatePicker for custom from/to date selection.
 * WORKS WITH: TimeRangeSelectorPanel, Splunk React UI DatePicker, AppliedFilters.dateRange.
 */
function DateField({ label, value, onChange }) {
    return (
        <div style={{ minWidth: 0 }}>
            <ControlGroup label={label} labelPosition="top" controlsLayout="none">
                <DatePicker
                    value={value}
                    highlightToday
                    onChange={(e, { value: nextValue }) => onChange(nextValue)}
                    style={{ width: '100%' }}
                />
            </ControlGroup>
        </div>
    );
}

DateField.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

/**
 * WHAT: Formats the draft dateRange as a display string for real-time, relative, or absolute modes.
 * WORKS WITH: TimeRangeControl, TimeRangeSelectorPanel, AppliedFilters.dateRange, Splunk time modifiers.
 */
function formatResolvedRange(dateRange) {
    if (dateRange.mode === 'real-time') {
        return `${dateRange.earliest} to ${dateRange.latest}`;
    }
    if (dateRange.mode === 'relative') {
        return `${dateRange.earliest} to ${dateRange.latest}`;
    }
    return `${dateRange.from} to ${dateRange.to}`;
}

/**
 * WHAT: Collapsible button that shows the current time-range label and toggles the selector panel.
 * WORKS WITH: FilterControl, TimeRangeSelectorPanel, useFilterDraft, FILTER_IDS.DATE_RANGE.
 */
function TimeRangeControl({ expanded, onExpandedChange }) {
    const { draft } = useFilterDraft();
    const label = draft.dateRange.label || formatResolvedRange(draft.dateRange);

    return (
        <div style={controlWrapStyle}>
            <ControlGroup label="Time range" labelPosition="top" controlsLayout="none">
                <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => onExpandedChange(!expanded)}
                    style={{
                        width: '100%',
                        minHeight: 34,
                        border: '1px solid #9aa6b2',
                        borderRadius: 4,
                        background: '#fff',
                        color: '#2f3b47',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        font: 'inherit',
                        fontWeight: 600,
                        padding: '6px 10px',
                        textAlign: 'left',
                    }}
                >
                    <span
                        style={{
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {label}
                    </span>
                    <span aria-hidden="true" style={{ color: '#516173' }}>
                        ▾
                    </span>
                </button>
            </ControlGroup>
        </div>
    );
}

TimeRangeControl.propTypes = {
    expanded: PropTypes.bool.isRequired,
    onExpandedChange: PropTypes.func.isRequired,
};

/**
 * WHAT: Tabbed panel for preset, relative, real-time, custom date, and advanced Splunk time ranges.
 * WORKS WITH: TIME_RANGE_OPTIONS, resolveTimeRangePreset, DateField, useFilterDraft, GlobalFilterBar.
 */
export function TimeRangeSelectorPanel({ onClose }) {
    const { draft, setFilter } = useFilterDraft();
    const currentPreset = draft.dateRange.preset || 'custom';
    let initialTab = 'presets';
    if (draft.dateRange.mode === 'real-time') {
        initialTab = 'realtime';
    } else if (draft.dateRange.mode === 'advanced' || currentPreset === 'advanced') {
        initialTab = 'advanced';
    } else if (currentPreset === 'custom') {
        initialTab = 'date';
    }
    const [activeTab, setActiveTab] = useState(initialTab);
    const [advancedEarliest, setAdvancedEarliest] = useState(
        draft.dateRange.earliest || draft.dateRange.from
    );
    const [advancedLatest, setAdvancedLatest] = useState(
        draft.dateRange.latest || draft.dateRange.to
    );

    const handlePresetChange = (value) => {
        setFilter(
            FILTER_IDS.DATE_RANGE,
            resolveTimeRangePreset(value || 'last_7d', new Date(), draft.dateRange)
        );
    };

    const handleCustomDateChange = (field, value) => {
        setFilter(
            FILTER_IDS.DATE_RANGE,
            resolveTimeRangePreset('custom', new Date(), {
                ...draft.dateRange,
                [field]: value,
            })
        );
    };

    const handleAdvancedApply = () => {
        const earliest = advancedEarliest.trim() || draft.dateRange.earliest || draft.dateRange.from;
        const latest = advancedLatest.trim() || draft.dateRange.latest || draft.dateRange.to;

        setFilter(FILTER_IDS.DATE_RANGE, {
            from: draft.dateRange.from,
            to: draft.dateRange.to,
            timezone: draft.dateRange.timezone,
            preset: 'advanced',
            label: 'Advanced',
            mode: 'advanced',
            earliest,
            latest,
        });
    };

    const renderOptionList = (values) => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
                gap: 8,
            }}
        >
            {TIME_RANGE_OPTIONS.filter((option) => values.includes(option.value)).map(
                (option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => handlePresetChange(option.value)}
                        style={
                            currentPreset === option.value
                                ? activeOptionButtonStyle
                                : optionButtonStyle
                        }
                    >
                        {option.label}
                    </button>
                )
            )}
        </div>
    );

    return (
        <div
            style={{
                border: '1px solid #d5dce5',
                borderRadius: 6,
                background: '#fff',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    alignItems: 'center',
                    borderBottom: '1px solid #d9e0e8',
                    padding: '0 10px',
                }}
                role="tablist"
                aria-label="Time range selector"
            >
                {timeTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={activeTab === tab.id ? activeTabButtonStyle : tabButtonStyle}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ padding: 14 }}>
                {activeTab === 'presets' ? (
                    renderOptionList(['last_60m', 'last_24h', 'last_7d', 'today', 'yesterday'])
                ) : null}

                {activeTab === 'relative' ? (
                    renderOptionList(['last_15m', 'last_60m', 'last_24h', 'last_7d'])
                ) : null}

                {activeTab === 'realtime' ? (
                    renderOptionList(['realtime_5m', 'realtime_30m'])
                ) : null}

                {activeTab === 'date' ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
                            gap: 12,
                            alignItems: 'end',
                        }}
                    >
                        <DateField
                            label="From"
                            value={draft.dateRange.from}
                            onChange={(next) => handleCustomDateChange('from', next)}
                        />
                        <DateField
                            label="To"
                            value={draft.dateRange.to}
                            onChange={(next) => handleCustomDateChange('to', next)}
                        />
                    </div>
                ) : null}

                {activeTab === 'advanced' ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                            gap: 12,
                            alignItems: 'end',
                        }}
                    >
                        <label htmlFor="risk-time-earliest" style={{ color: '#2f3b47' }}>
                            <span style={{ display: 'block', marginBottom: 5 }}>Earliest</span>
                            <input
                                id="risk-time-earliest"
                                value={advancedEarliest}
                                onChange={(e) => setAdvancedEarliest(e.target.value)}
                                style={tokenInputStyle}
                            />
                        </label>
                        <label htmlFor="risk-time-latest" style={{ color: '#2f3b47' }}>
                            <span style={{ display: 'block', marginBottom: 5 }}>Latest</span>
                            <input
                                id="risk-time-latest"
                                value={advancedLatest}
                                onChange={(e) => setAdvancedLatest(e.target.value)}
                                style={tokenInputStyle}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleAdvancedApply}
                            style={{
                                ...optionButtonStyle,
                                textAlign: 'center',
                                fontWeight: 700,
                            }}
                        >
                            Apply Advanced
                        </button>
                    </div>
                ) : null}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        borderTop: '1px solid #e7ebef',
                        marginTop: 14,
                        paddingTop: 12,
                    }}
                >
                    <div
                        style={{
                            color: '#516173',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                            fontSize: 12,
                        }}
                    >
                        <span>Search window</span>
                        <strong style={{ color: '#2f3b47' }}>
                            {formatResolvedRange(draft.dateRange)}
                        </strong>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: '1px solid #9aa6b2',
                            borderRadius: 4,
                            background: '#fff',
                            color: '#2f3b47',
                            cursor: 'pointer',
                            font: 'inherit',
                            fontWeight: 700,
                            minHeight: 32,
                            padding: '5px 14px',
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

TimeRangeSelectorPanel.propTypes = {
    onClose: PropTypes.func.isRequired,
};

/**
 * WHAT: Returns the Multiselect/Select placeholder text based on load state and parent dependencies.
 * WORKS WITH: canLoadFilterOptions, useFilterOptions, FILTER_IDS, FilterControl.
 */
function getPlaceholder({ canLoad, loading, catalogEntry }) {
    if (!canLoad) {
        if (catalogEntry.id === FILTER_IDS.DOMAIN) {
            return 'Select business unit first';
        }
        if (catalogEntry.id === FILTER_IDS.ENTITY) {
            return 'Select entity type first';
        }
        return 'All';
    }
    return loading ? 'Loading…' : 'All';
}

/**
 * WHAT: Reads the current multi-select values from draft state for a catalog entry.
 * WORKS WITH: AppliedFilters, FILTER_IDS, FilterControl Multiselect, useFilterDraft.
 */
function getMultiValues(catalogEntry, draft) {
    if (catalogEntry.id === FILTER_IDS.DOMAIN) {
        return draft.domains;
    }
    if (catalogEntry.id === FILTER_IDS.ENTITY) {
        return draft.entityIds;
    }
    if (catalogEntry.id === FILTER_IDS.SEVERITY) {
        return draft.severities;
    }
    return [];
}

/**
 * WHAT: Renders a single filter control (time range, multi-select, or single-select) from catalog metadata.
 * WORKS WITH: FILTER_CATALOG, useFilterOptions, useFilterDraft, TimeRangeControl, Splunk React UI Select/Multiselect.
 */
export default function FilterControl({ catalogEntry, timeRangeOpen, onTimeRangeOpenChange }) {
    const { draft, setFilter } = useFilterDraft();
    const { options, loading, canLoad } = useFilterOptions(catalogEntry.id);

    if (catalogEntry.type === 'dateRange') {
        return (
            <TimeRangeControl
                expanded={timeRangeOpen}
                onExpandedChange={onTimeRangeOpenChange}
            />
        );
    }

    const placeholder = getPlaceholder({ canLoad, loading, catalogEntry });

    if (catalogEntry.type === 'multi') {
        const values = getMultiValues(catalogEntry, draft);

        return (
            <div style={controlWrapStyle}>
                <ControlGroup label={catalogEntry.label} labelPosition="top">
                    <Multiselect
                        values={values}
                        disabled={!canLoad}
                        placeholder={placeholder}
                        onChange={(e, { values: nextValues }) =>
                            setFilter(catalogEntry.id, nextValues || [])
                        }
                    >
                        {options.map((opt) => (
                            <Multiselect.Option
                                key={opt.value}
                                label={opt.label}
                                value={opt.value}
                            />
                        ))}
                    </Multiselect>
                </ControlGroup>
            </div>
        );
    }

    const singleValue =
        catalogEntry.id === FILTER_IDS.BUSINESS_UNIT
            ? draft.businessUnit || ''
            : draft.entityType || '';

    return (
        <div style={controlWrapStyle}>
            <ControlGroup label={catalogEntry.label} labelPosition="top">
                <Select
                    value={singleValue}
                    disabled={!canLoad && catalogEntry.id === FILTER_IDS.DOMAIN}
                    placeholder={placeholder}
                    onChange={(e, { value }) =>
                        setFilter(catalogEntry.id, value || null)
                    }
                >
                    <Select.Option label="All" value="" />
                    {options.map((opt) => (
                        <Select.Option key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </Select>
            </ControlGroup>
        </div>
    );
}

FilterControl.propTypes = {
    catalogEntry: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
    }).isRequired,
    timeRangeOpen: PropTypes.bool,
    onTimeRangeOpenChange: PropTypes.func,
};

FilterControl.defaultProps = {
    timeRangeOpen: false,
    onTimeRangeOpenChange: () => {},
};
