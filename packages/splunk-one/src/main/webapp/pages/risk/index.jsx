/**
 * Risk Anomaly Detection dashboard — React page with global filter bar and P1–P9 panels.
 */
import React from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';

import { DashboardFilterProvider } from './context/DashboardFilterProvider.jsx';
import GlobalFilterBar from './filters/GlobalFilterBar.jsx';
import { RiskPageContainer, ScorecardRow, TwoColumnRow } from './RiskStyles.jsx';
import RiskScoreKpi from './panels/RiskScoreKpi.jsx';
import AnomalyCountKpi from './panels/AnomalyCountKpi.jsx';
import SeverityKpi from './panels/SeverityKpi.jsx';
import MttdKpi from './panels/MttdKpi.jsx';
import RiskTrendChart from './panels/RiskTrendChart.jsx';
import EntityCategoryHeatmap from './panels/EntityCategoryHeatmap.jsx';
import DomainTreemap from './panels/DomainTreemap.jsx';
import CalendarHeatmap from './panels/CalendarHeatmap.jsx';
import AnomalyTable from './panels/AnomalyTable.jsx';
import EntityDetailDrawer from './panels/EntityDetailDrawer.jsx';

getUserTheme()
    .then((theme) => {
        const RiskPage = () => (
            <DashboardFilterProvider>
                <RiskPageContainer>
                    <Heading level={1} style={{ marginBottom: 4 }}>
                        Risk Anomaly Detection
                    </Heading>
                    <GlobalFilterBar />
                    <EntityDetailDrawer />
                    <TwoColumnRow>
                        <RiskScoreKpi />
                        <RiskTrendChart />
                    </TwoColumnRow>
                    <ScorecardRow>
                        <AnomalyCountKpi />
                        <SeverityKpi />
                        <MttdKpi />
                    </ScorecardRow>
                    <TwoColumnRow>
                        <EntityCategoryHeatmap />
                        <DomainTreemap />
                    </TwoColumnRow>
                    <CalendarHeatmap />
                    <AnomalyTable />
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
