import React from 'react';
import { createRoot } from 'react-dom/client';

import LineChart from '../../src/main/webapp/components/visualizations/LineChart.jsx';

/** Fixed series (deterministic tooltip text across locales uses digits + % ). */
const values = Array.from({ length: 20 }, (_, i) => 28 + ((i * 13) % 52));
const times = values.map((_, i) =>
    new Date(Date.UTC(2026, 4, 15, 17, i, 0)).toISOString()
);

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

const rootEl = document.getElementById('root');
createRoot(rootEl).render(
    <div data-testid="hover-chart-host" style={{ padding: 12, background: '#1a1a1a' }}>
        <LineChart
            {...palette}
            background={palette.badColor}
            values={values}
            times={times}
            width={480}
            height={200}
            min={0}
            max={100}
            stroke="#FFFFFF"
            showMajor={false}
            showHover
            drilldown={false}
            unit="%"
        />
    </div>
);
