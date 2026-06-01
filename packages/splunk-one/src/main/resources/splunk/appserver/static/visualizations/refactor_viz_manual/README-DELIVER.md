## What this is

**Refactor viz manual:** same **runtime behavior and formatter options** as [`splunkstuff_kpi_line`](../splunkstuff_kpi_line/) / [`splunkstuff_kpi_line_verbose`](../splunkstuff_kpi_line_verbose/), with its own viz id and config namespace.

`visualization.js` matches `splunkstuff_kpi_line` except `VIZ_ID`, `NS`, and `REFACTOR_VIZ_MANUAL_DEBUG`. It **`define`s** `./splunkstuffTrendColors` and `./splunkstuffVizHoverMath` (copies in this folder, synced from repo `visualizations/_shared/` on `yarn build`).

## Files

- `visualization.js` — AMD viz.
- `formatter.html` — same controls as verbose.
- `visualization.css` — `splunkstuff-kpi-line-viz` BEM.
- `splunkstuffTrendColors.js`, `splunkstuffVizHoverMath.js` — per-viz copies of shared AMD helpers.
- `preview.png`, `visualizations.conf.snippet`.

## Debug

```js
window.REFACTOR_VIZ_MANUAL_DEBUG = true;
```

Hard-refresh. Same `log()`-style traces as `splunkstuff_kpi_line`.

## Deploy

Copy **`deliver/refactor_viz_manual/`** after `yarn build` (includes the two `splunkstuff*.js` files next to `visualization.js`).

## Install

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy this directory to `appserver/static/visualizations/refactor_viz_manual/`, restart Splunk.

```xml
<viz type="so_BUI_pickulationts.refactor_viz_manual">
```

## Data

Column-major results; `_time` when present; last all-numeric non-`_time` column for the series.
