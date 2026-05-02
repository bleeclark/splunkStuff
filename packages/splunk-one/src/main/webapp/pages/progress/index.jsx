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
        const ProgressPage = () => (
            <DocContainer style={{ maxWidth: 920 }}>
                <Heading level={1} style={{ marginBottom: 8 }}>
                    Progress
                </Heading>
                <Paragraph style={{ marginBottom: 24, maxWidth: 860 }}>
                    Working notes: converting a page-level single value into a reusable
                    Splunk-oriented visualization with a <strong>fixed-domain</strong>{' '}
                    sparkline, plus follow-up fixes from implementation and review.
                </Paragraph>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    1. Goal
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Build a reusable single value visualization that:
                        </Paragraph>
                        <List>
                            <List.Item>
                                Displays the latest metric value and delta (trend).
                            </List.Item>
                            <List.Item>
                                Accepts real Splunk-shaped <Code>dataSources</Code> when
                                wired to search results.
                            </List.Item>
                            <List.Item>
                                Overlays a <strong>custom</strong> fixed-domain sparkline
                                (developer-controlled min/max), not Splunk&apos;s
                                auto-scaled sparkline alone.
                            </List.Item>
                            <List.Item>
                                Can be reused across pages instead of living only inside
                                one page with hardcoded arrays.
                            </List.Item>
                        </List>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    2. Original state
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            The first version was effectively a page-level React widget.
                        </Paragraph>
                        <List>
                            <List.Item>
                                Rendered directly under{' '}
                                <Code>pages/start/index.jsx</Code>.
                            </List.Item>
                            <List.Item>
                                Depended on locally defined arrays or an imported feed
                                object.
                            </List.Item>
                            <List.Item>
                                Used Splunk <Code>@splunk/visualizations/SingleValue</Code>{' '}
                                for the major value.
                            </List.Item>
                            <List.Item>
                                Attempted to rely on Splunk&apos;s built-in sparkline
                                behavior.
                            </List.Item>
                            <List.Item>
                                Was tightly coupled to the page structure.
                            </List.Item>
                        </List>
                        <Paragraph>
                            <strong>Limitation:</strong> Splunk&apos;s built-in sparkline
                            auto-scaled internally, so the line did not obey a fixed
                            min/max visual contract.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    3. Problem identified
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            The built-in sparkline did not match the intended fixed-scale
                            design.
                        </Paragraph>
                        <List>
                            <List.Item>
                                Anchor-style tricks still did not give predictable
                                fixed-domain rendering.
                            </List.Item>
                            <List.Item>
                                Fine control over stroke, padding, and overlay placement
                                was limited.
                            </List.Item>
                        </List>
                        <Paragraph>
                            <strong>Conclusion:</strong> keep <Code>SingleValue</Code> for
                            the numeric card, but <strong>replace</strong> the sparkline
                            with a custom SVG layer under explicit props.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    4. Architectural change
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Refactor from a page widget to a reusable visualization module.
                        </Paragraph>
                        <Paragraph>
                            <strong>Before:</strong>{' '}
                            <Code>index.jsx</Code> → inline / page-level component with{' '}
                            <Code>feed</Code> only.
                        </Paragraph>
                        <Paragraph>
                            <strong>After:</strong> Splunk-shaped{' '}
                            <Code>dataSources</Code> (or a feed adapter path) →{' '}
                            <Code>NewSingleValue</Code> in{' '}
                            <Code>components/visualizations/NewSingleValue.jsx</Code> →{' '}
                            <Code>SingleValue</Code> + custom <Code>FixedSparkline</Code>.
                        </Paragraph>
                        <Paragraph>
                            <Code>NewSingleValueTwo</Code> is a thin alias re-export for
                            experiments without forking the main implementation.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    5. Data model change
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            <strong>Before:</strong> input from imported JS feed objects
                            and/or hardcoded arrays in the page.
                        </Paragraph>
                        <Paragraph>
                            <strong>After:</strong> primary path uses{' '}
                            <Code>dataSources.primary.data.columns</Code> where column 0 is
                            time-like and column 1 is metric values, with matching{' '}
                            <Code>fields</Code> names (for example <Code>_time</Code> and{' '}
                            <Code>sparklineValues</Code>).
                        </Paragraph>
                        <Paragraph>
                            <strong>Benefit:</strong> aligns with how Splunk search results
                            are typically adapted into visualization data, so the same
                            component can be reused outside the original page.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    6. Preparation layer
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            A preparation step normalizes incoming feed data before render.
                        </Paragraph>
                        <List>
                            <List.Item>Validate and coerce numeric values.</List.Item>
                            <List.Item>Align times with values (length-safe).</List.Item>
                            <List.Item>
                                Build anchored series for <Code>SingleValue</Code> via{' '}
                                <Code>withAnchors</Code>.
                            </List.Item>
                            <List.Item>
                                Preserve parallel <Code>safeValues</Code> /{' '}
                                <Code>safeTimes</Code> for the custom sparkline (without
                                anchor injection in that path).
                            </List.Item>
                        </List>
                        <Paragraph>
                            Output shape includes <Code>safeValues</Code>,{' '}
                            <Code>safeTimes</Code>, <Code>anchoredValues</Code>,{' '}
                            <Code>anchoredTimes</Code>.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    7. Custom sparkline (<Code>FixedSparkline</Code>)
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            <Code>FixedSparkline</Code> is an SVG polyline that maps each
                            point with <Code>y = f(value, sparkMin, sparkMax)</Code> inside
                            padded bounds.
                        </Paragraph>
                        <List>
                            <List.Item>
                                Uses <Code>safeValues</Code> (not anchor-padded series).
                            </List.Item>
                            <List.Item>
                                Honors <Code>sparkMin</Code>, <Code>sparkMax</Code>, and
                                pad props explicitly.
                            </List.Item>
                            <List.Item>
                                <strong>Overlay</strong> mode: absolutely positioned over
                                the card bottom; <strong>below</strong> mode: stacked under
                                the value block when <Code>sparklineLayout === &apos;below&apos;</Code>.
                            </List.Item>
                        </List>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    8. Splunk <Code>SingleValue</Code> retained
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Still uses Splunk <Code>SingleValue</Code> for major value,
                            delta/trend, background color behavior, and familiar card
                            typography options.
                        </Paragraph>
                        <Paragraph>
                            Built-in spark area is disabled in merged options (for example{' '}
                            <Code>sparklineDisplay: &apos;off&apos;</Code> and{' '}
                            <Code>showSparkAreaGraph: false</Code>) so it does not fight
                            the custom SVG sparkline.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    9. Overlay layout
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Default layout wraps <Code>SingleValue</Code> in a
                            relatively-positioned card and places <Code>FixedSparkline</Code>{' '}
                            in an absolute layer at the bottom (<Code>sparkBottom</Code>,{' '}
                            <Code>sparkLeft</Code>, <Code>sparkRight</Code>).
                        </Paragraph>
                        <Paragraph>
                            That keeps the spark visually inside the same colored tile as
                            the headline metrics.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    10. Helper fixes
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            <strong>withAnchors</strong> — builds valid time/value pairs,
                            sorts by time, returns anchored arrays in a consistent shape for
                            the Splunk viz data path.
                        </Paragraph>
                        <Paragraph>
                            <strong>toLocalDataSource</strong> — converts parallel arrays
                            into:
                        </Paragraph>
                        <Paragraph style={{ fontFamily: codeStyle.fontFamily, fontSize: 13 }}>
                            columns: [times, values],
                            <br />
                            fields: [{`{ name: '_time' }`}, {`{ name: 'sparklineValues' }`}]
                        </Paragraph>
                        <Paragraph>
                            <strong>Important:</strong> internal processing uses iterable
                            pairs as <Code>[t, v]</Code> arrays, not <Code>{`{ t, v }`}</Code>{' '}
                            objects, so downstream mapping stays predictable.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    11. Component API
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Primary props include <Code>feed</Code> (demo / convenience),{' '}
                            <Code>dataSources</Code>, <Code>options</Code>,{' '}
                            <Code>width</Code>, <Code>height</Code>, trend colors, spark
                            geometry, <Code>sparklineLayout</Code>, and drilldown handler.
                        </Paragraph>
                        <Paragraph>
                            Spark tuning: <Code>sparkMin</Code>, <Code>sparkMax</Code>,{' '}
                            <Code>sparkStroke</Code>, <Code>sparkStrokeWidth</Code>,{' '}
                            <Code>sparkHeight</Code>, <Code>sparkBottom</Code>,{' '}
                            <Code>sparkLeft</Code>, <Code>sparkRight</Code>, pad props,{' '}
                            <Code>invert</Code>, <Code>showSparklineHoverValues</Code>.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    12. Feed file as a fixture
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            <Code>singleValueFeed.js</Code> (and related demo feeds) exist
                            as <strong>temporary fixtures</strong> for Start/Demo pages.
                        </Paragraph>
                        <Paragraph>
                            They are not the final integration pattern — production wiring
                            should pass real <Code>dataSources</Code> from search adapters.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    13. Real data integration path
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Intended flow: Splunk search results → adapter / transform →{' '}
                            <Code>dataSources</Code> → <Code>NewSingleValue</Code>.
                        </Paragraph>
                        <Paragraph>
                            Row-shaped results must be shaped into the primary columns +
                            fields structure the visualization expects (see section 10).
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    14. Registry concept
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            Conceptually, a visualization registry allows selecting a viz by
                            name from configuration instead of hard-importing each type on
                            every page.
                        </Paragraph>
                        <Paragraph style={{ fontFamily: codeStyle.fontFamily, fontSize: 12 }}>
                            const visualizations = {`{ NewSingleValue /* … */ }`};
                            <br />
                            const Viz = visualizations[config.type];
                            <br />
                            return &lt;Viz dataSources={'{...}'} options={'{...}'} /&gt;;
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    15. Testing approach
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <List>
                            <List.Item>
                                <strong>Stage 1:</strong> local component testing with mock{' '}
                                <Code>dataSources</Code> / feed coercions — value, delta,
                                sparkline alignment.
                            </List.Item>
                            <List.Item>
                                <strong>Stage 2:</strong> feed-based pages (Start) and props
                                playground (Demo) for regression and UX iteration.
                            </List.Item>
                            <List.Item>
                                <strong>Stage 3:</strong> real-data readiness — document
                                adapter contract and validate against live search output.
                            </List.Item>
                        </List>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    16. Outcome
                </Heading>
                <Card style={{ marginBottom: 24 }}>
                    <Card.Body>
                        <Paragraph style={{ marginTop: 0 }}>
                            A reusable <Code>NewSingleValue</Code> module that keeps Splunk{' '}
                            <Code>SingleValue</Code> for the numeric card, replaces the stock
                            sparkline with a fixed-domain SVG layer, accepts Splunk-shaped
                            data, and can grow into a dashboard-style visualization system.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Divider style={{ margin: '24px 0' }} />

                <Heading level={2} style={{ marginBottom: 12 }}>
                    Recent updates (implementation pass)
                </Heading>
                <Card>
                    <Card.Body>
                        <List>
                            <List.Item>
                                <strong>Tile size:</strong> Start and Demo panels use{' '}
                                <strong>400×105</strong> with <Code>NewSingleValue</Code>{' '}
                                default <Code>height</Code> aligned to the same footprint.
                            </List.Item>
                            <List.Item>
                                <strong>Metric header strip:</strong> feed{' '}
                                <Code>subheader</Code> renders as a dark title bar;{' '}
                                <Code>SingleValue</Code> gets <Code>subheader: &apos;&apos;</Code>{' '}
                                in merged options so the label is not duplicated inside the
                                colored card. Colored body height fills the remainder of the
                                fixed tile (replacing an older <Code>height − 60</Code> body
                                shrink that wasted vertical space).
                            </List.Item>
                            <List.Item>
                                <strong>Spark scale guard:</strong>{' '}
                                <Code>sparkScale</Code> memo normalizes <Code>sparkMin</Code>{' '}
                                / <Code>sparkMax</Code> (finite defaults, swap if reversed,
                                force <Code>max &gt; min</Code>) so invalid ranges cannot crash
                                the Demo props playground or Splunk <Code>SingleValue</Code>.
                            </List.Item>
                            <List.Item>
                                <strong>Layout modes:</strong> <Code>sparklineLayout</Code>{' '}
                                supports <Code>overlay</Code> (default on Start) and{' '}
                                <Code>below</Code> (Demo playground can switch).
                            </List.Item>
                            <List.Item>
                                <strong>Tooltips:</strong> optional <Code>tooltipText</Code>{' '}
                                wraps the tile in <Code>@splunk/react-ui/Tooltip</Code> with a
                                block-level wrapper so the hover target matches the full
                                widget.
                            </List.Item>
                            <List.Item>
                                <strong>Demo playground:</strong> live controls for colors,
                                spark geometry, invert, layout mode, and CSV-like series
                                strings beside the preview card.
                            </List.Item>
                        </List>
                    </Card.Body>
                </Card>
            </DocContainer>
        );

        layout(<ProgressPage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
