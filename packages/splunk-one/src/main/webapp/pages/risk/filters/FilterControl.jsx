import React from 'react';
import PropTypes from 'prop-types';

import ControlGroup from '@splunk/react-ui/ControlGroup';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';

import { FILTER_IDS } from './filterCatalog.js';
import { useFilterOptions } from '../hooks/useFilterOptions.js';
import { useFilterDraft } from '../context/DashboardFilterProvider.jsx';

const dateInputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 14,
    boxSizing: 'border-box',
};

const controlWrapStyle = {
    minWidth: 0,
    width: '100%',
};

function DateField({ label, value, onChange }) {
    return (
        <div style={{ ...controlWrapStyle, flex: 1 }}>
            <ControlGroup label={label} labelPosition="top">
                <input
                    type="date"
                    value={value}
                    style={dateInputStyle}
                    onChange={(e) => onChange(e.target.value)}
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

export default function FilterControl({ catalogEntry }) {
    const { draft, setFilter } = useFilterDraft();
    const { options, loading, canLoad } = useFilterOptions(catalogEntry.id);

    if (catalogEntry.type === 'dateRange') {
        return (
            <div style={{ ...controlWrapStyle, display: 'flex', gap: 12 }}>
                <DateField
                    label="From"
                    value={draft.dateRange.from}
                    onChange={(next) => setFilter(FILTER_IDS.DATE_RANGE, { from: next })}
                />
                <DateField
                    label="To"
                    value={draft.dateRange.to}
                    onChange={(next) => setFilter(FILTER_IDS.DATE_RANGE, { to: next })}
                />
            </div>
        );
    }

    const placeholder = !canLoad
        ? catalogEntry.id === FILTER_IDS.DOMAIN
            ? 'Select business unit first'
            : catalogEntry.id === FILTER_IDS.ENTITY
              ? 'Select entity type first'
              : 'All'
        : loading
          ? 'Loading…'
          : 'All';

    if (catalogEntry.type === 'multi') {
        const values =
            catalogEntry.id === FILTER_IDS.DOMAIN
                ? draft.domains
                : catalogEntry.id === FILTER_IDS.ENTITY
                  ? draft.entityIds
                  : catalogEntry.id === FILTER_IDS.SEVERITY
                    ? draft.severities
                    : [];

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
};
