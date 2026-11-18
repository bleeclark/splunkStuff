# radial_meter — Splunk tutorial radial gauge

Based on [Build a custom visualization](https://help.splunk.com/en/splunk-enterprise/developing-views-and-apps-for-splunk-web/9.4/custom-visualizations/build-a-custom-visualization) (Splunk Enterprise 9.4). Vanilla AMD with native SVG (no D3/webpack).

**Viz id:** `radial_meter`  
**NS:** `display.visualizations.custom.so_BUI_pickulationts.radial_meter.*`

**Formatter:** `mainColor`, `maxValue`, `backgroundColor`

**Test SPL:**

```spl
| makeresults count=1
| eval count=73
| fields count
```

**Panel type:** `<APP_ID>.radial_meter`

**Verify / deploy:** After changes, run `yarn workspace @splunk/splunk-one run build` then `yarn verify:radial-meter`. Splunk caches custom viz JS — use `splunk restart` and a hard refresh on `custom_viz_gallery` if the panel still shows an old arc. Arc math lives in `radialMeterArc.js` (synced from `_shared/`; must match `src/main/webapp/lib/radialMeterArc.mjs`).
