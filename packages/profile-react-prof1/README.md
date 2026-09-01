# Profile React PROF-1 — transferable Splunk app

Standalone **PROF-1** Profile React app with **live Splunk REST data only** (no mock fixtures).

App id: **`so_profile_prof1`**  
URL after install: `/app/so_profile_prof1/profile`

## What this package includes (PROF-1)

1. **Packaging** — Webpack page entry, Mako template with `?v=` cache-bust, `type="html"` view XML, nav Profile entry.
2. **Boot** — `@splunk/react-page/18` + `getUserTheme()`, navy `#0B1F3B` page chrome.
3. **Filtering** — Select: All / Region A / Region B → SPL `$filter_region$`.
4. **Live data** — `useProfileData` always runs `/services/search/jobs` and maps rows to `{ cards, viz }`.
5. **Cutover** — Profile is the default nav view; no Studio Profile entry.

## Commands

```bash
yarn workspace @splunk/profile-react-prof1 build
yarn workspace @splunk/profile-react-prof1 verify
yarn workspace @splunk/profile-react-prof1 package:app
```

## Transfer

Copy `stage/` into `$SPLUNK_HOME/etc/apps/<app_id>/`, rename `so_profile_prof1` → your app id in `profile.xml`, `profile.html`, and `app.conf`. Restart Splunk; hard refresh.

## Cache notes

- Runtime bundle: `stage/appserver/static/pages/profile.js`
- Template: bump `page_asset_version` after JS changes
