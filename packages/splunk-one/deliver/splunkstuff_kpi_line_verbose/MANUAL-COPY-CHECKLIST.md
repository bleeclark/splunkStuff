# Manual copy checklist

Target Splunk folder:

```text
$SPLUNK_HOME/etc/apps/<APP_ID>/appserver/static/visualizations/splunkstuff_kpi_line_verbose/
```

Copy or type these files into that folder:

```text
visualization.js
formatter.html
visualization.css
preview.png
README-DELIVER.md
```

Then merge this stanza into:

```text
$SPLUNK_HOME/etc/apps/<APP_ID>/default/visualizations.conf
```

```conf
[splunkstuff_kpi_line_verbose]
label = BGDHamp — KPI loaded line verbose (documented AMD)
description = Same options as splunkstuff_kpi_line with expanded source comments and console diagnostics (SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG).
default_height = 200
search_fragment = | timechart span=1h avg(my_metric) as value
supports_drilldown = 0
supports_trellis = 0
```

## Verification

Expected line counts:

```text
1412 visualization.js
 210 formatter.html
 128 visualization.css
   9 visualizations.conf.snippet
  58 README-DELIVER.md
```

Expected SHA-256 hashes:

```text
981af013b8555a2d2d2684535a774d276fcf2a92731f4210c03d51797ee84b3a  visualization.js
7f494741ad1df2882bd56bd2fadac9846bcc3f8e3797d4c12ca3a2c9b07b22a7  formatter.html
fa33bb269e2d36490015916f44a2a0b9640c2416c405d275ebc9193d469694e2  visualization.css
eea8d44a97c7cf87fe9a36e4df26adb428d270e45b23aa581d9150638658f7dc  visualizations.conf.snippet
83927aa550638074829ffa5569b8fa0c26dd8e0b1f705f6ff2bc63275fb40eb0  README-DELIVER.md
8f487a6a5b88bc2ebbe01f01a26d28f23e17a106b31271f159e9e58d5ca42473  preview.png
```

On macOS/Linux, verify with:

```bash
wc -l visualization.js formatter.html visualization.css visualizations.conf.snippet README-DELIVER.md
shasum -a 256 visualization.js formatter.html visualization.css visualizations.conf.snippet README-DELIVER.md preview.png
```

## Typing order

1. Create the visualization folder named exactly `splunkstuff_kpi_line_verbose`.
2. Type `visualization.css` first. It is short and gives a quick confidence check.
3. Type `formatter.html` next.
4. Type `visualization.js` last. Save every 100-150 lines and compare the current line number against the source.
5. Add the `visualizations.conf` stanza.
6. Restart Splunk or reload the app, then hard-refresh the browser.

## Runtime smoke test

Use this visualization type in Simple XML:

```xml
<viz type="so_BUI_pickulationts.splunkstuff_kpi_line_verbose">
```

Enable verbose browser logging from DevTools:

```js
window.SPLUNKSTUFF_KPI_LINE_VERBOSE_DEBUG = true;
```

Hard-refresh. The console should print that `splunkstuff_kpi_line_verbose` loaded, then log an `effectiveConfig` object on update.
