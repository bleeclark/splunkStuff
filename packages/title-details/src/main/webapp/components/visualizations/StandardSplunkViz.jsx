import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Area from '@splunk/visualizations/Area';
import Pie from '@splunk/visualizations/Pie';
import Column from '@splunk/visualizations/Column';
import SingleValue from '@splunk/visualizations/SingleValue';

import { useContainerSize } from '../../hooks/useContainerSize';

const AXIS_CHART_OPTIONS = {
    backgroundColor: 'transparent',
    legendDisplay: 'off',
    xAxisTitleVisibility: 'show',
    yAxisTitleVisibility: 'show',
    xAxisTitleText: 'Time',
    yAxisTitleText: 'Value',
    xAxisLabelVisibility: 'show',
    yAxisLabelVisibility: 'show',
    showXMajorGridLines: true,
    showYMajorGridLines: true,
    showYMinorGridLines: false,
    lineWidth: 2,
    seriesColors: ['#5B9BD5'],
};

const PIE_CHART_OPTIONS = {
    backgroundColor: 'transparent',
    labelDisplay: 'valuesAndPercent',
    collapseThreshold: 0.01,
};

// SingleValue sparkline options (correct @splunk/visualizations names).
// Area fill uses sparklineAreaColor × internal fillOpacity (~0.2).
const SINGLE_VALUE_OPTIONS = {
    backgroundColor: 'transparent',
    majorColor: '#FFFFFF',
    trendColor: '#FFFFFF',
    sparklineDisplay: 'below',
    sparklineStrokeColor: '#FFFFFF',
    sparklineAreaColor: '#7EB6E8',
    showSparklineAreaGraph: true,
    showSparklineTooltip: true,
    sparklineHighlightDots: 1,
    sparklineHighlightSegments: 0,
    sparklineNullValueDisplay: 'connect',
};

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

function timeLabel(rawT, index) {
    const parsed = typeof rawT === 'string' ? Date.parse(rawT) : Number(rawT);
    const ms = Number.isFinite(parsed) && parsed > 1e12 ? parsed : parsed * 1000;
    if (!Number.isFinite(ms) || ms <= 0) {
        return String(index);
    }
    return new Date(ms).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

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
        colsX.push(timeLabel(times[i], i));
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

function ChartHost({ children, defaultHeight }) {
    const { hostRef, width, height } = useContainerSize({
        minWidth: 160,
        minHeight: 96,
        defaultWidth: 420,
        defaultHeight,
    });
    return (
        <div
            className="ss-profile-standard-viz"
            ref={hostRef}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
            {children(width, height || defaultHeight)}
        </div>
    );
}

ChartHost.propTypes = {
    children: PropTypes.func.isRequired,
    defaultHeight: PropTypes.number,
};

ChartHost.defaultProps = {
    defaultHeight: 200,
};

export function StandardPieChart({ slices, panelHeight = 200 }) {
    const dataSources = useMemo(() => toCategoryDataSource(slices), [slices]);
    return (
        <ChartHost defaultHeight={panelHeight}>
            {(width, height) => (
                <Pie width={width} height={height} dataSources={dataSources} options={PIE_CHART_OPTIONS} />
            )}
        </ChartHost>
    );
}

StandardPieChart.propTypes = {
    slices: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
        })
    ),
    panelHeight: PropTypes.number,
};

StandardPieChart.defaultProps = {
    slices: [],
    panelHeight: 200,
};

export function StandardLineChart({
    values,
    times,
    panelHeight = 200,
    xAxisTitle = 'Time',
    yAxisTitle = 'Value',
}) {
    const dataSources = useMemo(
        () => toTimeSeriesDataSource(values, times),
        [values, times]
    );
    const options = useMemo(
        () => ({
            ...AXIS_CHART_OPTIONS,
            xAxisTitleText: xAxisTitle,
            yAxisTitleText: yAxisTitle,
        }),
        [xAxisTitle, yAxisTitle]
    );
    return (
        <ChartHost defaultHeight={panelHeight}>
            {(width, height) => (
                <Area
                    width={width}
                    height={height}
                    dataSources={dataSources}
                    options={options}
                />
            )}
        </ChartHost>
    );
}

