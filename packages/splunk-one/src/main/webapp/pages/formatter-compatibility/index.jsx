import React from 'react';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import {
    CheckItem,
    CheckList,
    CodeBlock,
    DetailGrid,
    Eyebrow,
    Footnote,
    Hero,
    Intro,
    Page,
    Panel,
    PanelHeader,
    Status,
    Summary,
    SummaryCard,
    Title,
    VersionBadge,
} from './FormatterCompatibilityStyles';

const checks = [
    {
        title: 'Use the exact visualization folder',
        detail: 'Place formatter.html beside visualization.js and visualization.css under appserver/static/visualizations/<viz_name>/.',
    },
    {
        title: 'Keep property names namespaced',
        detail: 'Every control name should use the case-sensitive {{VIZ_NAMESPACE}}.<property> form.',
    },
    {
        title: 'Read the property in visualization.js',
        detail: 'A formatter control only changes behavior when updateView reads and applies the matching configuration key.',
    },
    {
        title: 'Prepare for the jQuery 3 path',
        detail: 'Splunk 9.4 still gives older apps a migration window, but new formatter work should use supported Splunk controls and jQuery 3-compatible APIs.',
    },
    {
        title: 'Refresh every runtime copy',
        detail: 'Update source, staged, and delivered copies; rebuild, restart Splunk Web when needed, then hard-refresh the browser.',
    },
];

const formatterExample = `<form class="splunk-formatter-section"
      section-label="Appearance">
  <splunk-control-group label="Color">
    <splunk-color-picker
      name="{{VIZ_NAMESPACE}}.mainColor"
      value="#65A637">
    </splunk-color-picker>
  </splunk-control-group>
</form>`;

function FormatterCompatibilityPage() {
    return (
        <Page>
            <Hero>
                <div>
                    <Eyebrow>Custom visualization readiness</Eyebrow>
                    <Title>Will formatter.html work?</Title>
                    <Intro>
                        Yes. Splunk 9.4 supports formatter files for custom visualization
                        format menus. These are the checks that separate a reliable formatter
                        from one that appears missing or silently does nothing.
                    </Intro>
                </div>
                <VersionBadge>
                    Target platform
                    <strong>Splunk 9.4</strong>
                </VersionBadge>
            </Hero>

            <Summary aria-label="Compatibility summary">
                <SummaryCard>
                    <Status $color="#4f8a2e">Supported</Status>
                    <h2>The file is valid</h2>
                    <p>formatter.html remains the supported format-menu UI for classic custom visualizations.</p>
                </SummaryCard>
                <SummaryCard>
                    <Status $color="#c17b16">Conditional</Status>
                    <h2>Placement matters</h2>
                    <p>A correct file in the wrong folder—or only in a source folder—will not be discovered.</p>
                </SummaryCard>
                <SummaryCard>
                    <Status $color="#3f6f9f">Migration watch</Status>
                    <h2>Modernize old JavaScript</h2>
                    <p>In 9.4, treat jQuery 2 compatibility as migration time—not a reason to build new code around it.</p>
                </SummaryCard>
            </Summary>

            <DetailGrid>
                <Panel>
                    <PanelHeader>
                        <h2>Five checks before shipping</h2>
                        <p>Run these in order when the Format menu is empty or changes do not apply.</p>
                    </PanelHeader>
                    <CheckList>
                        {checks.map((check, index) => (
                            <CheckItem key={check.title}>
                                <span>{index + 1}</span>
                                <div>
                                    <strong>{check.title}</strong>
                                    <p>{check.detail}</p>
                                </div>
                            </CheckItem>
                        ))}
                    </CheckList>
                </Panel>

                <Panel>
                    <PanelHeader>
                        <h2>Safe formatter pattern</h2>
                        <p>A minimal Splunk-native control with a namespaced property.</p>
                    </PanelHeader>
                    <CodeBlock>{formatterExample}</CodeBlock>
                    <Footnote>
                        Match <code>mainColor</code> in <code>visualization.js</code>, rebuild the
                        app, restart Splunk Web if developer mode is off, and hard-refresh once.
                    </Footnote>
                </Panel>
            </DetailGrid>
        </Page>
    );
}

getUserTheme()
    .then((theme) => {
        layout(<FormatterCompatibilityPage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
