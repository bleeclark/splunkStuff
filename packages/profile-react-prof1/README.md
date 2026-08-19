# Profile React PROF-1 — transferable Splunk app

Standalone implementation of **PROF-1** from `packages/splunk-one/PROFILE-REACT-APP-TDD.md`.

App id: **`so_profile_prof1`**  
URL after install: `/app/so_profile_prof1/profile`

## What this package includes (PROF-1 only)

1. **Packaging** — Webpack page entry, Mako template with `?v=` cache-bust, `type="html"` view XML, nav Profile entry.
2. **Boot** — `@splunk/react-page/18` + `getUserTheme()`, navy `#0B1F3B` page chrome.
3. **Filtering** — Select: All / Region A / Region B; swaps demo feeds.
4. **Embedded original content** — three KPI summary cards + three LineChart viz panels from `profileFeeds.js` (not a Studio iframe).
5. **Cutover** — Profile is the default nav view; no Studio Profile entry.

**Explicitly out of scope** (later TDD stories): Metric tab, Action 1/2/3, Feedback page, live Splunk REST, brand assets.

## Commands

```bash
# from repo root
yarn workspace @splunk/profile-react-prof1 install   # first time / after clone
yarn workspace @splunk/profile-react-prof1 build
yarn workspace @splunk/profile-react-prof1 verify
yarn workspace @splunk/profile-react-prof1 package:app
```

Link into a local Splunk:

```bash
export SPLUNK_HOME=/path/to/splunk
yarn workspace @splunk/profile-react-prof1 build
yarn workspace @splunk/profile-react-prof1 link:app
# restart Splunk Web, then open:
# http://127.0.0.1:8000/en-US/app/so_profile_prof1/profile
```

## Transfer into `so_BUI_pickulationts` (or another app)

Copy these pieces into the target app, then rename the app id everywhere:

| Source (this package) | Target (example) |
|----------------------|------------------|
| `src/main/webapp/pages/profile/` | `…/pages/profile/` |
| `src/main/webapp/components/visualizations/LineChart.jsx` | same relative path (or reuse existing) |
| `src/main/webapp/hooks/useContainerSize.js` | same (or reuse) |
| `src/main/webapp/lib/bgdhamp*.js(m)` | same (or reuse) |
| `appserver/templates/profile.html` | same |
| `default/data/ui/views/profile.xml` | same |
| Nav `<view name="profile" />` | merge into existing `nav/default.xml` |

**Rename checklist** (search/replace `so_profile_prof1` → `so_BUI_pickulationts`):

1. `default/app.conf` `[id]` / `[package]` (only if this remains a standalone app)
2. `views/profile.xml` — `template="…:/templates/profile.html"`
3. `appserver/templates/profile.html` — `/static/app/…/pages/`
4. `bin/build.js` / `bin/package-app.js` `appId` (if keeping this package)

After transfer:

1. Ensure the target Webpack build picks up `pages/profile` (folder-based entries like splunk-one).
2. Bump `page_asset_version` in `profile.html`.
3. Restart Splunk (new views often 404 until restart).
4. Hard-refresh the browser.

## Cache notes

- Runtime bundle: `stage/appserver/static/pages/profile.js`
- Template cache-bust: `page_asset_version` in `profile.html`
- After JS changes: rebuild, bump `?v=`, hard refresh (and restart Splunk if the view is new)
