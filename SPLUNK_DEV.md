# Splunk-aligned local dev (splunkStuff)

This repo mirrors the **Splunk UI Toolkit / `@splunk/create` ReactSplunkApp** layout: a Yarn workspace with `packages/splunk-one` built by **Webpack** and `@splunk/webpack-configs`, the same `@splunk/react-page`, `@splunk/react-ui`, `@splunk/visualizations`, etc., that your `breakSplunk1` app uses.

## Prerequisites

- **Node.js** 20+ (Splunk documents 22+ for `@splunk/create`; this repo builds on 20+.)
- **Yarn classic** 1.x (`yarn install` at the repo root).
- **Splunk Enterprise** installed locally for the full UI (download from Splunk’s site). Set:

  ```bash
  export SPLUNK_HOME=/path/to/splunk
  export PATH="$SPLUNK_HOME/bin:$PATH"
  ```

## Install and build

From the repo root:

```bash
yarn install
yarn build
```

`yarn build` runs a production Webpack build and writes a Splunk app layout under `packages/splunk-one/stage/` (configs, `appserver/static/pages/start.js`, templates, etc.).

## Watch while you edit

```bash
yarn start
```

This runs `webpack --watch` for `@splunk/splunk-one`. After changing JSX/JS, rebuild output is under `stage/`. Refresh Splunk in the browser to load new assets (no hot reload inside Splunk).

## Link the app into Splunk

Once per machine (or after you remove the old symlink):

```bash
cd packages/splunk-one
yarn link:app
# Restart Splunk so it picks up the new app
splunk restart
```

Then open Splunk Web (often `https://localhost:8000` or `8001`), find the app **Splunk Stuff (local dev)** / id `so_BUI_pickulationts`, and open **SplunkStuff custom viz gallery** or **Start`.

`yarn link:app` creates `$SPLUNK_HOME/etc/apps/so_BUI_pickulationts` → `packages/splunk-one/stage`. On Windows the script uses `mklink` (may require an elevated shell).

## Syncing with your other computer (breakSplunk1)

1. On this Mac: `yarn build` so `packages/splunk-one/stage/` is current.
2. Copy the **whole** `stage/` tree (or full `src/main/resources/splunk` + run `yarn build` on work) into work Splunk as **`$SPLUNK_HOME/etc/apps/so_BUI_pickulationts/`** — app folder name must match `[package] id` in `app.conf`.
3. Remove old app folders on work if present (`splunk-one`, `itso_UI_visualizations`, `tso_ui_dab`) unless you still need them for other dashboards.
4. Dashboard panels must use `type="so_BUI_pickulationts.<viz_id>"` (not `splunk-one.*` or `fixed_line_value`).
5. Line viz folder name is **`line_single_value`** (work photos may show `fixed_line_value` — rename to match).
6. For **`fixed_loaded_line`**, ship the Webpack bundle from this repo (`visualization.js` + `formatter.html` + `visualization.css`); do not mix with work’s vanilla `makeRenderer` `visualization.js` unless you intentionally switch implementations.
7. Restart Splunk on work; hard-refresh the browser.

Handoff zip source: `packages/splunk-one/deliver/splunkstuff_viz_kit/` plus per-viz folders under `deliver/`.

## App id and URLs

`[package] id` in `src/main/resources/splunk/default/app.conf` is **`so_BUI_pickulationts`**. The HTML bootstrap in `appserver/templates/start.html` loads:

`/static/app/so_BUI_pickulationts/pages/start.js`

Custom viz formatter keys use `display.visualizations.custom.so_BUI_pickulationts.<viz_id>.*`. Dashboard panels use `type="so_BUI_pickulationts.<viz_id>"`.

If you rename the app id, update **app.conf**, **all `NS` strings** in viz source (then `yarn build` for React bundles), **dashboard XML `type=`**, and **templates** under `appserver/templates/`.

## Keith / ITSI trend colors

All five SplunkStuff custom visualizations share one contract (see `src/main/webapp/lib/splunkstuffTrendColors.js` and AMD `_shared/splunkstuffTrendColors.js`):

- **Trend** = last numeric point minus previous (`delta`)
- **delta >= 0** (up / flat) → tile background **#01417F** (blue), formatter key `goodColor`
- **delta < 0** (down) → tile background **#DFA611** (gold), formatter key `badColor`
- Line / loaded-line tiles paint the **full panel** with the trend color (not a split navy chart band)

Verify locally:

```bash
cd packages/splunk-one
yarn verify:trend-colors
yarn build
yarn link:app
```

In Splunk, open **SplunkStuff custom viz gallery**. Compare **Fixed loaded line React** and **vanilla AMD** on row 2 (same search — should match colors and trend).

If a panel still shows inverted colors, open **Format** and reset to defaults (saved format from an older build may have swapped pickers).

## Hover / tooltip verification (no Splunk login)

Use this when changing **LineChart** or **`fixed_loaded_line_vanilla`** hover behavior. Fast checks before you call a task done:

1. **Node — hit-test + series index math** (includes the **`chartWrap` taller than `svg`** case for vanilla AMD):

   ```bash
   cd packages/splunk-one
   yarn verify:viz-hover
   ```

2. **Playwright — React `LineChart` harness** (document-capture hover + portal tooltip):

   ```bash
   cd packages/splunk-one
   yarn playwright install chromium   # once per machine / CI image
   yarn build:hover-harness
   yarn test:playwright
   ```

   [`playwright.config.js`](packages/splunk-one/playwright.config.js) starts [`bin/serve-playwright-public.mjs`](packages/splunk-one/bin/serve-playwright-public.mjs), which rebuilds the harness then serves **`test/playwright/public/`** on **http://127.0.0.1:4173** (override with `PLAYWRIGHT_HARNESS_PORT`).

Splunk dashboard checks remain optional but recommended after `yarn build && yarn link:app`; the **vanilla AMD** viz is covered for hover **math** in Node only until a second browser harness exists.

## Optional: regenerate from Splunk

To scaffold a fresh app from Splunk’s generator (empty directory):

```bash
npx @splunk/create
```

Then merge your custom pages and components. See [Splunk UI `@splunk/create`](https://splunkui.splunk.com/Packages/create/).
