import React from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';

import { StyledContainer } from './StartStyles';

import NewSingleValue from '../../components/visualizations/NewSingleValue';
import NewSingleValueTwo from '../../components/visualizations/NewSingleValueTwo';
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
    height: 130,
    marginBottom: 24,
    color: '#FFFFFF',
    padding: '8px 0 0',
    boxSizing: 'border-box',
};

const palette = {
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
};

const widgetCommon = {
    width: 400,
    height: 130,
    ...palette,
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
    lineBandFraction: 0.38,
};

const latencyWidget = {
    ...widgetCommon,
    sparkMin: 20,
    sparkMax: 40,
    lineBandFraction: 0.26,
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
            </StyledContainer>
        );

        layout(<StartPage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
