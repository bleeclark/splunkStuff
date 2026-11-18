# Visualization packages

Installable tarballs of `so_BUI_pickulationts` **custom visualizations** (KPI line + Data pie and the rest of the gallery).

| File | Notes |
| --- | --- |
| `so_BUI_pickulationts-visualizations-latest.tgz` | Always the newest package |
| `so_BUI_pickulationts-visualizations-YYYYMMDDHHMM.tgz` | Timestamped copy of a build |

## Install (other computer / Windows OK)

```bash
tar -xzf so_BUI_pickulationts-visualizations-latest.tgz -C "$SPLUNK_HOME/etc/apps"
$SPLUNK_HOME/bin/splunk restart
```

Or use **Manage Apps → Install app from file** and pick the `.tgz`.

After restart:

1. Open **Search**
2. Pick visualization **SplunkStuff - KPI loaded line (JavaScript)** or **SplunkStuff - Data pie (JavaScript)**
3. Open **Format** — options should appear without extra config

### Defaults that transfer as-is

- **Line:** Y scale **Auto**, background **transparent** (no good/bad trend colors), dual-series / compare available in Format
- **Pie:** Palette **Dashboard Studio** (`#7B56DB`, `#009CEB`, `#00CDAF`, …), background `#01417F`

No Format toggles need to be set for a normal transfer. Saved dashboards keep their own Format overrides.

### Rebuild package from this repo

```bash
cd packages/splunk-one
yarn package:viz
```

**2026-11-18:** Y auto-scale for line; Studio pie palette default; Format/SPL harnesses green; AppleDouble-safe packaging (`COPYFILE_DISABLE`).

**2026-11-11:** Format section labels fixed (no parentheses); `splunkstuff_kpi_line` registered in `visualizations.conf`.
