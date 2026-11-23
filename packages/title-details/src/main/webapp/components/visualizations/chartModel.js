/** Shared Splunk chart model. No React imports so unit tests can load it directly. */

export const SPLUNK_SANS =
    "'Splunk Platform Sans', 'Proxima Nova', Roboto, Droid, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Panel height that fits axis titles, rotated hour labels, and the plot. */
export const VIZ_PANEL_HEIGHT = 320;

export const AXIS_CHART_OPTIONS = {
    backgroundColor: 'transparent',
    legendDisplay: 'off',
    xAxisTitleVisibility: 'show',
    yAxisTitleVisibility: 'show',
    xAxisTitleText: 'Time',
    yAxisTitleText: 'Value',
    xAxisLabelVisibility: 'show',
    yAxisLabelVisibility: 'show',
    xAxisLabelRotation: -45,
    xAxisMaxLabelParts: 2,
    xAxisLineVisibility: 'show',
    yAxisLineVisibility: 'show',
    xAxisMajorTickVisibility: 'show',
    yAxisMajorTickVisibility: 'show',
    showXMajorGridLines: true,
    showYMajorGridLines: true,
    showYMinorGridLines: false,
    yAxisAbbreviation: 'auto',
    nullValueDisplay: 'connect',
    dataValuesDisplay: 'off',
    lineWidth: 2,
    seriesColors: ['#5B9BD5'],
};

export const PIE_CHART_OPTIONS = {
    backgroundColor: 'transparent',
    labelDisplay: 'valuesAndPercent',
    collapseThreshold: 0.01,
};

export const SINGLE_VALUE_OPTIONS = {
    backgroundColor: 'transparent',
    majorColor: '#FFFFFF',
    trendColor: '#FFFFFF',
    trendDisplay: 'absolute',
    sparklineDisplay: 'below',
    sparklineStrokeColor: '#FFFFFF',
    sparklineAreaColor: '#7EB6E8',
    showSparklineAreaGraph: true,
    showSparklineTooltip: true,
    sparklineHighlightDots: 1,
    sparklineHighlightSegments: 0,
    sparklineNullValueDisplay: 'connect',
};

/** Turns a timestamp into a short hour label such as "1 AM" so axis text fits the panel. Works with toTimeSeriesDataSource and Area/Column charts. */
export function axisTimeLabel(rawT, index) {
    const parsed = typeof rawT === 'string' ? Date.parse(rawT) : Number(rawT);
    const ms = Number.isFinite(parsed) && parsed > 1e12 ? parsed : parsed * 1000;
    if (!Number.isFinite(ms) || ms <= 0) {
        return String(index);
    }
    return new Date(ms).toLocaleString(undefined, {
        hour: 'numeric',
    });
}

/** Builds a Splunk SingleValue data source with `_time` and `count`. Works with StandardSingleValueChart sparklines. */
export function toSingleValueDataSource(values = [], times = []) {
    const colsT = [];
    const colsV = [];
    const len = Math.min(
        Array.isArray(values) ? values.length : 0,
        Array.isArray(times) ? times.length : 0
    );
    for (let i = 0; i < len; i += 1) {
        const rawT = times[i];
        const parsed = typeof rawT === 'string' ? Date.parse(rawT) : Number(rawT);
        const t = Number.isFinite(parsed) && parsed > 0 && parsed < 1e12 ? parsed * 1000 : parsed;
        const v = Number(values[i]);
        if (Number.isFinite(t) && Number.isFinite(v)) {
            colsT.push(t);
            colsV.push(v);
        }
    }
    return {
        primary: {
            requestParams: { offset: 0, count: colsT.length || 10000 },
            data: {
                columns: [colsT, colsV],
                fields: [{ name: '_time' }, { name: 'count' }],
            },
            meta: { totalCount: colsT.length },
        },
    };
}

/** Builds a category time series (`time` plus a value field) for axis charts. Works with StandardLineChart and StandardColumnChart. */
export function toTimeSeriesDataSource(values = [], times = [], valueName = 'count') {
    const colsX = [];
    const colsV = [];
    const len = Math.min(
        Array.isArray(values) ? values.length : 0,
        Array.isArray(times) ? times.length : 0
    );
    for (let i = 0; i < len; i += 1) {
        const v = Number(values[i]);
        if (!Number.isFinite(v)) {
            continue;
        }
        colsX.push(axisTimeLabel(times[i], i));
        colsV.push(v);
    }
    return {
        primary: {
            requestParams: { offset: 0, count: colsX.length || 10000 },
            data: {
                columns: [colsX, colsV],
                fields: [{ name: 'time' }, { name: valueName }],
            },
            meta: { totalCount: colsX.length },
        },
    };
}

/** Builds pie slices from positive labeled values and drops empty ones. Works with StandardPieChart. */
export function toCategoryDataSource(slices = []) {
    const labels = [];
    const values = [];
    (Array.isArray(slices) ? slices : []).forEach((slice) => {
        const label = String(slice?.label ?? '');
        const value = Number(slice?.value);
        if (label && Number.isFinite(value) && value > 0) {
            labels.push(label);
            values.push(value);
        }
    });
    return {
        primary: {
            requestParams: { offset: 0, count: labels.length || 10000 },
            data: {
                columns: [labels, values],
                fields: [{ name: 'label' }, { name: 'value' }],
            },
            meta: { totalCount: labels.length },
        },
    };
}

/** True when the drawn SVG stays inside the panel. Works with visualization unit tests and panel sizing. */
export function chartIsNotClipped(svgWidth, svgHeight, panelWidth, panelHeight) {
    return (
        svgWidth > 0 &&
        svgHeight > 0 &&
        svgWidth <= panelWidth + 1 &&
        svgHeight <= panelHeight + 1
    );
}

/** True when an axis chart fills the panel without extending past it. Works with Area and Column charts inside VizPanel. */
export function axisChartFillsPanel(svgWidth, svgHeight, panelWidth, panelHeight) {
    if (!chartIsNotClipped(svgWidth, svgHeight, panelWidth, panelHeight)) return false;
    return svgWidth >= panelWidth * 0.95 && svgHeight >= panelHeight * 0.95;
}
