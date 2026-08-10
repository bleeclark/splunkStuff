# splunkstuff_kpi_sparkline — handoff

**Viz id:** `splunkstuff_kpi_sparkline`  
**NS:** `display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_sparkline.*`

Copy this folder to:

`$SPLUNK_HOME/etc/apps/<APP_ID>/appserver/static/visualizations/splunkstuff_kpi_sparkline/`

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, then restart Splunk.

**Local dev:** from `packages/splunk-one`, run `yarn dev:splunk-viz` after editing `formatter.html` or `visualization.js` (see `DEV-SPLUNK-VIZ.md`).

## Data contract (Single Value–compatible)

- **One metric** (with or without `_time`): shows the KPI number; sparkline/delta hidden until 2+ points.
- **Time series** (`_time` + numeric): full KPI + delta + sparkline.
- **Format → Value field**: Auto, or pick `value` / `total_count` / `count` / etc.
- Missing metric → empty state text (no hard error about `_time`).

## Test SPL

```spl
| makeresults count=72
| streamstats count as n
| eval _time = relative_time(now(), "-" . (n - 1) . "m@m")
| eval value = 28 + ((n * 13) % 52)
| fields _time value
| sort 0 _time
| tail 20
```

Single Value–like:

```spl
| makeresults | eval total_count=42 | fields total_count
```

**Panel type:** `<APP_ID>.splunkstuff_kpi_sparkline`  
**Time range:** Last 4 hours (or match your `_time` span).

## Formatter highlights

Value field, spark scale (min/max/auto), trend colors + invert, headline (unit, precision, delta mode, **major value font size**), spark line toggle/stroke, target line, threshold band, empty text.
