/**
 * Day-by-hour calendar heatmap panel showing risk intensity across the week.
 */
import React, { useMemo } from 'react';

import { useRiskData } from '../hooks/useRiskData.js';
import PanelShell from './PanelShell.jsx';
import { panelShellPropsFromRiskData } from './panelShellProps.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i));

/**
 * WHAT: Computes a semi-transparent blue background color proportional to a calendar cell value.
 * WORKS WITH: CalendarHeatmap, calendar heatmap cell values.
 */
function heatColor(value, max) {
    const ratio = max > 0 ? value / max : 0;
    return `rgba(1, 65, 127, ${0.15 + ratio * 0.85})`;
}

/**
 * WHAT: Renders a 7-day by 24-hour calendar grid with color-coded risk intensity cells.
 * WORKS WITH: useRiskData, PanelShell, calendar saved search data.
 */
export default function CalendarHeatmap() {
    const riskData = useRiskData('calendar');
    const { data: cells, lastRefreshedAt } = riskData;

    const { matrix, maxVal } = useMemo(() => {
        const matrixOut = {};
        let max = 0;
        if (Array.isArray(cells)) {
            cells.forEach((c) => {
                matrixOut[`${c.rowKey}::${c.colKey}`] = c.value;
                max = Math.max(max, c.value);
            });
        }
        return { matrix: matrixOut, maxVal: max };
    }, [cells]);

    return (
        <PanelShell
            title="Calendar Heatmap"
            lastUpdated={lastRefreshedAt}
            {...panelShellPropsFromRiskData(riskData)}
        >
            <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                        <tr>
                            <th />
                            {HOURS.map((h) => (
                                <th key={h} style={{ padding: 2, minWidth: 20 }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map((day) => (
                            <tr key={day}>
                                <td style={{ padding: 2, fontWeight: 600 }}>{day}</td>
                                {HOURS.map((hour) => {
                                    const val = matrix[`${day}::${hour}`] ?? 0;
                                    return (
                                        <td
                                            key={hour}
                                            title={`${day} ${hour}:00 — ${val || '—'}`}
                                            style={{
                                                width: 20,
                                                height: 16,
                                                background: val
                                                    ? heatColor(val, maxVal)
                                                    : '#f5f5f5',
                                            }}
                                        />
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
