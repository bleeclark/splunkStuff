# BGDHamp custom visualization kit (submit / handoff)

Splunk does not use a single “viz file.” A dashboard custom visualization is always a **small bundle** of files under one folder, plus one stanza in **`default/visualizations.conf`**.

## What ships in this repo

| Role | Path (inside the Splunk app, e.g. `so_BUI_pickulationts`) |
| --- | --- |
| Viz logic | `appserver/static/visualizations/<viz_id>/visualization.js` |
| Format editor UI | `appserver/static/visualizations/<viz_id>/formatter.html` |
| Styles | `appserver/static/visualizations/<viz_id>/visualization.css` |
| Picker thumbnail | `appserver/static/visualizations/<viz_id>/preview.png` |
| Registration (label, search picker) | `default/visualizations.conf` → `[<viz_id>]` |
| Optional: demo dashboard | `default/data/ui/views/custom_viz_gallery.xml` |

Per-viz “zip this folder” copies (without the app shell) still live under `deliver/<viz_id>/` with their own `README-DELIVER.md`.

## Publish the viz instructions

1. From the repo root, run `yarn build` so `packages/splunk-one/deliver/` contains the latest formatter HTML, visualization JS/CSS, thumbnails, snippets, and README files.
2. Package `packages/splunk-one/deliver/splunkstuff_viz_kit/` plus any viz folders you are submitting from `packages/splunk-one/deliver/<viz_id>/`.
3. Include this `README-SUBMIT.md` as the top-level instruction file. Each per-viz folder also includes a `README-DELIVER.md` with the exact Splunk folder name, formatter prefix, config snippet, and install notes for that visualization.
4. Tell the publisher or Splunk admin to merge each `visualizations.conf.snippet` into `$SPLUNK_HOME/etc/apps/<your_app_id>/default/visualizations.conf`, copy each full `<viz_id>/` folder into `$SPLUNK_HOME/etc/apps/<your_app_id>/appserver/static/visualizations/`, then restart Splunk or reload per local ops practice.

## Install on Splunk

1. Copy the whole app (or merge `default/` + `appserver/static/visualizations/` + `metadata/`) into `$SPLUNK_HOME/etc/apps/<your_app_id>/`.
2. If your app id is **not** `splunk-one`, every `formatter.html` and `visualization.js` must use the same app id in `display.visualizations.custom.<app_id>.<viz_id>.*` (see source and rebuild from this repo).
3. Restart Splunk (or reload per your practice).

## Find and use in the UI

- **Dashboards:** open **BGDHamp custom viz gallery** (view id `custom_viz_gallery`) in the `splunk-one` app, or search dashboards for **BGDHamp**.
- **Search → Visualization:** run a search, open the visualization drop-down, filter by **BGDHamp** (labels are set in `visualizations.conf`).

## Copy of the demo dashboard (Simple XML)

The canonical file is in the app tree:

`src/main/resources/splunk/default/data/ui/views/custom_viz_gallery.xml`

A duplicate is kept here for email/zip handoff without the rest of the repo:

- `custom_viz_gallery.xml` (same content)