StandardLineChart.propTypes = {
    values: PropTypes.arrayOf(PropTypes.number),
    times: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    panelHeight: PropTypes.number,
    xAxisTitle: PropTypes.string,
    yAxisTitle: PropTypes.string,
};

StandardLineChart.defaultProps = {
    values: [],
    times: [],
    panelHeight: 200,
    xAxisTitle: 'Time',
    yAxisTitle: 'Value',
};

export function StandardColumnChart({
    values,
    times,
    panelHeight = 200,
    xAxisTitle = 'Time',
    yAxisTitle = 'Value',
}) {
    const dataSources = useMemo(
        () => toTimeSeriesDataSource(values, times, 'tickets'),
        [values, times]
    );
    const options = useMemo(
        () => ({
            ...AXIS_CHART_OPTIONS,
            xAxisTitleText: xAxisTitle,
            yAxisTitleText: yAxisTitle,
        }),
        [xAxisTitle, yAxisTitle]
    );
    return (
        <ChartHost defaultHeight={panelHeight}>
            {(width, height) => (
                <Column
                    width={width}
                    height={height}
                    dataSources={dataSources}
                    options={options}
                />
            )}
        </ChartHost>
    );
}

StandardColumnChart.propTypes = {
    values: PropTypes.arrayOf(PropTypes.number),
    times: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    panelHeight: PropTypes.number,
    xAxisTitle: PropTypes.string,
    yAxisTitle: PropTypes.string,
};

StandardColumnChart.defaultProps = {
    values: [],
    times: [],
    panelHeight: 200,
    xAxisTitle: 'Time',
    yAxisTitle: 'Value',
};

export function StandardSingleValueChart({
    values,
    times,
    unit = '',
    panelHeight = 200,
    sparklineDisplay = 'below',
    sparklineStrokeColor = '#FFFFFF',
    sparklineAreaColor = '#7EB6E8',
    showSparklineAreaGraph = true,
    showSparklineTooltip = true,
    sparklineHighlightDots = 1,
    sparklineHighlightSegments = 0,
    sparklineNullValueDisplay = 'connect',
}) {
    const dataSources = useMemo(() => toSingleValueDataSource(values, times), [values, times]);
    const options = useMemo(
        () => ({
            ...SINGLE_VALUE_OPTIONS,
            unit: unit || '',
            sparklineDisplay,
            sparklineStrokeColor,
            sparklineAreaColor,
            showSparklineAreaGraph,
            showSparklineTooltip,
            sparklineHighlightDots,
            sparklineHighlightSegments,
            sparklineNullValueDisplay,
        }),
        [
            unit,
            sparklineDisplay,
            sparklineStrokeColor,
            sparklineAreaColor,
            showSparklineAreaGraph,
            showSparklineTooltip,
            sparklineHighlightDots,
            sparklineHighlightSegments,
            sparklineNullValueDisplay,
        ]
    );
    return (
        <ChartHost defaultHeight={panelHeight}>
            {(width, height) => (
                <SingleValue
                    width={width}
                    height={height}
                    dataSources={dataSources}
                    options={options}
                />
            )}
        </ChartHost>
    );
}

StandardSingleValueChart.propTypes = {
    values: PropTypes.arrayOf(PropTypes.number),
    times: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    unit: PropTypes.string,
    panelHeight: PropTypes.number,
    sparklineDisplay: PropTypes.oneOf(['below', 'before', 'after', 'off']),
    sparklineStrokeColor: PropTypes.string,
    sparklineAreaColor: PropTypes.string,
    showSparklineAreaGraph: PropTypes.bool,
    showSparklineTooltip: PropTypes.bool,
    sparklineHighlightDots: PropTypes.number,
    sparklineHighlightSegments: PropTypes.number,
    sparklineNullValueDisplay: PropTypes.oneOf(['gaps', 'zero', 'connect']),
};

StandardSingleValueChart.defaultProps = {
    values: [],
    times: [],
    unit: '',
    panelHeight: 200,
    sparklineDisplay: 'below',
    sparklineStrokeColor: '#FFFFFF',
    sparklineAreaColor: '#7EB6E8',
    showSparklineAreaGraph: true,
    showSparklineTooltip: true,
    sparklineHighlightDots: 1,
    sparklineHighlightSegments: 0,
    sparklineNullValueDisplay: 'connect',
};
