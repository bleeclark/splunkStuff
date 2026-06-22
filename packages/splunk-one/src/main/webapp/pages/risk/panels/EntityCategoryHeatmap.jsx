import React, { useMemo } from 'react';

import { useRiskData } from '../hooks/useRiskData.js';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';

function heatColor(value, max) {
    const ratio = max > 0 ? value / max : 0;
    const r = Math.round(255 * ratio);
    const g = Math.round(200 * (1 - ratio));
    return `rgb(${r},${g},80)`;
}

export default function EntityCategoryHeatmap() {
    const riskData = useRiskData('heatmap');
    const { data: cells, lastRefreshedAt } = riskData;
    const { setEntityFocus } = useDashboardFilters();

    const { rows, cols, matrix, maxVal } = useMemo(() => {
        if (!Array.isArray(cells) || !cells.length) {
            return { rows: [], cols: [], matrix: {}, maxVal: 1 };
        }
        const rowsOut = [...new Set(cells.map((c) => c.rowKey))];
        const colsOut = [...new Set(cells.map((c) => c.colKey))];
        const matrixOut = {};
        let max = 0;
        cells.forEach((c) => {
            matrixOut[`${c.rowKey}::${c.colKey}`] = c;
            max = Math.max(max, c.value);
        });
        return { rows: rowsOut, cols: colsOut, matrix: matrixOut, maxVal: max };
    }, [cells]);

    const shellProps = panelShellPropsFromRiskData(riskData);

    return (
        <PanelShell
            title="Entity × Category Heatmap"
            lastUpdated={lastRefreshedAt}
            {...shellProps}
            emptyState={
                shellProps.emptyState ||
                (!rows.length ? 'No heatmap data for selected filters' : undefined)
            }
        >
            <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr>
                            <th style={{ padding: 4 }}>Entity</th>
                            {cols.map((col) => (
                                <th key={col} style={{ padding: 4 }}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row}>
                                <td style={{ padding: 4, fontWeight: 600 }}>{row}</td>
                                {cols.map((col) => {
                                    const cell = matrix[`${row}::${col}`];
                                    const val = cell?.value ?? 0;
                                    return (
                                        <td key={col} style={{ padding: 2 }}>
                                            <button
                                                type="button"
                                                title={`${row} / ${col}: ${val}`}
                                                style={{
                                                    width: 48,
                                                    height: 32,
                                                    border: 'none',
                                                    borderRadius: 2,
                                                    cursor: cell ? 'pointer' : 'default',
                                                    background: cell
                                                        ? heatColor(val, maxVal)
                                                        : '#f5f5f5',
                                                    color: val > maxVal * 0.6 ? '#fff' : '#333',
                                                    fontSize: 11,
                                                }}
                                                onClick={() => {
                                                    if (cell?.entityIds?.[0]) {
                                                        setEntityFocus(cell.entityIds[0]);
                                                        document
                                                            .getElementById('risk-anomaly-table')
                                                            ?.scrollIntoView({ behavior: 'smooth' });
                                                    }
                                                }}
                                            >
                                                {cell ? val : '—'}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PanelShell>
    );
}
