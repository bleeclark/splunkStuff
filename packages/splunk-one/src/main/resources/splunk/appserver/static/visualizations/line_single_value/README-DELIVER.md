## What this is

Splunk dashboard **custom visualization** (RequireJS AMD, no React bundle):

- `visualization.js` — viz logic (`define(['api/SplunkVisualizationBase'], …)`).
- `formatter.html` — Format editor (Y min/max, colors, labels).
- `visualization.css` — layout and typography aligned with fixed single value.
- `preview.png` — visualization picker thumbnail.
- `visualizations.conf.snippet` — register the viz inside `default/visualizations.conf`.

Splunk folder name / viz id: **`line_single_value`** (maps to stanza `[line_single_value]`).

## Deliver folder

Repo root `yarn build` runs webpack for pages and copies this directory to:

`packages/splunk-one/deliver/line_single_value/`

Zip that folder (or merge individual files into your Splunk app) for handoff.

## Install into Splunk

Assume Splunk app id **`splunk-one`** (`$SPLUNK_HOME/etc/apps/splunk-one/`).

Copy into the app tree:

| File                         | Destination path under the app                                                       |
|-----------------------------|---------------------------------------------------------------------------------------|
| `visualization.js`          | `$SPLUNK_HOME/etc/apps/splunk-one/appserver/static/visualizations/line_single_value/` |
| `visualization.css`         | *(same folder)*                                                                     |
| `formatter.html`          | *(same folder)*                                                                     |
| `preview.png`               | *(same folder)*                                                                     |

Merge `visualizations.conf.snippet` into:

`$SPLUNK_HOME/etc/apps/splunk-one/default/visualizations.conf`

If this repo ships the splunk-one app tarball, **`default/visualizations.conf` already contains `[line_single_value]`**.

Optional: defaults for formatter-backed keys ship in **`default/savedsearches.conf`** and are declared in **`default/savedsearches.conf.spec`**.

Restart Splunk (or follow your Splunk Web reload practice).

## Data expectations

Same as **fixed_single_value**: **column-major** results; viz uses the **last column whose values are all numeric** as the series.

Example SPL:

```spl
| makeresults count=6
| streamstats count as i
| eval value=random()%100
| fields value
```

## Formatter namespace

Keys resolve as:

`display.visualizations.custom.splunk-one.line_single_value.<prop>`

If the target app id is not `splunk-one`, edit `NS` in `visualization.js` and reinstall.
