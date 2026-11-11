# Visualization packages

Installable tarballs of `so_BUI_pickulationts` **custom visualizations** (not the full React pages).

| File | Notes |
| --- | --- |
| `so_BUI_pickulationts-visualizations-latest.tgz` | Always the newest package |
| `so_BUI_pickulationts-visualizations-202611111220.tgz` | Timestamped copy of this build |

```bash
tar -xzf so_BUI_pickulationts-visualizations-latest.tgz -C "$SPLUNK_HOME/etc/apps"
$SPLUNK_HOME/bin/splunk restart
```

**2026-11-11:** Format section labels fixed (no parentheses) so Search Format options render; `splunkstuff_kpi_line` added to `visualizations.conf`.
