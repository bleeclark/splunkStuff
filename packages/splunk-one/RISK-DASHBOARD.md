# Risk Anomaly Detection Dashboard

Operational guide for the React risk page, Classic XML dashboard, and Dashboard Studio KPI tiles across Splunk **9.4**, **10.2**, and **10.4**.

## URLs

| Surface | Path | Splunk version |
|---------|------|----------------|
| React page (primary) | `/app/so_BUI_pickulationts/risk` | 9.4+ |
| Classic dashboard | `/app/so_BUI_pickulationts/risk_dashboard` | 9.4+ |
| Studio KPI charts | Dashboard Studio UI → Add chart → **BGDHamp KPI + Sparkline (Dashboard Studio)** | **10.4+** |

## Global filter tokens

All saved searches and Classic/Studio panels should use the same token names. In the React page, these values come from local applied filter state, not shareable URL params.

| Token | React state field | Description |
|-------|-------------------|-------------|
| `$filter_earliest$` | `dateRange.earliest` | Earliest search time |
| `$filter_latest$` | `dateRange.latest` | Latest search time |
| `$filter_bu$` | `businessUnit` | Business unit or `*` |
| `$filter_domain$` | `domains` | Comma-separated domains or `*` |
| `$filter_entity_type$` | `entityType` | Entity type or `*` |
| `$filter_entity_ids$` | `entityIds` | Comma-separated entity IDs or `*` |
| `$filter_severity$` | `severities` | Comma-separated severities or `*` |
| `$filter_entity_id$` | `entityFocus` | Single entity for detail drawer |

Implementation: [`filtersToSplunkParams.js`](src/main/webapp/pages/risk/filters/filtersToSplunkParams.js)

## Data modes

- **Mock (default):** client fixtures in `pages/risk/data/riskFixtures.js`
- **Splunk REST:** append `?data=splunk` to the React page URL — uses `/services/search/jobs` with templates in `splunkSearchClient.js`

## Saved searches

Stanzas in [`default/savedsearches.conf`](src/main/resources/splunk/default/savedsearches.conf):

- `risk_summary`, `risk_timeseries`, `risk_heatmap_entity_category`, `risk_breakdown_domain`, `risk_calendar_heatmap`, `risk_anomalies`, `risk_entity_detail`
- Filter option searches: `risk_filter_options_bu`, `risk_filter_options_domain`

Replace `makeresults` SPL with real `index=risk_*` queries when indexes are available.

## Version notes

### Splunk 9.4

- React page + Classic XML dashboard
- Classic custom viz: `splunkstuff_kpi_sparkline`, `fixed_loaded_line`
- Build: `yarn build` → `yarn link:app` → restart Splunk

### Splunk 10.2

- **No** `display.visualizations.custom.*` keys under `[default]` in `savedsearches.conf`
- Option validation via `savedsearches.conf.spec` + `formatter.html` defaults
- React risk page unchanged

### Splunk 10.4

- Add Studio KPI tiles using `splunkstuff_kpi_sparkline_studio`
- Verify: `node packages/splunk-one/bin/verify-studio-kpi-sparkline.js`
- Studio charts reference the same `$filter_*$` tokens in chart search SPL

## Cache notes

After UI changes:

1. `yarn build` from repo root
2. Confirm `stage/appserver/static/pages/risk.js` updated
3. Restart Splunk or hard refresh (Cmd+Shift+R)
4. Studio: restart Splunk after extension changes; check `data-bgdhamp-viz-build` on tile root

## Studio dashboard setup (10.4)

1. Open **Dashboard Studio** → create dashboard
2. **Add chart** → Custom → **BGDHamp KPI + Sparkline (Dashboard Studio)**
3. Data source: saved search `risk_summary` or inline SPL with `$filter_earliest$` / `$filter_latest$`
4. Repeat for trend panels using `risk_timeseries`

Export JSON from Studio if you want to check a dashboard definition into `local/data/ui/views/` on the Splunk instance.
