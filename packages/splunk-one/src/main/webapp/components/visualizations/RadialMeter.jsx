import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    WIDTH,
    HEIGHT,
    buildRadialMeterPaths,
} from '../../lib/radialMeterArc.mjs';

/**
 * Radial meter — React demo of Splunk 9.4 custom viz tutorial (radial_meter AMD viz).
 */
export default function RadialMeter({
    value = 73,
    maxValue = 100,
    mainColor = '#f7bc38',
    backgroundColor = '#ffffff',
    width = 220,
    height = 220,
}) {
    const paths = useMemo(
        () => buildRadialMeterPaths(value, maxValue),
        [value, maxValue]
    );

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ background: backgroundColor, display: 'block', margin: 'auto' }}
            role="img"
            aria-label="Radial meter"
        >
            <g transform={`translate(${WIDTH / 2}, ${HEIGHT / 2})`}>
                <path d={paths.track} fill="#d3d3d3" />
                <path d={paths.fill} fill={mainColor} />
                <text
                    className="meter-center-text"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={mainColor}
                    x={0}
                    y={20}
                    style={{
                        fontSize: 40,
                        fontWeight: 200,
                        fontFamily:
                            "'Splunk Platform Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                    }}
                >
                    {paths.displayValue}
                </text>
            </g>
        </svg>
    );
}

RadialMeter.propTypes = {
    value: PropTypes.number,
    maxValue: PropTypes.number,
    mainColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
};
