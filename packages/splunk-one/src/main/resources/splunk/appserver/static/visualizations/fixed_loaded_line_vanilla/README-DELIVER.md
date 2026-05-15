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

**Shared AMD helpers** (same copy pass): `_shared/splunkstuffTrendColors.js`, `_shared/splunkstuffVizHoverMath.js` — install **both** next to this viz under `appserver/static/visualizations/_shared/` (or ship the whole `fixed_loaded_line_vanilla` + `_shared` tree from this repo).

**Hover / tooltip:** Uses document-level capture listeners (`pointermove`, `pointerdown`, `mousemove`) and SVG **xMidYMid meet** math from `splunkstuffVizHoverMath.js` so index and crosshair match the cursor when the SVG is scaled. After editing, run `yarn verify:viz-hover` and redeploy; hard-refresh Splunk.

## Install manually

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy this directory under `appserver/static/visualizations/fixed_loaded_line_vanilla/`, restart Splunk.

Dashboard:

```xml
<viz type="so_BUI_pickulationts.fixed_loaded_line_vanilla">
```

## Data

Column-major results; uses `_time` when present and the last all-numeric non-`_time` column for the series.
