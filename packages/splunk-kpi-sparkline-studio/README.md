# SplunkStuff KPI + Sparkline — Dashboard Studio extension

**Viz id:** `splunkstuff_kpi_sparkline_studio`  
**Framework:** Splunk Dashboard Studio (`framework_type = studio_visualization`)  
**Requires:** Splunk **10.4+**

This package is separate from the legacy Classic viz `splunkstuff_kpi_sparkline` (Search + Simple XML).

## Build

```bash
cd packages/splunk-kpi-sparkline-studio
yarn install
node generate-config.mjs   # regenerate config.json from option definitions
yarn build
```

From repo root (builds studio + splunk-one + syncs to `stage/` and `deliver/`):

```bash
yarn build
```

## Install into Splunk

After `yarn build`, artifacts land in:

- `packages/splunk-one/stage/appserver/static/visualizations/splunkstuff_kpi_sparkline_studio/`
- `packages/splunk-one/deliver/splunkstuff_kpi_sparkline_studio/`

Use `yarn link:app` from `packages/splunk-one` or package via `yarn package:viz`.

## Dashboard Studio usage

1. Open **Dashboard Studio** → **Edit** → **Add chart**
2. Choose **SplunkStuff KPI + Sparkline** (Custom)
3. Attach a primary search with `_time` + numeric `value` (+ optional string `annotation`)

Example SPL:

```spl
| makeresults count=20
| streamstats count as n
| eval _time = relative_time(now(), "-" . (n - 1) . "m@m")
| eval value = 40 + n
| eval annotation = case(n=5, "Deploy", n=15, "Incident", true(), "")
| fields _time value annotation
| sort 0 _time
```

## Features

- Full legacy KPI sparkline formatter parity
- Native Single Value-style options (`align`, typography, abbreviations, null handling, trellis)
- **Sparkline area graph** (`showSparklineAreaGraph`, `sparklineAreaColor` at 20% opacity)
- Descriptive internal code (`resolveOptions`, `buildSparklineAreaPath`, `renderKpiSparklineTile`)

## Verify

```bash
yarn workspace @splunk/kpi-sparkline-studio run verify
# or after build:
node packages/splunk-one/bin/verify-studio-kpi-sparkline.js
```

## Cache notes

After changes: run `yarn build`, restart Splunk or reload the app, hard refresh the Studio dashboard. Confirm `data-ss-viz-build` on the tile root in DevTools.
