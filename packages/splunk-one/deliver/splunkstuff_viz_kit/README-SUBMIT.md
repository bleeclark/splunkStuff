# SplunkStuff custom visualization kit (submit / handoff)

Splunk does not use a single “viz file.” A dashboard custom visualization is always a **small bundle** of files under one folder, plus one stanza in **`default/visualizations.conf`**.

## What ships in this repo

| Role | Path (inside the Splunk app, e.g. `splunk-one`) |
| --- | --- |
| Viz logic | `appserver/static/visualizations/<viz_id>/visualization.js` |
| Format editor UI | `appserver/static/visualizations/<viz_id>/formatter.html` |
| Styles | `appserver/static/visualizations/<viz_id>/visualization.css` |
| Picker thumbnail | `appserver/static/visualizations/<viz_id>/preview.png` |
| Registration (label, search picker) | `default/visualizations.conf` → `[<viz_id>]` |
| Optional: demo dashboard | `default/data/ui/views/custom_viz_gallery.xml` |

Per-viz “zip this folder” copies (without the app shell) still live under `deliver/<viz_id>/` with their own `README-DELIVER.md`.

## Install on Splunk

1. Copy the whole app (or merge `default/` + `appserver/static/visualizations/` + `metadata/`) into `$SPLUNK_HOME/etc/apps/<your_app_id>/`.
2. If your app id is **not** `splunk-one`, every `formatter.html` and `visualization.js` must use the same app id in `display.visualizations.custom.<app_id>.<viz_id>.*` (see source and rebuild from this repo).
3. Restart Splunk (or reload per your practice).

## Find and use in the UI

- **Dashboards:** open **SplunkStuff custom viz gallery** (view id `custom_viz_gallery`) in the `splunk-one` app, or search dashboards for **SplunkStuff**.
- **Search → Visualization:** run a search, open the visualization drop-down, filter by **SplunkStuff** (labels are set in `visualizations.conf`).

## Copy of the demo dashboard (Simple XML)

The canonical file is in the app tree:

`src/main/resources/splunk/default/data/ui/views/custom_viz_gallery.xml`

A duplicate is kept here for email/zip handoff without the rest of the repo:

- `custom_viz_gallery.xml` (same content)
