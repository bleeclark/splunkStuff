import React, { useEffect, useMemo, useRef, useState } from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Button from '@splunk/react-ui/Button';
import Modal from '@splunk/react-ui/Modal';
import Paragraph from '@splunk/react-ui/Paragraph';
import Select from '@splunk/react-ui/Select';

import {
    assetFiltersActive,
    filterDemoAssets,
    ENTITY_OPTIONS,
} from './data/cybersecurityDemoFeeds';
import HighPatchesVizLayout from './components/HighPatchesVizLayout';
import AssetDetailsFilters from './components/AssetDetailsFilters';
import AssetResultsTable from './components/AssetResultsTable';
import {
    Page,
    PageHeader,
    FilterLabel,
    PAGE_BLUE,
    PANEL_BLUE,
    profileModalStyle,
} from './ProfileStyles';

const PROFILE_URL = '/app/so_title_details/profile';

const DEFAULT_ASSET_FILTERS = {
    facing: 'all',
    hosts: 'all',
    devices: 'all',
    category: 'all',
    search: '',
};

function HighPatchesApp() {
    const [entity, setEntity] = useState('');
    const [filters, setFilters] = useState(DEFAULT_ASSET_FILTERS);
    const [selectedIds, setSelectedIds] = useState([]);
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const instructionsRef = useRef(null);

    const filterState = useMemo(
        () => ({
            ...filters,
            entity,
            mode: 'endpoints',
        }),
        [filters, entity]
    );

    const tableActive = Boolean(entity) && assetFiltersActive(filters);
    const rows = useMemo(
        () => (tableActive ? filterDemoAssets(filterState) : []),
        [tableActive, filterState]
    );

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => rows.some((r) => r.id === id)));
    }, [rows]);

    return (
        <Page>
            <PageHeader title="Title Details" />

            <div className="ss-profile-entity-bar">
                <div style={{ minWidth: 200, flex: '1 1 240px', maxWidth: 340 }}>
                    <FilterLabel>Select an Entity</FilterLabel>
                    <div style={{ marginTop: 6 }}>
                        <Select
                            value={entity}
                            onChange={(e, { value }) => setEntity(value)}
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
                <div className="ss-profile-mode-tabs">
                    <Button label="All Endpoints" appearance="primary" onClick={() => {}} />
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <Button label="Back to Profile" appearance="secondary" to={PROFILE_URL} />
                </div>
            </div>

            <div className="ss-profile-instruction-btn" style={{ marginBottom: 14 }}>
                <Button
                    elementRef={instructionsRef}
                    label="Vulnerability Management Instructions"
                    appearance="secondary"
                    onClick={() => setInstructionsOpen(true)}
                />
            </div>

            <HighPatchesVizLayout zeroed={!entity} />

            <AssetDetailsFilters
                filters={filters}
                onChange={setFilters}
                showDevices={false}
            />

            <AssetResultsTable
                active={tableActive}
                rows={rows}
                selectedIds={selectedIds}
                onToggleRow={(id) =>
                    setSelectedIds((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    )
                }
                onToggleAll={(on) => setSelectedIds(on ? rows.map((r) => r.id) : [])}
            />

            <Modal
                open={instructionsOpen}
                returnFocus={instructionsRef}
                onRequestClose={() => setInstructionsOpen(false)}
                style={profileModalStyle}
            >
                <Modal.Header title="Vulnerability Management Instructions" />
                <Modal.Body>
                    <Paragraph>
                        Pick an entity, then use Asset Details filters to focus inventory related to
                        high patches. Left panels show Assets / High Patches / Critical Patches
                        KPIs.
                    </Paragraph>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        label="Close"
                        onClick={() => setInstructionsOpen(false)}
                    />
                </Modal.Footer>
            </Modal>
        </Page>
    );
}

export function mountHighPatchesPage() {
    getUserTheme()
        .then((theme) => {
            const themed = {
                ...theme,
                backgroundColorPage: PAGE_BLUE,
                backgroundColorSection: PAGE_BLUE,
                backgroundColorPopup: PANEL_BLUE,
                contentColorDefault: '#FFFFFF',
                contentColorActive: '#FFFFFF',
                colorText: '#FFFFFF',
                colorTextDefault: '#FFFFFF',
                interactiveColorText: '#FFFFFF',
            };
            layout(<HighPatchesApp />, { theme: themed });
        })
        .catch((e) => {
            const errorEl = document.createElement('span');
            errorEl.textContent = String(e);
            document.body.appendChild(errorEl);
        });
}
