## What this is

Splunk dashboard **custom visualization** bundled with **Webpack** as AMD:

- **`visualization.js`** — React **`LineChart`** from this repo embedded with React/ReactDOM (`define(['api/SplunkVisualizationBase'], …)`).
- **`formatter.html`** — format menu (YC scale, colors, overlays, anomalies, drilldown).
- **`visualization.css`** — panel sizing wrapper for responsive **`ResizeObserver`**.
- **`preview.png`** — picker thumbnail.

Splunk folder / viz id: **`fixed_loaded_line`**. Formatter prefix:

`display.visualizations.custom.splunk-one.fixed_loaded_line.*`

## Build

From `packages/splunk-one/`:

```bash
yarn install
yarn build
```

Webpack emits the bundle plus static assets into:

1. **`src/main/resources/splunk/appserver/static/visualizations/fixed_loaded_line/`** — ship with the **`splunk-one`** app tarball.
2. **`deliver/fixed_loaded_line/`** — standalone “zip this folder” bundle for handoff.

## Install manually

Merge **`visualizations.conf.snippet`** into **`default/visualizations.conf`**, copy the **`fixed_loaded_line/`** directory tree under **`appserver/static/visualizations/`**, restart Splunk (or reload per your ops practice).

Full app builds already merge **`default/visualizations.conf`** in **`stage`** when running **`yarn build`**.

## Data

**Column-major** results. Viz uses:

- **`_time`** column if present → X/time axis and drilldown hints.
- The **last all-numeric column** that is **not `_time`** as the primary series (`LineChart` `values`), same convention as **`fixed_single_value_react`** (numeric column skips `_time`).

Example:

```spl
| makeresults count=12 | streamstats count as i | eval value=random()%100
```

## Namespace

If installing into an app whose id is not **`splunk-one`**, change **`NS`** in **`visualization.amd.jsx`** and rebuild.
