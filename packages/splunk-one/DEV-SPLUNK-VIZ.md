# Splunk custom viz — local dev refresh

Splunk does **not** hot-reload `formatter.html` or `visualization.js`. After editing files under `src/main/resources/splunk/appserver/static/visualizations/`, run:

```bash
cd packages/splunk-one
yarn dev:splunk-viz
```

That script:

1. Runs `yarn build` (webpack + copy to `stage/` + `deliver/`)
2. Removes stale `local/data/ui/views/custom_viz_gallery.xml` override (unless `SYNC_SPLUNK_GALLERY_KEEP_LOCAL=1`)
3. Verifies `formatter.html`, `visualization.js`, and `visualization.css` match between `src/` and `stage/`
4. Prints Splunk UI steps (hard refresh, format Apply, optional restart)

## One viz only

```bash
yarn dev:splunk-viz --viz splunkstuff_kpi_sparkline
```

## Optional Splunk restart

```bash
SPLUNK_REFRESH_RESTART=1 yarn dev:splunk-viz
```

Requires `SPLUNK_HOME` (defaults to `/Applications/Splunk` on macOS if present).

## App symlink

Splunk should load this repo’s `stage/` folder:

```bash
export SPLUNK_HOME=/Applications/Splunk   # or your install
yarn link:app
```

## formatter.html vs saved panel options

| What you change | What updates |
|-----------------|--------------|
| `formatter.html` default `value="..."` | Only panels that **never saved** that option |
| Field cleared in Format UI + Apply | That panel’s saved config (empty hides labels when `optLabel` is used) |
| `visualization.js` | Chart behavior after build + cache bust / restart |

## Watch mode (webpack + vanilla viz copy)

```bash
yarn start
```

Still refresh Splunk in the browser after each copy; use `yarn dev:splunk-viz` when the format menu looks stale.
