import React from 'react';
import Select from '@splunk/react-ui/Select';
import Text from '@splunk/react-ui/Text';

import { MUTED } from '../ProfileStyles';

/** Radio group used by the asset filters. Works with AssetDetailsFilters. */
function RadioGroup({ label, name, value, options, onChange }) {
    return (
        <div style={{ minWidth: 130 }}>
            {label ? (
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: MUTED,
                        marginBottom: 10,
                    }}
                >
                    {label}
                </div>
            ) : null}
            <div className="ss-profile-radio-group">
                {options.map((opt) => (
                    <label key={opt.value} className="ss-profile-radio">
                        <input
                            type="radio"
                            name={name}
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

/** Asset Details filter bar: facing, hosts, devices, category, and search. Works with the results table and filterDemoAssets. */
export default function AssetDetailsFilters({
    filters,
    onChange,
    showDevices = true,
    recentHostsLabel = 'Recently Added (-7d)',
}) {
    const set = (key, value) => onChange({ ...filters, [key]: value });

    return (
        <div className="ss-profile-asset-details">
            <h3>Asset Details</h3>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '18px 28px',
                    alignItems: 'flex-start',
                }}
            >
                <RadioGroup
                    label="System Attributes"
                    name="facing"
                    value={filters.facing}
                    onChange={(v) => set('facing', v)}
                    options={[
                        { value: 'all', label: 'All' },
                        { value: 'public', label: 'Public Facing' },
                    ]}
                />
                <RadioGroup
                    name="hosts"
                    value={filters.hosts}
                    onChange={(v) => set('hosts', v)}
                    options={[
                        { value: 'all', label: 'All Hosts' },
                        { value: 'recent', label: recentHostsLabel },
                    ]}
                />
                {showDevices ? (
                    <RadioGroup
                        name="devices"
                        value={filters.devices}
                        onChange={(v) => set('devices', v)}
                        options={[
                            { value: 'all', label: 'All Devices' },
                            { value: 'exclude_stale', label: 'Exclude Stale' },
                            { value: 'only_stale', label: 'Only Stale' },
                        ]}
                    />
                ) : null}
                <div style={{ minWidth: 160, flex: '0 1 180px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 10 }}>
                        Category
                    </div>
                    <Select
                        value={filters.category}
                        onChange={(e, { value }) => set('category', value)}
                        style={{ minWidth: 160, maxWidth: '100%' }}
                    >
                        <Select.Option label="All" value="all" />
                        <Select.Option label="Server" value="Server" />
                        <Select.Option label="Database" value="Database" />
                        <Select.Option label="Endpoint" value="Endpoint" />
                        <Select.Option label="Network" value="Network" />
                    </Select>
                </div>
                <div style={{ minWidth: 180, flex: '1 1 220px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 10 }}>
                        Search
                    </div>
                    <Text
                        value={filters.search}
                        onChange={(e, { value }) => set('search', value)}
                        placeholder="*"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
