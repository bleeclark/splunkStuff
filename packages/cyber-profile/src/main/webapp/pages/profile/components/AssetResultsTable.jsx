import React from 'react';
import Button from '@splunk/react-ui/Button';

import { MUTED } from '../ProfileStyles';

export function buildFeedbackHref(selectedRows) {
    const payload = selectedRows.map((r) => ({ id: r.id, name: r.name, category: r.category }));
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('ss_profile_feedback_assets', JSON.stringify(payload));
        }
    } catch (e) {
        // ignore
    }
    const ids = payload.map((p) => p.id).join(',');
    return `/app/so_cyber_profile/feedback?assets=${encodeURIComponent(ids)}`;
}

export default function AssetResultsTable({
    active,
    rows,
    selectedIds,
    onToggleRow,
    onToggleAll,
}) {
    const selectedRows = rows.filter((r) => selectedIds.includes(r.id));
    const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));

    return (
        <div style={{ marginTop: 14 }}>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 10,
                }}
            >
                <Button
                    label="Provide Feedback on Checked Items"
                    appearance="primary"
                    disabled={selectedRows.length === 0}
                    to={selectedRows.length ? buildFeedbackHref(selectedRows) : undefined}
                />
                <span style={{ color: MUTED, fontSize: 13 }}>
                    Current Number of Selected Items: {selectedRows.length}
                </span>
            </div>

            <div
                style={{
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.15)',
                    minHeight: 120,
                }}
            >
                {!active ? (
                    <div className="ss-profile-results-empty">
                        Select Asset Details filters or enter a search to populate results.
                    </div>
                ) : rows.length === 0 ? (
                    <div className="ss-profile-results-empty">No results found.</div>
                ) : (
                    <table className="ss-profile-results-table">
                        <thead>
                            <tr>
                                <th style={{ width: 36 }}>
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={(e) => onToggleAll(e.target.checked)}
                                        aria-label="Select all rows"
                                    />
                                </th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Entity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(row.id)}
                                            onChange={() => onToggleRow(row.id)}
                                            aria-label={`Select ${row.name}`}
                                        />
                                    </td>
                                    <td>{row.name}</td>
                                    <td>{row.category}</td>
                                    <td>{row.entity}</td>
                                    <td>{row.stale ? 'Stale' : 'Active'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
