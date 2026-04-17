import React from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import { StyledContainer } from './StartStyles';
import Heading from '@splunk/react-ui/Heading';

import NewSingleValue from '../../components/visualizations/NewSingleValue';
import NewSingleValueTwo from '../../components/visualizations/NewSingleValueTwo';
import { totalRequestsFeed, latencyRequests } from '../../components/visualizations/singleValueFeed';

getUserTheme()
    .then((theme) => {
        const StartPage = () => {
            // const dataSources = toSingleValueDataSources({ values, times });
            // {<viz dataSources={mockDataSources} options={config.options} width={400} height={130} />}

            return (
                <StyledContainer>
                        <Heading
                            level={1}
                            style={{ color: '#000000', marginBottom: 12 }}
                        >
                            Single Value Widget
                        </Heading>
                        <div
                            style={{
                                background: '#0B1F3B',
                                height: 90,
                                width: 376,
                                marginBottom: 24,
                                color: '#FFFFFF',
                            }}
                        >
                            <NewSingleValue
                                feed={totalRequestsFeed}
                                width={400}
                                height={130}
                                goodColor="#01417F"
                                badColor="#DFA611"
                                textColor="#FFFFFF"
                                sparkMin={0}
                                sparkMax={100}
                                sparkStroke="#FFFFFF"
                                sparkStrokeWidth={2}
                                sparkBottom={12}
                                sparkLeft={12}
                                sparkRight={12}
                                sparkHeight={58}
                                sparkPadLeft={4}
                                sparkPadRight={4}
                                sparkPadTop={2}
                                sparkPadBottom={2}
                                options={{}}
                            />
                        </div>

                        <Heading
                            level={1}
                            style={{ color: '#000000', marginBottom: 12 }}
                        >
                            Single Value Widget w/ Tooltips
                        </Heading>
                        <Heading
                            level={1}
                            style={{ color: '#000000', marginBottom: 12 }}
                        >
                            Single Value Widget w/ Annotation
                        </Heading>
                        <Heading
                            level={1}
                            style={{ color: '#000000', marginBottom: 12 }}
                        >
                            Single Value Widget w/ Custom Tooltips
                        </Heading>

                        <div
                            style={{
                                background: '#0B1F3B',
                                height: 90,
                                width: 376,
                                marginBottom: 24,
                                color: '#FFFFFF',
                            }}
                        >
                            <NewSingleValueTwo
                                feed={latencyRequests}
                                width={400}
                                height={130}
                                goodColor="#01417F"
                                badColor="#DFA611"
                                textColor="#FFFFFF"
                                sparkMin={20}
                                sparkMax={40}
                                sparkStroke="#FFFFFF"
                                sparkStrokeWidth={2}
                                sparkBottom={12}
                                sparkLeft={0}
                                sparkRight={0}
                                sparkHeight={8}
                                sparkPadLeft={0}
                                sparkPadRight={0}
                                sparkPadTop={2}
                                sparkPadBottom={2}
                                options={{}}
                            />
                        </div>

                        <Heading
                            level={1}
                            style={{ color: '#000000', marginBottom: 12 }}
                        >
                            Single Value Widget w/ Line Graph
                        </Heading>
                    </StyledContainer>
            );
        };

        layout(<StartPage />, { theme });
    })
    .catch((e) => {
        /* Gotta put some error catching in here somewhere soon */
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
