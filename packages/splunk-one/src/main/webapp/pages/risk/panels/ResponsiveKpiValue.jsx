/**
 * Container-aware wrapper around NewSingleValue for responsive KPI sparkline tiles.
 */
import React from 'react';
import PropTypes from 'prop-types';

import NewSingleValue from '../../../components/visualizations/NewSingleValue';
import { useContainerSize } from '../hooks/useContainerSize.js';

/**
 * WHAT: Measures its host div and passes the live width to NewSingleValue for fluid KPI rendering.
 * WORKS WITH: useContainerSize, NewSingleValue, KpiTile, KPI_WIDGET_COMMON.
 */
export default function ResponsiveKpiValue({ height = 150, ...rest }) {
    const { hostRef, width } = useContainerSize({
        minWidth: 120,
        minHeight: height,
        defaultWidth: 400,
        defaultHeight: height,
    });

    return (
        <div
            ref={hostRef}
            style={{
                width: '100%',
                height,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <NewSingleValue width={width} height={height} {...rest} />
        </div>
    );
}

ResponsiveKpiValue.propTypes = {
    height: PropTypes.number,
    feed: PropTypes.object,
};
