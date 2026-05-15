import React from 'react';
import PropTypes from 'prop-types';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';
import Paragraph from '@splunk/react-ui/Paragraph';
import Card from '@splunk/react-ui/Card';
import List from '@splunk/react-ui/List';
import Divider from '@splunk/react-ui/Divider';

import { DocContainer } from '../documentation/DocumentationStyles';

const codeStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 12,
    background: 'rgba(0,0,0,0.06)',
    padding: '2px 6px',
    borderRadius: 4,
};

const preStyle = {
    fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 12,
    lineHeight: 1.45,
    background: 'rgba(0,0,0,0.06)',
    padding: 12,
    borderRadius: 4,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    margin: '0 0 12px',
};

function Code({ children }) {
    return <span style={codeStyle}>{children}</span>;
}

Code.propTypes = { children: PropTypes.node };
Code.defaultProps = { children: null };

function Pre({ children }) {
    return <pre style={preStyle}>{children}</pre>;
}

Pre.propTypes = { children: PropTypes.node };
Pre.defaultProps = { children: null };

const DOC_VIZ_API =
    'https://docs.splunk.com/Documentation/Splunk/9.4.1/AdvancedDev/CustomVizApiRef';
const DOC_BUILD_VIZ =
    'https://help.splunk.com/splunk-enterprise/developing-views-and-apps-for-splunk-web/9.4/custom-visualizations/build-a-custom-visualization';
const DOC_FORMATTER =
    'https://docs.splunk.com/Documentation/Splunk/latest/AdvancedDev/CustomVizFormatterApiRef';
const DOC_SIMPLE_XML =
    'https://docs.splunk.com/en/splunk-enterprise/developing-views-and-apps-for-splunk-web/9.4/custom-visualizations/custom-visualizations-in-simple-xml';
const DOC_VIZ_CONF =
    'https://help.splunk.com/en/data-management/splunk-enterprise-admin-manual/9.0/welcome-to-splunk-enterprise-administration/configuration-file-reference/9.0.9-configuration-file-reference/visualizations.conf';

function DocLink({ href, children }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
}

