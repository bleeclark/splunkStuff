## What this is

Splunk dashboard **custom visualization** (readable RequireJS AMD — **not** a Webpack bundle):

- `visualization.js` — hand-editable viz logic (`define(['api/SplunkVisualizationBase'], …)`).
- `formatter.html` — format menu (same props as React `fixed_loaded_line`).
- `visualization.css` — tile layout.
- `preview.png` — picker thumbnail.

Splunk folder / viz id: **`fixed_loaded_line_vanilla`**.

Formatter prefix:

`display.visualizations.custom.so_BUI_pickulationts.fixed_loaded_line_vanilla.*`

## Build

From `packages/splunk-one/`:

```bash
yarn build
```

Webpack does **not** overwrite this folder. `yarn build` copies it to `deliver/fixed_loaded_line_vanilla/` and into `stage/` via the static Splunk tree copy.

**Per-viz AMD helpers** (same folder as `visualization.js`): `splunkstuffTrendColors.js`, `splunkstuffVizHoverMath.js` — `yarn build` syncs them from the repo `visualizations/_shared/` tree; copy **`deliver/fixed_loaded_line_vanilla/`** as a whole for handoff.

**Hover / tooltip:** Uses document-level capture listeners (`pointermove`, `pointerdown`, `mousemove`) and SVG **xMidYMid meet** math from `splunkstuffVizHoverMath.js` so index and crosshair match the cursor when the SVG is scaled. After editing, run `yarn verify:viz-hover` and redeploy; hard-refresh Splunk.

## Install manually

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy this directory under `appserver/static/visualizations/fixed_loaded_line_vanilla/`, restart Splunk.

Dashboard:

```xml
<viz type="so_BUI_pickulationts.fixed_loaded_line_vanilla">
```

## Data

Column-major results; uses `_time` when present and the last all-numeric non-`_time` column for the series.
