## What this is

**Verbose** twin of [`splunkstuff_kpi_line`](../splunkstuff_kpi_line/): same runtime behavior and formatter keys, with **expanded comments** in `visualization.js` / `formatter.html` and **structured logging** when you enable debug in the browser.

Splunk dashboard **custom visualization** (readable RequireJS AMD — **not** a Webpack bundle):

- `visualization.js` — same logic as KPI line; file header documents data contract, config keys, hover math, formatter pitfalls.
- `formatter.html` — same controls; HTML comment lists **short option names** ↔ sections.
- `visualization.css` — shared BEM prefix `bgdhamp-kpi-line-viz` (pixel match to non-verbose viz).
- `preview.png` — picker thumbnail.

Splunk folder / viz id: **`splunkstuff_kpi_line_verbose`**.

Formatter prefix:

`display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_line_verbose.*`

## Debug in the browser

On the dashboard, before or after load:

```js
window.SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG = true;
```

Hard-refresh. Each `updateView` logs an **`effectiveConfig`** object and **`console.table`** of all resolved options. Module load prints a one-time `console.info` with instructions.

## Portable handoff (one folder)

Trend colors and hover math live **inside** `visualization.js` (inlined from the same logic as the `bgdhampTrendColors` / `bgdhampVizHoverMath` AMD modules in the repo). You can copy **the whole** `deliver/splunkstuff_kpi_line_verbose/` directory to another machine’s `appserver/static/visualizations/` without extra sibling `.js` helpers.

Typical files:

- `visualization.js` — AMD module + inlined trend/hover helpers + verbose logging
- `visualization.css`, `formatter.html`, `preview.png`
- `visualizations.conf.snippet`, this README

## Build

From `packages/splunk-one/`:

```bash
yarn build
```

`yarn build` copies this directory (and the other vanilla AMD vizes) into `deliver/` and `stage/`.

## Install manually

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy **this entire directory** under `appserver/static/visualizations/splunkstuff_kpi_line_verbose/`, restart Splunk.

```xml
<viz type="so_BUI_pickulationts.splunkstuff_kpi_line_verbose">
```

## Data

Same as `splunkstuff_kpi_line`: column-major results; `_time` when present; last all-numeric non-`_time` column for the series.
