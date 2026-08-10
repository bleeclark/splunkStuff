/**
 * Local browser harness for splunkstuff_kpi_sparkline_studio.
 * Renders multiple layout scenarios using the same render path as production.
 */
import { parsePrimarySearchData } from '../../visualizations/splunkstuff_kpi_sparkline_studio/src/lib/parsePrimaryData.js';
import { resolveOptions } from '../../visualizations/splunkstuff_kpi_sparkline_studio/src/lib/resolveOptions.js';
import { renderKpiSparklineTile } from '../../visualizations/splunkstuff_kpi_sparkline_studio/src/lib/renderTile.js';

function buildSampleSearchData() {
    const times = [];
    const values = [];
    const now = Date.now() / 1000;
    for (let index = 0; index < 20; index += 1) {
        times.push(now - (19 - index) * 60);
        values.push(40 + index + Math.sin(index / 2) * 1.5);
    }
    return {
        fields: ['_time', 'value'],
        columns: [times, values],
    };
}

const scenarios = [
    {
        id: 'stacked-center',
        title: 'Stacked / Center (default)',
        width: 360,
        height: 200,
        options: {
            backgroundColor: '#DFA611',
            goodColor: '#DFA611',
            badColor: '#01417F',
            textColor: '#FFFFFF',
            trendDisplay: 'percent',
        },
    },
    {
        id: 'inline-left',
        title: 'Inline / Left + subheader',
        width: 520,
        height: 200,
        options: {
            headlineLayout: 'inline',
            align: 'left',
            subheader: 'Total Risk Score',
            subheaderStyle: 'matchTile',
            backgroundColor: '#DFA611',
            goodColor: '#DFA611',
            badColor: '#01417F',
            textColor: '#FFFFFF',
            trendDisplay: 'percent',
            underLabel: 'Score',
            labelPosition: 'above',
        },
    },
    {
        id: 'inline-wide',
        title: 'Inline / wide panel (sparkline should span full width)',
        width: 900,
        height: 220,
        options: {
            headlineLayout: 'inline',
            align: 'center',
            sparkEdgeToEdge: true,
            backgroundColor: '#DFA611',
            goodColor: '#DFA611',
            badColor: '#01417F',
            textColor: '#FFFFFF',
            trendDisplay: 'percent',
        },
    },
    {
        id: 'label-right',
        title: 'Label position: right of value',
        width: 420,
        height: 200,
        options: {
            headlineLayout: 'inline',
            labelPosition: 'right',
            underLabel: 'Score',
            backgroundColor: '#0B1F3B',
            goodColor: '#01417F',
            badColor: '#DFA611',
            textColor: '#FFFFFF',
            trendDisplay: 'absolute',
        },
    },
];

const searchData = buildSampleSearchData();
const mountRoot = document.getElementById('harness-root');
const diagnosticsRoot = document.getElementById('harness-diagnostics');

if (!mountRoot) {
    throw new Error('Missing #harness-root');
}

const sharedHover = { cleanupHandlers: [], tooltipElement: null };
const diagnosticRows = [];

scenarios.forEach((scenario) => {
    const panel = document.createElement('section');
    panel.className = 'harness-panel';
    panel.dataset.scenarioId = scenario.id;

    const heading = document.createElement('h2');
    heading.textContent = `${scenario.title} (${scenario.width}×${scenario.height}px)`;
    panel.appendChild(heading);

    const tileHost = document.createElement('div');
    tileHost.className = 'harness-tile-host';
    tileHost.style.width = `${scenario.width}px`;
    tileHost.style.height = `${scenario.height}px`;
    panel.appendChild(tileHost);

    const resolvedOptions = resolveOptions(scenario.options);
    const parsedData = parsePrimarySearchData(searchData, resolvedOptions);
    renderKpiSparklineTile(tileHost, parsedData.primary, resolvedOptions, document, sharedHover);

    const tileRoot = tileHost.querySelector('.bgdhamp-sparkline-value-viz');
    mountRoot.appendChild(panel);
});

function collectDiagnostics() {
    scenarios.forEach((scenario) => {
        const panel = mountRoot.querySelector(`[data-scenario-id="${scenario.id}"]`);
        if (!panel) {
            return;
        }
        const tileHost = panel.querySelector('.harness-tile-host');
        const tileRoot = tileHost ? tileHost.querySelector('.bgdhamp-sparkline-value-viz') : null;
        const headlineRow = tileHost ? tileHost.querySelector('.bgdhamp-sparkline-value-viz__headlineRow') : null;
        const sparkContainer = tileHost ? tileHost.querySelector('.bgdhamp-sparkline-value-viz__spark') : null;
        const sparkSvg = sparkContainer ? sparkContainer.querySelector('svg') : null;
        const headlineClass = headlineRow ? headlineRow.className : '(missing)';
        const containerWidth = sparkContainer ? Math.round(sparkContainer.getBoundingClientRect().width) : 0;
        const svgWidth = sparkSvg ? Number(sparkSvg.getAttribute('width') || 0) : 0;
        const widthMatch = containerWidth > 0 && Math.abs(containerWidth - svgWidth) <= 2;
        diagnosticRows.push({
            scenario: scenario.title,
            headlineClass,
            containerWidth,
            svgWidth,
            widthMatch,
            build: tileRoot ? tileRoot.getAttribute('data-bgdhamp-viz-build') : '',
        });
    });
}

requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        setTimeout(() => {
            collectDiagnostics();
        if (diagnosticsRoot) {
            const table = document.createElement('table');
            table.innerHTML = `
        <thead>
            <tr>
                <th>Scenario</th>
                <th>Headline classes</th>
                <th>Spark container px</th>
                <th>SVG width px</th>
                <th>Width match</th>
                <th>Build</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
            const tbody = table.querySelector('tbody');
            diagnosticRows.forEach((row) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td>${row.scenario}</td>
            <td><code>${row.headlineClass}</code></td>
            <td>${row.containerWidth}</td>
            <td>${row.svgWidth}</td>
            <td class="${row.widthMatch ? 'ok' : 'warn'}">${row.widthMatch ? 'yes' : 'NO'}</td>
            <td><code>${row.build || 'n/a'}</code></td>
        `;
                tbody.appendChild(tr);
            });
            diagnosticsRoot.appendChild(table);
        }
        document.body.dataset.harnessReady = 'true';
        }, 120);
    });
});
