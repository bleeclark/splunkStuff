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

Then open Splunk Web (often `https://localhost:8000`), find the app **Splunk Stuff (local dev)** / id `splunk-one`, and open the **Start** view.

`yarn link:app` creates `$SPLUNK_HOME/etc/apps/splunk-one` → `packages/splunk-one/stage`. On Windows the script uses `mklink` (may require an elevated shell).

## Syncing with your other computer

Keep paths aligned with `breakSplunk1/packages/splunk-one/...`. Edit here, verify with `yarn build` / Splunk, then copy the same relative files to the other repo.

## App id and URLs

`[package] id` in `src/main/resources/splunk/default/app.conf` is **`splunk-one`**. The HTML bootstrap in `appserver/templates/start.html` loads:

`/static/app/splunk-one/pages/start.js`

If you rename the app id, update **both** `app.conf` and `start.html` so they stay in sync.

## Optional: regenerate from Splunk

To scaffold a fresh app from Splunk’s generator (empty directory):

```bash
npx @splunk/create
```

Then merge your custom pages and components. See [Splunk UI `@splunk/create`](https://splunkui.splunk.com/Packages/create/).
