import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cyberRoot = path.resolve(here, '..');
const titleRoot = path.resolve(here, '../../title-details');

const apps = [
    { id: 'so_cyber_profile', root: cyberRoot },
    { id: 'so_title_details', root: titleRoot },
];

async function load(root, rel) {
    return import(pathToFileURL(path.join(root, rel)).href);
}

for (const app of apps) {
    test(`${app.id} axis charts show titles, ticks, and grid`, async () => {
        const { AXIS_CHART_OPTIONS, VIZ_PANEL_HEIGHT } = await load(
            app.root,
            'src/main/webapp/components/visualizations/chartModel.js'
        );
        assert.equal(AXIS_CHART_OPTIONS.xAxisTitleVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.yAxisTitleVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.xAxisLabelVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.yAxisLabelVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.xAxisLineVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.yAxisLineVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.xAxisMajorTickVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.yAxisMajorTickVisibility, 'show');
        assert.equal(AXIS_CHART_OPTIONS.showXMajorGridLines, true);
        assert.equal(AXIS_CHART_OPTIONS.showYMajorGridLines, true);
        assert.equal(AXIS_CHART_OPTIONS.xAxisLabelRotation, -45);
        assert.equal(VIZ_PANEL_HEIGHT, 320);
    });

    test(`${app.id} time series uses short hour labels that fit the axis`, async () => {
        const { toTimeSeriesDataSource } = await load(
            app.root,
            'src/main/webapp/components/visualizations/chartModel.js'
        );
        const times = [0, 1, 2, 13].map((hour) => new Date(Date.UTC(2026, 10, 23, hour, 0, 0)).toISOString());
        const source = toTimeSeriesDataSource([10, 20, 30, 40], times, 'count');
        const labels = source.primary.data.columns[0];
        const fields = source.primary.data.fields.map((field) => field.name);
        assert.deepEqual(fields, ['time', 'count']);
        assert.equal(labels.length, 4);
        labels.forEach((label) => {
            assert.match(label, /^\d{1,2} (AM|PM)$/);
            assert.equal(label.includes('...'), false);
            assert.ok(label.length <= 8);
        });
    });

    test(`${app.id} charts stay inside the panel and axis charts fill it`, async () => {
        const { chartIsNotClipped, axisChartFillsPanel, VIZ_PANEL_HEIGHT } = await load(
            app.root,
            'src/main/webapp/components/visualizations/chartModel.js'
        );
        const width = 421;
        assert.equal(chartIsNotClipped(width, VIZ_PANEL_HEIGHT, width, VIZ_PANEL_HEIGHT), true);
        assert.equal(axisChartFillsPanel(width, VIZ_PANEL_HEIGHT, width, VIZ_PANEL_HEIGHT), true);
        assert.equal(chartIsNotClipped(width + 8, VIZ_PANEL_HEIGHT, width, VIZ_PANEL_HEIGHT), false);
        assert.equal(chartIsNotClipped(width, VIZ_PANEL_HEIGHT + 4, width, VIZ_PANEL_HEIGHT), false);
        assert.equal(axisChartFillsPanel(width, 120, width, VIZ_PANEL_HEIGHT), false);
    });

    test(`${app.id} pie drops empty slices and single value keeps a sparkline series`, async () => {
        const { toCategoryDataSource, toSingleValueDataSource, SINGLE_VALUE_OPTIONS } = await load(
            app.root,
            'src/main/webapp/components/visualizations/chartModel.js'
        );
        const pie = toCategoryDataSource([
            { label: 'Product', value: 40 },
            { label: 'Empty', value: 0 },
            { label: '', value: 5 },
            { label: 'Services', value: 10 },
        ]);
        assert.deepEqual(pie.primary.data.columns[0], ['Product', 'Services']);
        const single = toSingleValueDataSource([93, 95], ['2026-11-23T05:00:00.000Z', '2026-11-23T06:00:00.000Z']);
        assert.equal(single.primary.data.fields[0].name, '_time');
        assert.equal(single.primary.data.columns[1].length, 2);
        assert.equal(SINGLE_VALUE_OPTIONS.sparklineDisplay, 'below');
        assert.equal(SINGLE_VALUE_OPTIONS.showSparklineAreaGraph, true);
    });

    test(`${app.id} page uses the shared panel height and Splunk sans stack`, async () => {
        const { SPLUNK_SANS, VIZ_PANEL_HEIGHT } = await load(
            app.root,
            'src/main/webapp/components/visualizations/chartModel.js'
        );
        const index = fs.readFileSync(
            path.join(app.root, 'src/main/webapp/pages/profile/index.jsx'),
            'utf8'
        );
        const styles = fs.readFileSync(
            path.join(app.root, 'src/main/webapp/pages/profile/ProfileStyles.jsx'),
            'utf8'
        );
        assert.equal(index.includes('const VIZ_HEIGHT = VIZ_PANEL_HEIGHT'), true);
        assert.equal(VIZ_PANEL_HEIGHT >= 280, true);
        assert.match(SPLUNK_SANS, /Splunk Platform Sans/);
        assert.match(SPLUNK_SANS, /Proxima Nova/);
        assert.match(SPLUNK_SANS, /Roboto/);
        assert.match(SPLUNK_SANS, /Droid/);
        assert.match(SPLUNK_SANS, /Helvetica Neue/);
        assert.match(styles, /font-family: \$\{SPLUNK_SANS\} !important/);
        assert.match(styles, /\.ss-profile-results-actions button/);
        assert.match(styles, /flex: 0 0 auto !important/);
    });

    test(`${app.id} viz tools hide empty cells and block unsafe links`, async () => {
        const links = await load(app.root, 'src/main/webapp/pages/profile/vizLinks.js');
        assert.equal(links.isSafeUrlTemplate('javascript:alert(1)'), false);
        assert.equal(links.isSafeUrlTemplate('//evil.example/x'), false);
        assert.equal(links.isSafeUrlTemplate('https://example.com/$value$'), true);
        assert.equal(links.isSafeUrlTemplate('/app/search/search'), true);

        const tools = {
            linkEarliest: '-24h',
            linkLatest: 'now',
            cells: [],
        };
        const urlCell = { label: 'Owner', value: 'SOC', url: 'https://example.com/q?v=$value$' };
        assert.equal(links.cellHref(urlCell, tools, ''), 'https://example.com/q?v=SOC');

        const searchCell = {
            label: 'Owner',
            value: 'SOC "east"',
            search: 'search index=_internal owner="$value$" | stats count',
        };
        const href = links.cellHref(searchCell, tools, '/en-US/app/so_cyber_profile/profile');
        assert.match(href, /^\/en-US\/app\/search\/search\?q=/);
        assert.match(href, /earliest=-24h/);
        assert.match(href, /latest=now/);
        assert.equal(href.includes('javascript:'), false);

        const hidden = links.visibleCells({
            showTextRow: true,
            cells: [
                { label: 'Owner', value: 'SOC' },
                { label: 'Class', value: '  ' },
            ],
        });
        assert.equal(hidden.length, 1);
        assert.equal(links.infoTextOf({ showInfo: false, infoText: 'secret' }), '');
    });

    test(`${app.id} feedback button links only the checked rows`, async () => {
        const { buildFeedbackHref } = await load(app.root, 'src/main/webapp/pages/profile/vizLinks.js');
        const href = buildFeedbackHref(app.id, [
            { id: 'a1', name: 'web-prod-01', category: 'Server' },
            { id: 'a2', name: 'db-01', category: 'Server' },
        ]);
        assert.equal(href, `/app/${app.id}/feedback?assets=${encodeURIComponent('a1,a2')}`);
    });

    test(`${app.id} live rows become chart series and text-row tools`, async () => {
        const { mapRowsToProfileFeed, mapRowsToMetricFeeds, isValidProfileFeedShape } = await load(
            app.root,
            'src/main/webapp/pages/profile/profileContract.js'
        );
        const feed = mapRowsToProfileFeed(
            [],
            [
                {
                    series: 'Tickets',
                    _time: '2026-11-23T12:00:00.000Z',
                    count: 12,
                    text1: 'Patch',
                    text1_label: 'Queue',
                    info: 'Ticket queue',
                },
                { series: 'Tickets', _time: '2026-11-23T13:00:00.000Z', count: 14 },
            ]
        );
        assert.equal(isValidProfileFeedShape(feed), true);
        assert.equal(feed.viz[0].values.length, 2);
        assert.equal(feed.viz[0].times.length, feed.viz[0].values.length);
        assert.equal(feed.viz[0].tools.cells[0].label, 'Queue');
        assert.equal(feed.viz[0].tools.cells[0].value, 'Patch');
        assert.equal(feed.viz[0].tools.infoText, 'Ticket queue');

        const metrics = mapRowsToMetricFeeds([
            { title: 'Latency', unit: 'ms', _time: '2026-11-23T12:00:00.000Z', value: 80 },
        ]);
        assert.equal(metrics.cards[0].chart, true);
        assert.equal(metrics.cards[0].feed.values[0], 80);
    });

    test(`${app.id} demo charts have matching series and labeled slices`, async () => {
        const { getProfileStandardCharts, getTopChartTools } = await load(
            app.root,
            'src/main/webapp/pages/profile/data/profileDemoFeeds.js'
        );
        const charts = getProfileStandardCharts('all');
        assert.ok(charts.pie.slices.length >= 2);
        charts.pie.slices.forEach((slice) => {
            assert.ok(slice.label);
            assert.ok(slice.value > 0);
        });
        assert.equal(charts.line.values.length, charts.line.times.length);
        assert.equal(charts.column.values.length, charts.column.times.length);
        assert.ok(charts.line.values.length >= 8);
        charts.singles.forEach((single) => {
            assert.equal(single.values.length, single.times.length);
            assert.ok(single.values.length >= 2);
        });
        const tools = getTopChartTools();
        assert.ok(tools.assets.cells.some((cell) => String(cell.value).trim()));
        assert.ok(tools.high.infoText);
        assert.ok(tools.critical.infoText);
    });
}
