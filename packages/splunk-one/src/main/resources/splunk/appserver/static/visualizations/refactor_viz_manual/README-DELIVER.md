## What this is

**Refactor viz manual:** same **runtime behavior and formatter options** as [`splunkstuff_kpi_line`](../splunkstuff_kpi_line/) / [`splunkstuff_kpi_line_verbose`](../splunkstuff_kpi_line_verbose/) (shared BEM + LineChart-style controls), with its own viz id and config namespace.

`visualization.js` matches `splunkstuff_kpi_line` line-for-line except `VIZ_ID`, `NS`, and `REFACTOR_VIZ_MANUAL_DEBUG`. It **`define`s** `../_shared/splunkstuffTrendColors` and `../_shared/splunkstuffVizHoverMath` (not inlined), so the file is much smaller than a single-file verbose clone.

## Files

- `visualization.js` — AMD viz (see above).
- `formatter.html` — same controls as verbose; `{{VIZ_NAMESPACE}}` expands to `...refactor_viz_manual`.
- `visualization.css` — `splunkstuff-kpi-line-viz` BEM (same as KPI line vizzes).
- `preview.png` — picker thumbnail.
- `visualizations.conf.snippet` — stanza for hand-install.

## Debug

```js
window.REFACTOR_VIZ_MANUAL_DEBUG = true;
```

Hard-refresh. Same `log()`-style traces as `splunkstuff_kpi_line` (no `effectiveConfig` / `console.table`).

## Deploy

Copy **`deliver/refactor_viz_manual/`** after `yarn build`, and ensure **`appserver/static/visualizations/_shared/`** contains `splunkstuffTrendColors.js` and `splunkstuffVizHoverMath.js` (same as for `splunkstuff_kpi_line`). `yarn build` also fills `deliver/_shared/`.

## Install

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy this directory to `appserver/static/visualizations/refactor_viz_manual/`, restart Splunk.

```xml
<viz type="so_BUI_pickulationts.refactor_viz_manual">
```

## Data

Column-major results; `_time` when present; last all-numeric non-`_time` column for the series.
