import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Area from '@splunk/visualizations/Area';
import Pie from '@splunk/visualizations/Pie';
import Column from '@splunk/visualizations/Column';
import SingleValue from '@splunk/visualizations/SingleValue';

import { useContainerSize } from '../../hooks/useContainerSize';
import {
    AXIS_CHART_OPTIONS,
    PIE_CHART_OPTIONS,
    SINGLE_VALUE_OPTIONS,
    toCategoryDataSource,
    toSingleValueDataSource,
    toTimeSeriesDataSource,
} from './chartModel';

export {
    AXIS_CHART_OPTIONS,
    PIE_CHART_OPTIONS,
    SINGLE_VALUE_OPTIONS,
    toCategoryDataSource,
    toSingleValueDataSource,
    toTimeSeriesDataSource,
} from './chartModel';

/** Measures the panel and passes pixel width and height to a Splunk visualization. Works with useContainerSize and the standard charts. */
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

/** Renders a Splunk Pie chart that fills its panel. Works with VizCard, profile pie data, and PIE_CHART_OPTIONS. */
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

/** Renders a Splunk Area chart with time and value axes. Works with profile, metric, and drilldown series. */
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

/** Renders a Splunk Column chart with time and value axes. Works with the Tickets panel and column demo series. */
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

/** Renders a Splunk SingleValue with a sparkline under the number. Works with Critical Patches and the single-value row. */
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
