import React from 'react';
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
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 11,
    lineHeight: 1.45,
    background: 'rgba(0,0,0,0.06)',
    padding: 12,
    borderRadius: 4,
    overflowX: 'auto',
    margin: '12px 0 0',
    whiteSpace: 'pre-wrap',
};

getUserTheme()
    .then((theme) => {
        const ArchitecturePage = () => (
            <DocContainer>
                <Heading level={1} style={{ marginBottom: 8 }}>
                    Architecture
                </Heading>
                <Paragraph style={{ marginBottom: 24, maxWidth: 720 }}>
                    Data flow, contracts, and composition for this app’s custom single
                    value experience. Names match the implementation in{' '}
                    <span style={codeStyle}>NewSingleValue.jsx</span> and the Start page.
                </Paragraph>

                <Heading level={2} style={{ marginBottom: 12 }}>
                    1. System architecture (data flow)
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: end-to-end path from search results to the card UI.
                </Paragraph>
                <Card>
                    <Card.Body>
                        <pre style={preStyle}>
                            {`Splunk Search / API
        ↓
Raw results (rows)
        ↓
Adapter (shape rows → columns + fields, e.g. withAnchors / toLocalDataSource)
        ↓
dataSources (Splunk visualization format)
        ↓
NewSingleValue
        ↓
SingleValue + FixedSparkline
        ↓
UI card`}
                        </pre>
                        <Paragraph style={{ marginBottom: 0, marginTop: 16 }}>
                            Why this matters: it shows clear separation of data,
                            transformation, and presentation, and that the pipeline is
                            intentional—not a single blob of inline logic.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    2. Data transformation pipeline
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: how raw rows become the structure{' '}
                    <span style={codeStyle}>SingleValue</span> consumes.
                </Paragraph>
                <Card>
                    <Card.Body>
                        <pre style={preStyle}>
                            {`Raw rows
[{ _time, total }, ...]

        ↓ validate
Filter non-finite values; align times with values

        ↓ transform
Extract:
  times[]
  values[]

        ↓ convert
columns: [times, values]
fields: [{ name: "_time" }, { name: "sparklineValues" }]

        ↓ output
dataSources.primary.data`}
                        </pre>
                        <Paragraph style={{ marginBottom: 0, marginTop: 16 }}>
                            Why this matters: you respect the visualization data
                            contract, avoid passing opaque objects, and keep iteration
                            and typing predictable for the viz layer.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    3. Component composition
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: how the Start page composes the custom widget.
                </Paragraph>
                <Card>
                    <Card.Body>
                        <pre style={preStyle}>
                            {`StartPage
   ↓
NewSingleValue
   ├── Splunk SingleValue (major value, trend, options)
   └── FixedSparkline (overlay)`}
                        </pre>
                        <Paragraph style={{ marginBottom: 0, marginTop: 16 }}>
                            Why this matters: separation of concerns, composability, and
                            avoiding a single file that owns everything.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    4. Visualization rendering (layout)
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: how the sparkline sits on top of the Splunk single
                    value region.
                </Paragraph>
                <Card>
                    <Card.Body>
                        <pre style={preStyle}>
                            {`[ Card container (position: relative) ]

   ┌──────────────────────────┐
   │   Major value / trend    │
   │   Subheader              │
   │                          │
   │      (overlay, z-index)  │
   │   ───────────────────    │  ← FixedSparkline
   │                          │
   └──────────────────────────┘`}
                        </pre>
                        <Paragraph style={{ marginBottom: 0, marginTop: 16 }}>
                            Why this matters: explicit layout and stacking; the custom
                            line replaces or augments the built-in sparkline with
                            controlled scaling and styling.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    5. Data interface contract
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: the shape{' '}
                    <span style={codeStyle}>NewSingleValue</span> expects when supplying{' '}
                    <span style={codeStyle}>dataSources</span>.
                </Paragraph>
                <Card>
                    <Card.Body>
                        <Heading level={3} style={{ marginTop: 0 }}>
                            Input (primary data source)
                        </Heading>
                        <pre style={preStyle}>
                            {`dataSources = {
  primary: {
    data: {
      columns: [
        [time1, time2, ...],
        [value1, value2, ...]
      ],
      fields: [
        { name: "_time" },
        { name: "sparklineValues" }
      ]
    },
    meta: {}
  }
}`}
                        </pre>
                        <Paragraph style={{ marginBottom: 0, marginTop: 16 }}>
                            Why this matters: a stable interface keeps the component
                            reusable and avoids tight coupling to one search shape.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    6. Props to behavior mapping
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: how presentation stays config-driven.
                </Paragraph>
                <Card>
                    <Card.Body>
                        <List>
                            <List.Item>
                                <span style={codeStyle}>sparkMin</span> /{' '}
                                <span style={codeStyle}>sparkMax</span> — Y-axis scale
                                for <span style={codeStyle}>FixedSparkline</span>
                            </List.Item>
                            <List.Item>
                                <span style={codeStyle}>sparkStroke</span> — line color
                            </List.Item>
                            <List.Item>
                                <span style={codeStyle}>sparkStrokeWidth</span> — line
                                thickness
                            </List.Item>
                            <List.Item>
                                <span style={codeStyle}>sparkHeight</span> (and padding
                                props) — overlay geometry
                            </List.Item>
                            <List.Item>
                                <span style={codeStyle}>textColor</span>,{' '}
                                <span style={codeStyle}>goodColor</span>,{' '}
                                <span style={codeStyle}>badColor</span> — value and
                                background semantics
                            </List.Item>
                            <List.Item>
                                <span style={codeStyle}>options.unit</span> (merged into
                                SingleValue) — suffix for major value and spark hover
                            </List.Item>
                        </List>
                        <Divider style={{ margin: '16px 0' }} />
                        <Paragraph style={{ marginBottom: 0 }}>
                            Why this matters: behavior is driven by props and options,
                            not hardcoded magic numbers scattered through JSX.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    7. Registry / visualization system (pattern)
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: how a dashboard could resolve viz types dynamically
                    (forward-looking pattern).
                </Paragraph>
                <Card>
                    <Card.Body>
                        <pre style={preStyle}>
                            {`Visualization registry (conceptual)

{
  single_value: NewSingleValue,
  ...
}

        ↓ lookup
config.type === "single_value"

        ↓ render
<NewSingleValue ... />`}
                        </pre>
                        <Paragraph style={{ marginBottom: 0, marginTop: 16 }}>
                            Why this matters: scalable dashboards, consistent wiring,
                            and room to add more visualization types without rewriting
                            shell code.
                        </Paragraph>
                    </Card.Body>
                </Card>

                <Heading level={2} style={{ marginTop: 28, marginBottom: 12 }}>
                    8. Before vs after
                </Heading>
                <Paragraph style={{ marginBottom: 8, maxWidth: 720 }}>
                    What to show: how structure improved from a flat page script to a
                    layered design.
                </Paragraph>
                <Card>
                    <Card.Body>
                        <Heading level={3} style={{ marginTop: 0 }}>
                            Before
                        </Heading>
                        <pre style={preStyle}>
                            {`index.jsx
  └── hardcoded feed
  └── inline logic
  └── default Splunk sparkline (scaling / display limits)`}
                        </pre>
                        <Heading level={3} style={{ marginTop: 20 }}>
                            After
                        </Heading>
                        <pre style={preStyle}>
                            {`dataSources (or feed → prepared columns)
  ↓
NewSingleValue (anchoring, options, overlay)
  ├── SingleValue
  └── FixedSparkline`}
                        </pre>
                        <Paragraph style={{ marginBottom: 0, marginTop: 16 }}>
                            Why this matters: the story is easy to tell—data contract,
                            transformation, and UI are explicit, which is what you want
                            in design reviews and interviews.
                        </Paragraph>
                    </Card.Body>
                </Card>
            </DocContainer>
        );

        layout(<ArchitecturePage />, { theme });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.textContent = String(e);
        document.body.appendChild(errorEl);
    });
