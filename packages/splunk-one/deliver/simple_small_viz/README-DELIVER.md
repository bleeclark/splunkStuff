## What this is

Tiny Splunk dashboard custom visualization:

- `visualization.js` - vanilla AMD compact latest-value tile.
- `formatter.html` - label, unit, background, and text color options.
- `visualization.css` - small tile styling.
- `visualizations.conf.snippet` - stanza to register the viz.

Splunk folder / viz id: **`simple_small_viz`**. Formatter prefix:

`display.visualizations.custom.so_BUI_pickulationts.simple_small_viz.*`

## Install manually

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, copy the full `simple_small_viz/` directory under `appserver/static/visualizations/`, then restart Splunk or reload per your local practice.

Example search:

```spl
| makeresults count=5 | streamstats count as value
```
