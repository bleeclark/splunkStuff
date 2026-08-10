# BGDHamp KPI + sparkline (React) — remade folder

**Viz id:** `splunkstuff_kpi_sparkline_react_remade`  
**NS:** `display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_sparkline_react_remade.*`

Copy this folder to:

`$SPLUNK_HOME/etc/apps/<APP_ID>/appserver/static/visualizations/splunkstuff_kpi_sparkline_react_remade/`

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, then restart Splunk.

**Local dev:** from `packages/splunk-one`, run `yarn dev:splunk-viz` after editing `formatter.html` or `visualization.js` (see `DEV-SPLUNK-VIZ.md`).

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

**Panel type:** `<APP_ID>.splunkstuff_kpi_sparkline_react_remade`  
**Time range:** Last 4 hours (or match your `_time` span).

## Formatter highlights

Spark scale (min/max/auto), trend colors + invert, headline (unit, precision, delta mode), spark line toggle/stroke, target line, threshold band, empty text.
