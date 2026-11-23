import React from 'react';
import Select from '@splunk/react-ui/Select';

import { FilterLabel } from '../ProfileStyles';
import { ENTITY_OPTIONS } from '../data/cybersecurityDemoFeeds';

/** Entity dropdown for profile drilldowns. Works with ENTITY_OPTIONS and FilterLabel. */
export default function EntityFilterBar({ entity, onEntityChange }) {
    return (
        <div className="ss-profile-entity-bar">
            <div style={{ minWidth: 200, flex: '1 1 280px', maxWidth: 360 }}>
                <FilterLabel>Select an Entity</FilterLabel>
                <div style={{ marginTop: 6 }}>
                    <Select
                        value={entity}
                        onChange={(e, { value }) => onEntityChange(value)}
                        style={{ minWidth: 200, maxWidth: '100%' }}
                    >
                        {ENTITY_OPTIONS.map((opt) => (
                            <Select.Option
                                key={opt.value || 'empty'}
                                label={opt.label}
                                value={opt.value}
                            />
                        ))}
                    </Select>
                </div>
            </div>
        </div>
    );
}
