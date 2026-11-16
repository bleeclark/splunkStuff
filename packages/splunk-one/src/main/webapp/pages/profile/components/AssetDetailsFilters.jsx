import React from 'react';
import Select from '@splunk/react-ui/Select';
import Text from '@splunk/react-ui/Text';
import Button from '@splunk/react-ui/Button';

import { MUTED } from '../ProfileStyles';

function ChoiceGroup({ label, value, options, onChange }) {
    return (
        <div style={{ minWidth: 140 }}>
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: MUTED,
                    marginBottom: 8,
                }}
            >
                {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                {options.map((opt) => (
                    <Button
                        key={opt.value}
                        label={opt.label}
                        appearance={value === opt.value ? 'primary' : 'secondary'}
                        onClick={() => onChange(opt.value)}
                    />
                ))}
            </div>
        </div>
    );
}

export default function AssetDetailsFilters({ filters, onChange }) {
    const set = (key, value) => onChange({ ...filters, [key]: value });

    return (
        <div className="ss-profile-asset-details">
            <h3>Asset Details</h3>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 20,
                    alignItems: 'flex-start',
                }}
            >
                <ChoiceGroup
                    label="System Attributes"
                    value={filters.facing}
                    onChange={(v) => set('facing', v)}
                    options={[
                        { value: 'all', label: 'All' },
                        { value: 'public', label: 'Public Facing' },
                    ]}
                />
                <ChoiceGroup
                    label="Hosts"
                    value={filters.hosts}
                    onChange={(v) => set('hosts', v)}
                    options={[
                        { value: 'all', label: 'All Hosts' },
                        { value: 'recent', label: 'Recently Added (-7d)' },
                    ]}
                />
                <ChoiceGroup
                    label="Devices"
                    value={filters.devices}
                    onChange={(v) => set('devices', v)}
                    options={[
                        { value: 'all', label: 'All Devices' },
                        { value: 'exclude_stale', label: 'Exclude Stale' },
                        { value: 'only_stale', label: 'Only Stale' },
                    ]}
                />
                <div style={{ minWidth: 160, flex: '1 1 160px' }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: MUTED,
                            marginBottom: 8,
                        }}
                    >
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
                <div style={{ minWidth: 180, flex: '1 1 200px' }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: MUTED,
                            marginBottom: 8,
                        }}
                    >
                        Search
                    </div>
                    <Text
                        value={filters.search}
                        onChange={(e, { value }) => set('search', value)}
                        placeholder="Host name…"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