DocLink.propTypes = {
    href: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

getUserTheme()
    .then((theme) => {
        const IntegrationPage = () => (
            <DocContainer style={{ maxWidth: 920 }}>
                <Heading level={1} style={{ marginBottom: 8 }}>
                    Integration
                </Heading>
                <Paragraph style={{ marginBottom: 16, maxWidth: 860 }}>
                    How to turn the <Code>NewSingleValue</Code> work from this app into a{' '}
                    <strong>Splunk-registered custom visualization</strong> (Search +
                    Classic dashboards), so admins can pick it from the visualization
                    picker and configure it via the Format menu. This page is a checklist;
                    follow the Splunk docs for your exact version.
                </Paragraph>
                <Paragraph style={{ marginBottom: 24, maxWidth: 860 }}>
                    Primary references:{' '}
                    <DocLink href={DOC_VIZ_API}>Custom visualization API reference</DocLink>
                    {' · '}
                    <DocLink href={DOC_BUILD_VIZ}>Build a custom visualization</DocLink>
                    {' · '}
                    <DocLink href={DOC_FORMATTER}>Formatter API reference</DocLink>
                    {' · '}
                    <DocLink href={DOC_SIMPLE_XML}>Custom visualizations in Simple XML</DocLink>
                    {' · '}
                    <DocLink href={DOC_VIZ_CONF}>visualizations.conf</DocLink>.
                </Paragraph>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    Shipped in this app (<Code>fixed_single_value</Code>)
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            The app ships a registered custom visualization with stanza and
                            folder name <Code>fixed_single_value</Code>. It is a{' '}
                            <strong>vanilla AMD</strong> implementation (hand-written{' '}
                            <Code>visualization.js</Code> for Splunk Web — no separate npm build
                            in that folder). After <Code>yarn build</Code>, these files are
                            copied into <Code>stage/</Code> with the rest of{' '}
                            <Code>src/main/resources/splunk</Code>.
                        </Paragraph>
                        <List>
                            <List.Item>
                                <Code>
                                    src/main/resources/splunk/appserver/static/visualizations/fixed_single_value/visualization.js
                                </Code>
                            </List.Item>
                            <List.Item>
                                <Code>
                                    src/main/resources/splunk/appserver/static/visualizations/fixed_single_value/visualization.css
                                </Code>
                            </List.Item>
                            <List.Item>
                                <Code>
                                    src/main/resources/splunk/appserver/static/visualizations/fixed_single_value/formatter.html
                                </Code>
                            </List.Item>
                            <List.Item>
                                <Code>
                                    src/main/resources/splunk/appserver/static/visualizations/fixed_single_value/preview.png
                                </Code>{' '}
                                (116×76 picker thumbnail)
                            </List.Item>
                            <List.Item>
                                <Code>src/main/resources/splunk/default/visualizations.conf</Code>{' '}
                                — stanza <Code>[fixed_single_value]</Code>
                            </List.Item>
                            <List.Item>
                                <Code>src/main/resources/splunk/default/savedsearches.conf</Code>{' '}
                                and{' '}
                                <Code>savedsearches.conf.spec</Code> — format property defaults /
                                declarations
                            </List.Item>
                            <List.Item>
                                <Code>src/main/resources/splunk/metadata/default.meta</Code> — app
                                export
                            </List.Item>
                        </List>
                        <Paragraph style={{ marginBottom: 0 }}>
                            Behavior matches the <strong>fixed min/max sparkline</strong> pattern
                            from <Code>NewSingleValue</Code>; you may later swap in a Webpack-built{' '}
                            <Code>visualization.js</Code> that mounts the React component if you
                            need full parity in Search dashboards.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    Scope: two different things
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <List>
                            <List.Item>
                                <strong>This app today:</strong>{' '}
                                <Code>pages/start</Code>, <Code>pages/demo</Code>, etc. render{' '}
                                <Code>NewSingleValue</Code> as a <strong>React page</strong>{' '}
                                component. That is <strong>not</strong> automatically a
                                Splunk “custom visualization” in the picker.
                            </List.Item>
                            <List.Item>
                                <strong>Target outcome:</strong> a package under{' '}
                                <Code>appserver/static/visualizations/&lt;stanza&gt;/</Code>{' '}
                                plus <Code>default/visualizations.conf</Code>, implementing{' '}
                                <Code>SplunkVisualizationBase</Code> with{' '}
                                <Code>getInitialDataParams</Code> and <Code>updateView</Code>,
                                built to <Code>visualization.js</Code>.
                            </List.Item>
                        </List>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    1. Pick Splunk version and doc set
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Open the <strong>same version</strong> of Splunk docs as your
                            deployment (Enterprise vs Cloud, 9.x vs 10.x). API details and
                            Simple XML examples drift by version.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    2. Directory layout (inside the app, e.g. so_BUI_pickulationts)
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Per Splunk&apos;s layout (see API reference), add:
                        </Paragraph>
                        <Pre>{`$SPLUNK_HOME/etc/apps/so_BUI_pickulationts/
  appserver/static/visualizations/<viz_stanza_name>/
    src/visualization_source.js
    webpack.config.js
    package.json
    visualization.js          # produced by npm run build
    visualization.css
    formatter.html
    preview.png                 # 116×76 PNG for the picker
  default/
    visualizations.conf
    savedsearches.conf          # optional default format values
    savedsearches.conf.spec     # declare every custom property
  metadata/
    default.meta`}</Pre>
                        <Paragraph>
                            Start from Splunk&apos;s <strong>custom visualization template</strong>{' '}
                            (linked from the build tutorial), rename the sample viz folder
                            and stanza to your final name (example:{' '}
                            <Code>fixed_single_value</Code>).
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    3. Register — <Code>default/visualizations.conf</Code>
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            One stanza per viz. Stanza name should match the folder under{' '}
                            <Code>static/visualizations/</Code>. Required:{' '}
                            <Code>label</Code>. Common options: <Code>description</Code>,{' '}
                            <Code>default_height</Code>, <Code>search_fragment</Code>. See{' '}
                            <DocLink href={DOC_VIZ_CONF}>visualizations.conf</DocLink>.
                        </Paragraph>
                        <Pre>{`[fixed_single_value]
label = Fixed single value
description = Single value with fixed-domain sparkline.
default_height = 250
search_fragment = | timechart span=1h avg(metric) as value`}</Pre>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    4. Export — <Code>metadata/default.meta</Code>
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Export the visualization resources so Splunk Web can load them
                            (follow Admin Manual <Code>default.meta</Code> spec for your
                            app). Restart or redeploy per your environment after conf
                            changes.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    5. Runtime — <Code>src/visualization_source.js</Code>
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            AMD module: <Code>define([...], function (...) {'{'}</Code> returning{' '}
                            <Code>SplunkVisualizationBase.extend({'{'} ... {'}'})</Code>.
                        </Paragraph>
                        <List>
                            <List.Item>
                                <strong>Required</strong> <Code>getInitialDataParams(config)</Code>
                                — return <Code>outputMode</Code> as one of{' '}
                                <Code>COLUMN_MAJOR_OUTPUT_MODE</Code>,{' '}
                                <Code>ROW_MAJOR_OUTPUT_MODE</Code>, or{' '}
                                <Code>RAW_OUTPUT_MODE</Code>, plus optional{' '}
                                <Code>count</Code>, <Code>offset</Code>, sort, etc.
                            </List.Item>
                            <List.Item>
                                <strong>Required</strong> <Code>updateView(data, config, async)</Code>
                                — render using formatted <Code>data</Code> and fully qualified
                                keys in <Code>config</Code> such as{' '}
                                <Code>
                                    display.visualizations.custom.&lt;app&gt;.&lt;viz&gt;.&lt;prop&gt;
                                </Code>
                                .
                            </List.Item>
                            <List.Item>
                                <strong>Optional</strong> <Code>formatData(rawData, config)</Code>
                                — convert search results into the{' '}
                                <Code>dataSources.primary</Code> shape expected by{' '}
                                <Code>NewSingleValue</Code> if you mount React (see below).
                            </List.Item>
                            <List.Item>
                                <strong>Optional</strong> <Code>reflow</Code> — resize when the
                                panel changes; measure <Code>this.el</Code>.
                            </List.Item>
                            <List.Item>
                                <strong>Optional</strong> <Code>remove</Code> — unmount React
                                roots if you use <Code>createRoot</Code>.
                            </List.Item>
                        </List>
                        <Paragraph>
                            <strong>Bridging this repo&apos;s React:</strong> Webpack-bundle{' '}
                            <Code>react-dom</Code> + <Code>NewSingleValue</Code> into{' '}
                            <Code>visualization.js</Code>. In <Code>updateView</Code>, create a
                            root on <Code>this.el</Code> and render{' '}
                            <Code>{'<NewSingleValue dataSources={...} ... />'}</Code>, mapping{' '}
                            <Code>config</Code> keys to props (<Code>sparkMin</Code>, colors,
                            etc.). Alternatively, reimplement the SVG/value layer without React
                            for a smaller bundle.
                        </Paragraph>
                        <Paragraph>
                            Use <Code>api/SplunkVisualizationUtils</Code> for{' '}
                            <Code>escapeHtml</Code> / <Code>makeSafeUrl</Code> on untrusted
                            search strings (required for hardened apps).
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    6. Format menu — <Code>formatter.html</Code>
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Define inputs for spark min/max, colors, stroke, height, etc. Use{' '}
                            <Code>{'{{VIZ_NAMESPACE}}.propertyName'}</Code> on control names
                            (see <DocLink href={DOC_FORMATTER}>Formatter API reference</DocLink>
                            ). Group tabs with{' '}
                            <Code>splunk-formatter-section</Code> /{' '}
                            <Code>section-label</Code>.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    7. Property defaults — <Code>savedsearches.conf</Code> +{' '}
                    <Code>savedsearches.conf.spec</Code>
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Declare <strong>every</strong> custom property in{' '}
                            <Code>savedsearches.conf.spec</Code> to avoid startup warnings.
                            Optional defaults live in <Code>savedsearches.conf</Code> using the
                            full namespace, for example:
                        </Paragraph>
                        <Pre>{`display.visualizations.custom.so_BUI_pickulationts.fixed_single_value.sparkMin = 0
display.visualizations.custom.so_BUI_pickulationts.fixed_single_value.sparkMax = 100`}</Pre>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    8. Build
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Many teams use Webpack in the viz folder so{' '}
                            <Code>src/visualization_source.js</Code> compiles to{' '}
                            <Code>visualization.js</Code>. This app&apos;s{' '}
                            <Code>fixed_single_value</Code> viz commits{' '}
                            <Code>visualization.js</Code> directly (AMD for Splunk Web), so no
                            extra <Code>npm run build</Code> is required there unless you replace
                            it with a bundled entry.
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 0 }}>
                            Run <Code>yarn workspace @splunk/splunk-one build</Code> so static
                            assets (including the viz folder) copy into <Code>stage/</Code>.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    9. Validate in Splunk Web
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <List>
                            <List.Item>
                                Run a search that returns the fields your viz expects.
                            </List.Item>
                            <List.Item>
                                Open the visualization picker and select your{' '}
                                <Code>label</Code>.
                            </List.Item>
                            <List.Item>
                                Use <strong>Format</strong> and confirm values flow into{' '}
                                <Code>updateView</Code>.
                            </List.Item>
                            <List.Item>
                                Check the browser network tab for 404s on{' '}
                                <Code>/static/app/so_BUI_pickulationts/visualizations/...</Code>.
                            </List.Item>
                        </List>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    10. Classic dashboards (Simple XML)
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Follow Splunk&apos;s guide for embedding custom vizzes in Simple
                            XML:{' '}
                            <DocLink href={DOC_SIMPLE_XML}>
                                Custom visualizations in Simple XML
                            </DocLink>
                            . Copy the <strong>version-correct</strong> example from Splunk;
                            do not guess attribute names across releases.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    11. Dashboard Studio
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            <strong>Do not assume</strong> Classic custom vizzes work in
                            Dashboard Studio the same way. Open Studio documentation for{' '}
                            <strong>your</strong> Splunk version and confirm whether
                            third-party app visualizations appear in Studio and what JSON or
                            registration is required. Document that path separately once
                            confirmed.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Divider style={{ margin: '24px 0' }} />

                <Heading level={2} style={{ marginBottom: 12 }}>
                    What your boss can copy after registration
                </Heading>
                <Card>
                    <Card.Body>
                        <List>
                            <List.Item>
                                <Code>visualizations.conf</Code> stanza (or merge into the
                                app&apos;s existing file).
                            </List.Item>
                            <List.Item>
                                Optional <Code>savedsearches.conf</Code> /{' '}
                                <Code>savedsearches.conf.spec</Code> snippets for defaults and
                                declared properties.
                            </List.Item>
                            <List.Item>
                                Simple XML (or Studio JSON <strong>if supported</strong>)
                                generated from Splunk&apos;s own examples — not raw JSX from{' '}
                                <Code>pages/start</Code>.
                            </List.Item>
                        </List>
                        <Paragraph style={{ marginBottom: 0 }}>
                            The <Code>NewSingleValue</Code> React code in{' '}
                            <Code>components/visualizations/</Code> is the richer{' '}
                            <strong>reference implementation</strong> (Splunk{' '}
                            <Code>SingleValue</Code>, tooltips, layouts). The shipped{' '}
                            <Code>fixed_single_value</Code> custom viz is a <strong>vanilla</strong>{' '}
                            <Code>SplunkVisualizationBase</Code> sibling suitable for Search /
                            Classic dashboards; upgrade path is to bundle React into{' '}
                            <Code>visualization.js</Code> if you need identical UI.
                        </Paragraph>
                    </Card.Body>
                </Card>
            </DocContainer>
        );

        layout(<IntegrationPage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
