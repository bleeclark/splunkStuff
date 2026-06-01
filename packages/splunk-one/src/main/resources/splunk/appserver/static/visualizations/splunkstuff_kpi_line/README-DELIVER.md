## What this is

Splunk dashboard **custom visualization** (readable RequireJS AMD — **not** a Webpack bundle):

- `visualization.js` — hand-editable viz logic (`define(['api/SplunkVisualizationBase'], …)`).
- `formatter.html` — extended format menu (LineChart-style options + legacy fixed_loaded_line parity ).
- `visualization.css` — tile layout and in-chart hover annotation.
- `preview.png` — picker thumbnail.

Splunk folder / viz id: **`splunkstuff_kpi_line`**.

Formatter prefix:

`display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_line.*`

## Build

From `packages/splunk-one/`:

```bash
yarn build
```

Webpack does **not** overwrite this folder. `yarn build` copies `visualization.js` + `visualization.css` to `deliver/splunkstuff_kpi_line/` and into `stage/` via the readable-vanilla sync.

**Per-viz AMD helpers** (same folder as `visualization.js`): `splunkstuffTrendColors.js`, `splunkstuffVizHoverMath.js` — `yarn build` syncs them from the repo `visualizations/_shared/` tree into this viz directory; copy **`deliver/splunkstuff_kpi_line/`** as a whole for handoff.

**Hover / tooltip:** Uses document-level capture listeners and SVG **xMidYMid meet** math from `splunkstuffVizHoverMath.js`. After editing, run `yarn verify:viz-hover` and redeploy; hard-refresh Splunk.

## Install manually

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy this full directory (including `formatter.html` and `preview.png`) under `appserver/static/visualizations/splunkstuff_kpi_line/`, restart Splunk.

Dashboard:

```xml
<viz type="so_BUI_pickulationts.splunkstuff_kpi_line">
```

## Data

Column-major results; uses `_time` when present and the last all-numeric non-`_time` column for the series.
