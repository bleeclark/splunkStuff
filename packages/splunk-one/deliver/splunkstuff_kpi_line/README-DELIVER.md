## What this is

Splunk dashboard **custom visualization** (readable RequireJS AMD — **not** a Webpack bundle).

Classic **4-file** deliver (no separate helper AMD modules):

- `visualization.js` — viz logic with **inlined** trend + hover math (`define(['api/SplunkVisualizationBase'], …)` only)
- `visualization.css` — tile layout and in-chart hover annotation
- `formatter.html` — Format menu (Classic line options + Custom extras)
- `preview.png` — picker thumbnail

Also includes `visualizations.conf.snippet` / this README for packaging — not required at runtime beyond the four assets above.

Splunk folder / viz id: **`splunkstuff_kpi_line`**.

Formatter prefix:

`display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_line.*`

## Build

From `packages/splunk-one/`:

```bash
yarn build
```

Webpack does **not** overwrite this folder. `yarn build` copies the 4 runtime assets to `deliver/splunkstuff_kpi_line/` and into `stage/` via the readable-vanilla sync.

**Hover / tooltip:** Document-level capture listeners and SVG **xMidYMid meet** math live inside `visualization.js`. After editing, hard-refresh Splunk.

## Install manually

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy this directory under `appserver/static/visualizations/splunkstuff_kpi_line/`, restart Splunk.

Dashboard:

```xml
<viz type="so_BUI_pickulationts.splunkstuff_kpi_line">
```

## Data

Column-major results; uses `_time` when present and Auto / Format value field for the series.
