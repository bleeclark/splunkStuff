import React from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';

import { StyledContainer } from './StartStyles';

import NewSingleValue from '../../components/visualizations/NewSingleValue';
import NewSingleValueTwo from '../../components/visualizations/NewSingleValueTwo';
import LineChart from '../../components/visualizations/LineChart';
import {
    totalRequestsFeed,
    latencyRequests,
    tooltipsDemoFeed,
    annotationDemoFeed,
    customTooltipsDemoFeed,
} from '../../components/visualizations/singleValueFeed';

const heading = { color: '#000000', marginBottom: 12 };
const panel = {
    background: '#0B1F3B',
    width: 400,
    height: 105,
    marginBottom: 24,
    color: '#FFFFFF',
    padding: 0,
    boxSizing: 'border-box',
};

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

const widgetCommon = {
    width: 400,
    height: 105,
    ...palette,
    sparklineLayout: 'overlay',
    sparkStroke: 'rgba(255,255,255,0.95)',
    sparkStrokeWidth: 2,
    sparkHeight: 36,
    sparkBottom: 0,
    sparkLeft: 10,
    sparkRight: 10,
    sparkPadLeft: 4,
    sparkPadRight: 4,
    sparkPadTop: 2,
    sparkPadBottom: 2,
    options: {},
};

const totalRequestsWidget = {
    ...widgetCommon,
    sparkMin: 0,
    sparkMax: 100,
};

const latencyWidget = {
    ...widgetCommon,
    sparkMin: 20,
    sparkMax: 40,
    sparkStrokeWidth: 1.5,
};

getUserTheme()
    .then((theme) => {
        const StartPage = () => (
            <StyledContainer>
                <Heading level={1} style={heading}>
                    Single Value Widget
                </Heading>
                <div style={panel}>
                    <NewSingleValue
                        feed={totalRequestsFeed}
                        {...totalRequestsWidget}
                    />
                </div>

                <Heading level={1} style={heading}>
                    Single Value Widget w/ Tooltips
                </Heading>
                <div style={panel}>
                    <NewSingleValue
                        feed={tooltipsDemoFeed}
                        {...totalRequestsWidget}
                    />
                </div>

                <Heading level={1} style={heading}>
                    Single Value Widget w/ Annotation
                </Heading>
                <div style={panel}>
                    <NewSingleValue
                        feed={annotationDemoFeed}
                        {...totalRequestsWidget}
                    />
                </div>

                <Heading level={1} style={heading}>
                    Single Value Widget w/ Custom Tooltips
                </Heading>
                <div style={panel}>
                    <NewSingleValue
                        feed={customTooltipsDemoFeed}
                        {...totalRequestsWidget}
                    />
                </div>

                <div style={panel}>
                    <NewSingleValueTwo
                        feed={latencyRequests}
                        {...latencyWidget}
                    />
                </div>

                <Heading level={1} style={heading}>
                    Single Value Widget w/ Line Graph
                </Heading>
                <p style={{ color: '#333', maxWidth: 720, marginBottom: 12 }}>
                    Same series as <strong>Total Requests</strong> above, shown as a plain SVG line
                    chart (not the Search app visualization picker).
                </p>
                <div style={panel}>
                    <LineChart
                        values={totalRequestsFeed.values}
                        times={totalRequestsFeed.times}
                        width={400}
                        height={105}
                        min={0}
                        max={100}
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth={2}
                        background="#0B1F3B"
                        showMajor
                        goodColor={palette.goodColor}
                        badColor={palette.badColor}
                        textColor={palette.textColor}
                        unit="%"
                        subheader={totalRequestsFeed.subheader}
                        centerMajor
                        colorPlacement="full"
                    />
                </div>
            </StyledContainer>
        );

        layout(<StartPage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
