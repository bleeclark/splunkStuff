import React from 'react';
import PropTypes from 'prop-types';
import layout from '@splunk/react-page/18';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import Heading from '@splunk/react-ui/Heading';
import Paragraph from '@splunk/react-ui/Paragraph';
import Card from '@splunk/react-ui/Card';
import List from '@splunk/react-ui/List';
import Divider from '@splunk/react-ui/Divider';

import { DocContainer } from './DocumentationStyles';

const codeStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 12,
    background: 'rgba(0,0,0,0.06)',
    padding: '2px 6px',
    borderRadius: 4,
};

function Code({ children }) {
    return <span style={codeStyle}>{children}</span>;
}

Code.propTypes = {
    children: PropTypes.node,
};
Code.defaultProps = {
    children: null,
};

getUserTheme()
    .then((theme) => {
        const DocumentationPage = () => (
            <DocContainer>
                <Heading level={1} style={{ marginBottom: 8 }}>
                    Documentation
                </Heading>
                <Paragraph style={{ marginBottom: 24, maxWidth: 720 }}>
                    This app follows the Splunk UI Toolkit /{' '}
                    <Code>@splunk/create</Code> ReactSplunkApp layout: Yarn workspace,
                    Webpack page bundles, HTML views, and{' '}
                    <Code>@splunk/react-page</Code> with{' '}
                    <Code>@splunk/react-ui</Code>.
                </Paragraph>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    Namespaces
                </Heading>
                <Card>
                    <Card.Body>
                        <Heading level={3} style={{ marginTop: 0 }}>
                            Splunk app id
                        </Heading>
                        <Paragraph style={{ marginBottom: 16 }}>
                            Declared in <Code>app.conf</Code> and{' '}
                            <Code>[package] id</Code>. All static assets load under this
                            path prefix.
                        </Paragraph>
                        <List>
                            <List.Item>
                                Application id: <Code>so_BUI_pickulationts</Code>
                            </List.Item>
                            <List.Item>
                                Splunk Web URL prefix:{' '}
                                <Code>/static/app/so_BUI_pickulationts/</Code>
                            </List.Item>
                            <List.Item>
                                Page bundles:{' '}
                                <Code>
                                    /static/app/so_BUI_pickulationts/pages/&lt;page&gt;.js
                                </Code>{' '}
                                (e.g. <Code>start.js</Code>,{' '}
                                <Code>documentation.js</Code>)
                            </List.Item>
                        </List>

                        <Divider style={{ margin: '16px 0' }} />

                        <Heading level={3}>JavaScript module scope</Heading>
                        <Paragraph style={{ marginBottom: 16 }}>
                            Source lives under{' '}
                            <Code>packages/so_BUI_pickulationts/src/main/webapp/</Code>. Page
                            entry folders map 1:1 to Webpack entry names (directory
                            names under <Code>pages/</Code>).
                        </Paragraph>
                        <List>
                            <List.Item>
                                Pages:{' '}
                                <Code>
                                    src/main/webapp/pages/&lt;name&gt;/index.jsx
                                </Code>
                            </List.Item>
                            <List.Item>
                                Shared UI:{' '}
                                <Code>src/main/webapp/components/</Code>
                            </List.Item>
                        </List>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    Architecture manifest
                </Heading>
                <Card>
                    <Card.Body>
                        <Heading level={3} style={{ marginTop: 0 }}>
                            Build &amp; stage
                        </Heading>
                        <List>
                            <List.Item>
                                <strong>Webpack</strong> —{' '}
                                <Code>webpack.config.js</Code> merges{' '}
                                <Code>@splunk/webpack-configs/base.config</Code>; each
                                subfolder of <Code>pages/</Code> becomes an entry
                                writing to{' '}
                                <Code>stage/appserver/static/pages/[name].js</Code>.
                            </List.Item>
                            <List.Item>
                                <strong>Resources</strong> —{' '}
                                <Code>CopyWebpackPlugin</Code> copies{' '}
                                <Code>src/main/resources/splunk/</Code> into{' '}
                                <Code>stage/</Code> (views, nav, templates,{' '}
                                <Code>app.conf</Code>).
                            </List.Item>
                            <List.Item>
                                <strong>Local install</strong> —{' '}
                                <Code>yarn link:app</Code> symlinks{' '}
                                <Code>$SPLUNK_HOME/etc/apps/so_BUI_pickulationts</Code> to{' '}
                                <Code>packages/so_BUI_pickulationts/stage</Code>.
                            </List.Item>
                        </List>

                        <Divider style={{ margin: '16px 0' }} />

                        <Heading level={3}>Splunk app metadata (runtime)</Heading>
                        <List>
                            <List.Item>
                                <Code>default/app.conf</Code> — app label, visibility,
                                themes.
                            </List.Item>
                            <List.Item>
                                <Code>default/data/ui/nav/default.xml</Code> — top nav
                                views and default view.
                            </List.Item>
                            <List.Item>
                                <Code>default/data/ui/views/*.xml</Code> — HTML views;
                                each references an appserver template and label.
                            </List.Item>
                            <List.Item>
                                <Code>appserver/templates/*.html</Code> — Mako
                                bootstrap: Splunk config/i18n scripts, then loads the
                                page script for this view.
                            </List.Item>
                        </List>

                        <Divider style={{ margin: '16px 0' }} />

                        <Heading level={3}>React bootstrap</Heading>
                        <Paragraph style={{ marginBottom: 0 }}>
                            Each page calls <Code>getUserTheme()</Code>, then{' '}
                            <Code>layout(&lt;Page /&gt;, {'{'} theme {'}'})</Code> from{' '}
                            <Code>@splunk/react-page/18</Code> so the tree matches Splunk
                            Web chrome and theming.
                        </Paragraph>
                    </Card.Body>
                </Card>
            </DocContainer>
        );

        layout(<DocumentationPage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
