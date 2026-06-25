/**
 * Risk Anomaly Detection dashboard entry point — bootstraps the React page via Splunk layout.
 */
import React from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';

import { DashboardFilterProvider } from './context/DashboardFilterProvider.jsx';
import GlobalFilterBar from './filters/GlobalFilterBar.jsx';
import { PanelStack, RiskPageContainer, TwoColumnRow } from './RiskStyles.jsx';
import {
    AnomalyRowsTable,
    CalendarRiskTable,
    DomainDistributionHistogram,
    EntityCategoryTable,
    RiskScoresTable,
    SeverityBreakdownTable,
} from './panels/RiskTablePanels.jsx';
import RiskTrendChart from './panels/RiskTrendChart.jsx';

getUserTheme()
    .then((theme) => {
        /**
         * WHAT: Renders the full risk dashboard layout with filters, tables, and trend chart.
         * WORKS WITH: DashboardFilterProvider, GlobalFilterBar, RiskStyles, RiskTablePanels, RiskTrendChart, Splunk react-page layout.
         */
        const RiskPage = () => (
            <DashboardFilterProvider>
                <RiskPageContainer>
                    <Heading level={1} style={{ marginBottom: 6 }}>
                        Risk Anomaly Detection
                    </Heading>
                    <p
                        style={{
                            maxWidth: 920,
                            margin: '0 0 18px',
                            color: '#4a5a6a',
                            fontSize: 14,
                            lineHeight: 1.45,
                        }}
                    >
                        Monitor risk-score movement, domain concentration, and active anomaly
                        clusters across the selected time window. Use the filters to focus the
                        investigation by business unit, severity, domain, entity type, or entity.
                    </p>
                    <GlobalFilterBar />
                    <PanelStack>
                        <RiskScoresTable />
                        <RiskTrendChart />
                        <TwoColumnRow>
                            <EntityCategoryTable />
                            <DomainDistributionHistogram />
                        </TwoColumnRow>
                        <CalendarRiskTable />
                        <TwoColumnRow>
                            <SeverityBreakdownTable />
                            <AnomalyRowsTable />
                        </TwoColumnRow>
                    </PanelStack>
                </RiskPageContainer>
            </DashboardFilterProvider>
        );

        layout(<RiskPage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
