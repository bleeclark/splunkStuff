# Risk Anomaly Detection React App - Simple TDD

**Status:** Implemented  
**Last updated:** 2026-06-23  
**App:** `so_BUI_pickulationts`  
**Main page:** `/app/so_BUI_pickulationts/risk`

## 1. Purpose

This React app is a Splunk page for investigating risk anomalies. It gives analysts one place to filter risk data, review score movement over time, inspect entity/category/domain breakdowns, and hide panels that do not have useful data.

The page is loaded by Splunk through `risk.html`, which pulls the built React bundle from:

```text
stage/appserver/static/pages/risk.js
```

## 2. Main User Flow

1. Open the Risk Anomaly Detection page.
2. Choose a time range, business unit, severity, domain, entity type, or entity.
3. Click **Submit**.
4. The page refreshes all panels using the applied filters.
5. Optional: turn on **Hide empty panels** so panels with no data disappear.

## 3. Main Files

| Area | File |
|------|------|
| Page entry | `src/main/webapp/pages/risk/index.jsx` |
| Page layout helpers | `src/main/webapp/pages/risk/RiskStyles.jsx` |
| Filter state provider | `src/main/webapp/pages/risk/context/DashboardFilterProvider.jsx` |
| Filter UI | `src/main/webapp/pages/risk/filters/GlobalFilterBar.jsx` |
| Time range picker and filter controls | `src/main/webapp/pages/risk/filters/FilterControl.jsx` |
| Filter definitions | `src/main/webapp/pages/risk/filters/filterCatalog.js` |
| URL sync | `src/main/webapp/pages/risk/filters/filterUrlSync.js` |
| Splunk token mapping | `src/main/webapp/pages/risk/filters/filtersToSplunkParams.js` |
| Data hook | `src/main/webapp/pages/risk/hooks/useRiskData.js` |
| Splunk REST search client | `src/main/webapp/pages/risk/data/splunkSearchClient.js` |
| Shared panel shell | `src/main/webapp/pages/risk/panels/PanelShell.jsx` |
| Tables and histogram panels | `src/main/webapp/pages/risk/panels/RiskTablePanels.jsx` |
| Risk line chart | `src/main/webapp/pages/risk/panels/RiskTrendChart.jsx` |

## 4. What Was Built

### React Risk Page

The page now renders a practical investigation dashboard instead of the older mixed chart/table layout.

Current panel order:

1. Risk Scores Table
2. Risk Score Over Time line chart
3. Entity Category Table and Domain Distribution Histogram
4. Calendar Risk Table
5. Severity Breakdown Table and Anomaly Rows Table

The layout uses a consistent panel stack and proportional two-column rows.

### Global Filter Bar

The filter card was cleaned up and made more usable.

It includes:

- Time range
- Business unit
- Severity
- Domain
- Entity type
- Entity
- Hide empty panels
- Submit
- Reset

The button text was changed from **Apply filters** to **Submit**.

### Time Range Selector

The time range control now opens an inline selector instead of an overlay. This avoids covering other controls.

The selector has these sections:

- Presets
- Relative
- Real-time
- Date Range
- Advanced

Examples:

- Last 15 minutes
- Last 60 minutes
- Last 24 hours
- Last 7 days
- Today
- Yesterday
- Real-time 5 minutes
- Real-time 30 minutes
- Custom date range
- Advanced earliest/latest tokens

### URL Persistence

Filter state is written into the URL so the page can be refreshed or shared.

Important URL params:

| Param | Meaning |
|-------|---------|
| `from` | Custom start date |
| `to` | Custom end date |
| `timeRange` | Preset value |
| `earliest` | Advanced earliest token |
| `latest` | Advanced latest token |
| `bu` | Business unit |
| `domain` | Domain list |
| `entityType` | Entity type |
| `entities` | Entity IDs |
| `severity` | Severity list |
| `entityFocus` | Selected entity |
| `hideEmpty` | `1` means hide empty panels |
| `data` | `splunk` enables Splunk REST mode |

### Empty Panel Behavior

The dashboard now supports empty-panel handling.

If **Hide empty panels** is off:

- Empty panels still show.
- They use a compact empty state instead of taking up large space.

If **Hide empty panels** is on:

- Empty panels return `null`.
- The row layout collapses correctly.
- Remaining panels resize and fill the available row space.

This fixed the issue where an empty left-side panel disappeared but still left a blank column.

### Panel Spacing and Sizing

Panel spacing was cleaned up so the dashboard looks more proportional.

Changes:

- One shared panel stack controls vertical gaps.
- Cards no longer add their own extra bottom margin.
- Two-column rows collapse hidden panels.
- Empty panels are compact.
- The histogram height is based on the number of bars.
- Table headers and table cells use consistent padding.
- Table columns use fixed layout so spacing is more even.

### Tables

The table panels were rebuilt with consistent spacing and column behavior.

Tables:

- Risk Scores Table
- Entity Category Table
- Calendar Risk Table
- Severity Breakdown Table
- Anomaly Rows Table

### Domain Histogram

The Domain Distribution panel is a histogram, not a table.

It shows:

- Domain label
- Horizontal bar
- Risk score and percentage

Its height now scales to the number of rows so one-bar results do not create an oversized card.

### Line Chart

The Risk Time panel is a line chart.

It shows risk score over time and supports anomaly point buttons when anomalies exist.

If there is no trend data:

- It shows a compact empty state, or
- It hides completely when **Hide empty panels** is enabled.

### Loading and Progress

Splunk-backed searches show loading UI.

When `data=splunk` is active:

- Panels show a wait spinner.
- Panels show "Running search..." with dispatch state.
- Panels show a progress bar when Splunk reports progress.
- Searches can timeout after the configured max wait.

Mock mode usually loads immediately, so the spinner may not appear.

## 5. Data Modes

### Mock Mode

Default mode. Uses local fixtures so the page can be developed without real Splunk indexes.

### Splunk Mode

Enabled with:

```text
?data=splunk
```

In this mode, the app dispatches Splunk searches through the REST API and maps the results into the same panel data shapes used by mock mode.

## 6. Filter Apply Model

The app has draft filters and applied filters.

- Draft filters update while the user edits controls.
- Applied filters update only after **Submit**.
- This prevents panels from refreshing on every small filter change.
- Reset restores the default filters.

## 7. Testing

Focused risk tests live in:

```text
test/risk/filterCatalog.test.mjs
```

Covered behavior includes:

- Filter dependency clearing
- Splunk token mapping
- Relative time range tokens
- Real-time time range URL round-trip
- Advanced time range URL round-trip
- Hide empty panels URL round-trip
- Severity filtering
- Invalid entity-without-type filter state
- Splunk job progress parsing
- Search abort and unknown-search handling

## 8. Build and Verification

Use these commands from `packages/splunk-one`:

```bash
yarn test:risk
yarn build
yarn verify:risk-dashboard
```

Build output updates the staged Splunk app, especially:

```text
stage/appserver/static/pages/risk.js
stage/appserver/templates/risk.html
```

## 9. Splunk Cache Notes

Splunk caches JavaScript aggressively.

For visible React page changes:

1. Update the source files.
2. Bump the `page_asset_version` in `risk.html`.
3. Run `yarn build`.
4. Hard refresh the browser.
5. Restart Splunk Web if the old bundle is still cached.

## 10. Current Result

The React risk page now has:

- Clean filter UX
- Inline Splunk-style time picker
- Submit-based refresh
- URL-shareable state
- Loading spinner and progress bar in Splunk mode
- Tables, line chart, and histogram
- Compact empty states
- Optional hidden empty panels
- More even spacing and proportional panel layout
