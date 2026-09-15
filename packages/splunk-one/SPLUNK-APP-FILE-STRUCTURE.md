# Splunk App File Structure & Reference Map

**App id (canonical):** `so_BUI_pickulationts`  
**Package path (git):** `packages/splunk-one/`  
**Build output (Splunk app tree):** `packages/splunk-one/stage/`  
**Runtime path (Docker / Splunk):** `$SPLUNK_HOME/etc/apps/so_BUI_pickulationts/`  
**Related docs:** [`PROFILE-REACT-APP-TDD.md`](./PROFILE-REACT-APP-TDD.md) · [`PROFILE-REACT-ARCHITECTURE.md`](./PROFILE-REACT-ARCHITECTURE.md)

Use this document to mirror the layout on another computer. Checkboxes and “Other machine note” columns are for your own verification.

---

## 0. Mental model (read this first)

| Layer | What it is | Splunk loads it? |
|-------|------------|------------------|
| **Dev package** (`packages/splunk-one` with `src/`, `bin/`, `node_modules/`) | Where you edit and run `yarn build` | **No** |
| **`stage/`** | Full Splunk app after build | **Yes** (this is what belongs under `etc/apps/…`) |
| **`$SPLUNK_HOME/etc/apps/so_BUI_pickulationts/`** | Installed / mounted / symlinked app | **Yes** (must equal `stage/` contents) |

```text
Edit src/  +  resources/splunk/
        │
        ▼  yarn build
     stage/   ──────────────────►  etc/apps/so_BUI_pickulationts/
        │         link / volume / docker cp
        ▼
   Splunk Web serves /en-US/app/so_BUI_pickulationts/<view>
```

**Wrong:** putting `src/`, `bin/`, `node_modules/` under `etc/apps/…` as the live app.  
**Right:** `etc/apps/so_BUI_pickulationts/` contains `appserver/` + `default/` from `stage/`.

---

## 1. App id consistency checklist

Every string below must be the **same** id: `so_BUI_pickulationts`.

| # | Location | Exact reference | ✓ | Other machine note |
|---|----------|-----------------|---|--------------------|
| 1 | Folder under `etc/apps/` | `so_BUI_pickulationts` | ☐ | |
| 2 | Browser URL segment | `/en-US/app/so_BUI_pickulationts/…` | ☐ | |
| 3 | `default/app.conf` → `[id] name` | `so_BUI_pickulationts` | ☐ | |
| 4 | `default/app.conf` → `[package] id` | `so_BUI_pickulationts` | ☐ | |
| 5 | Every HTML React view XML `template=` | `so_BUI_pickulationts:/templates/<file>.html` | ☐ | |
| 6 | Every Mako template `page_path` | `/static/app/so_BUI_pickulationts/pages/` + page + `.js` | ☐ | |
| 7 | In-app React links (examples below) | `/app/so_BUI_pickulationts/<view>` | ☐ | |
| 8 | Custom viz types / option NS | `so_BUI_pickulationts.<vizId>` / `display.visualizations.custom.so_BUI_pickulationts.<vizId>.*` | ☐ | |

Display label in Apps menu (`[ui] label = Splunk Stuff (local dev)`) can differ; **folder/id cannot**.

---

## 2. Two trees side by side

### 2.1 Dev / build package (git)

```text
splunkStuff/                                      ← monorepo root: yarn install
└── packages/
    └── splunk-one/                               ← cd here: yarn build
        ├── package.json
        ├── webpack.config.js                     ← pages/* → stage/.../pages/<name>.js
        ├── bin/
        │   ├── build.js                          ← build | link | watch
        │   └── verify-profile-feedback.js
        ├── node_modules/
        ├── src/
        │   ├── main/
        │   │   ├── webapp/
        │   │   │   └── pages/                    ← React page SOURCES
        │   │   │       ├── profile/index.jsx
        │   │   │       ├── feedback/index.jsx
        │   │   │       ├── demo/index.jsx
        │   │   │       └── … (see §4)
        │   │   └── resources/
        │   │       └── splunk/                   ← Splunk config SOURCES (copied → stage)
        │   │           ├── default/
        │   │           │   ├── app.conf
        │   │           │   ├── visualizations.conf
        │   │           │   └── data/ui/
        │   │           │       ├── nav/default.xml
        │   │           │       └── views/*.xml
        │   │           ├── appserver/
        │   │           │   ├── templates/*.html
        │   │           │   └── static/visualizations/…
        │   │           └── metadata/default.meta
        └── stage/                                ← BUILD OUTPUT = Splunk app
            ├── default/
            ├── appserver/
            │   ├── templates/
            │   └── static/
            │       ├── pages/*.js                 ← webpack bundles
            │       └── visualizations/…
            └── metadata/
```

| Path | Role | ✓ | Other machine note |
|------|------|---|--------------------|
| `packages/splunk-one/package.json` | Scripts: `build`, `link:app`, `verify:profile-feedback` | ☐ | |
| `packages/splunk-one/webpack.config.js` | Discovers `src/main/webapp/pages/*` | ☐ | |
| `packages/splunk-one/bin/build.js` | `yarn build` / `yarn link:app` (`appId = so_BUI_pickulationts`) | ☐ | |
| `packages/splunk-one/stage/` | Must exist after build; deploy this | ☐ | |

### 2.2 Runtime Splunk app (Docker / install)

```text
$SPLUNK_HOME/etc/apps/so_BUI_pickulationts/     ← MUST mirror stage/
├── default/
│   ├── app.conf
│   ├── visualizations.conf
│   └── data/ui/
│       ├── nav/default.xml
│       └── views/
│           ├── profile.xml
│           ├── feedback.xml
│           └── …
├── appserver/
│   ├── templates/
│   │   ├── profile.html
│   │   ├── feedback.html
│   │   └── …
│   └── static/
│       ├── pages/
│       │   ├── profile.js
│       │   ├── feedback.js          ← blank Feedback if missing
│       │   └── …
│       └── visualizations/
└── metadata/
```

| Check | Command / URL | ✓ | Other machine note |
|-------|---------------|---|--------------------|
| App folder exists | `ls $SPLUNK_HOME/etc/apps/so_BUI_pickulationts` | ☐ | |
| Pages present | `ls …/appserver/static/pages/feedback.js` | ☐ | |
| Not source package | Folder should **not** be mainly `src/` + `node_modules/` | ☐ | |
| local nav override? | `ls …/local/data/ui/nav/default.xml` (overrides default if present) | ☐ | |

---

## 3. End-to-end load chains

### 3.1 Profile

```text
URL
  /en-US/app/so_BUI_pickulationts/profile
        │
        ▼
VIEW XML
  default/data/ui/views/profile.xml
  <view template="so_BUI_pickulationts:/templates/profile.html" type="html">
        │
        ▼
TEMPLATE
  appserver/templates/profile.html
  page_path = "/static/app/so_BUI_pickulationts/pages/" + page + ".js"
  (page = "profile" from view name)
        │
        ▼
BUNDLE
  appserver/static/pages/profile.js
        │
        ▲ built from
SOURCE
  src/main/webapp/pages/profile/index.jsx
```

| Step | File | References | ✓ | Note |
|------|------|------------|---|------|
| URL | — | `…/app/so_BUI_pickulationts/profile` | ☐ | |
| View | `…/views/profile.xml` | `template="so_BUI_pickulationts:/templates/profile.html"` | ☐ | |
| Template | `…/templates/profile.html` | `/static/app/so_BUI_pickulationts/pages/profile.js` | ☐ | |
| Bundle | `…/static/pages/profile.js` | — | ☐ | |
| Source | `pages/profile/index.jsx` | `ACTION_2_URL → /app/so_BUI_pickulationts/feedback` | ☐ | |

### 3.2 Feedback

```text
URL  /en-US/app/so_BUI_pickulationts/feedback
  →  views/feedback.xml
       template="so_BUI_pickulationts:/templates/feedback.html"
  →  templates/feedback.html
       → /static/app/so_BUI_pickulationts/pages/feedback.js
  →  static/pages/feedback.js
  ←  pages/feedback/index.jsx
       PROFILE_URL = '/app/so_BUI_pickulationts/profile'
```

| Step | File | References | ✓ | Note |
|------|------|------------|---|------|
| URL | — | `…/app/so_BUI_pickulationts/feedback` | ☐ | |
| View | `…/views/feedback.xml` | `…/templates/feedback.html` | ☐ | |
| Template | `…/templates/feedback.html` | `…/pages/feedback.js` | ☐ | |
| Bundle | `…/static/pages/feedback.js` | **Must exist after build + deploy** | ☐ | |
| Source | `pages/feedback/index.jsx` | back link → profile | ☐ | |
| Nav | — | Feedback is **not** in `nav/default.xml` (by design) | ☐ | |

**How users open Feedback:** Profile Action 2, Metric A, or direct URL — not the app bar.

### 3.3 Generic HTML React page pattern

For any page name `<NAME>`:

| Artifact | Path |
|----------|------|
| Source | `src/main/webapp/pages/<NAME>/index.jsx` |
| Webpack out | `stage/appserver/static/pages/<NAME>.js` |
| View | `default/data/ui/views/<NAME>.xml` *(underscores if that’s the XML name)* |
| Template | `appserver/templates/<NAME>.html` |
| URL | `/app/so_BUI_pickulationts/<view_xml_basename>` |

Webpack entry name = **folder name** under `pages/`.  
Splunk `page` in the template = **view XML basename** (usually same as folder; see §4 for exceptions).

---

## 4. HTML React pages matrix

| Page folder (`pages/`) | Bundle (`static/pages/`) | View XML | Template | In nav? | URL view name | ✓ | Note |
|------------------------|--------------------------|----------|----------|---------|---------------|---|------|
| `profile/` | `profile.js` | `profile.xml` | `profile.html` | **Yes** (default) | `profile` | ☐ | |
| `feedback/` | `feedback.js` | `feedback.xml` | `feedback.html` | **No** | `feedback` | ☐ | |
| `documentation/` | `documentation.js` | `documentation.xml` | `documentation.html` | Yes (under Resources) | `documentation` | ☐ | |
| `demo/` | `demo.js` | `demo.xml` | `demo.html` | No (unless added) | `demo` | ☐ | Separate demo page — **not** Profile |
| `start/` | `start.js` | `start.xml` | `start.html` | No | `start` | ☐ | |
| `risk/` | `risk.js` | `risk.xml` | `risk.html` | No | `risk` | ☐ | |
| `architecture/` | `architecture.js` | `architecture.xml` | `architecture.html` | No | `architecture` | ☐ | |
| `integration/` | `integration.js` | `integration.xml` | `integration.html` | No | `integration` | ☐ | |
| `progress/` | `progress.js` | `progress.xml` | `progress.html` | No | `progress` | ☐ | |
| `invest/` | `invest.js` | `invest.xml` | `invest.html` | No | `invest` | ☐ | |
| `formatter-compatibility/` | `formatter-compatibility.js` | `formatter_compatibility.xml` | `formatter_compatibility.html` | No | `formatter_compatibility` | ☐ | Hyphen folder vs underscore view — verify bundle name matches what template requests |

### Classic / other views (not webpack page folders)

| View XML | Type | Notes | ✓ |
|----------|------|-------|---|
| `custom_viz_gallery.xml` | Classic Simple XML | Custom viz gallery; uses `so_BUI_pickulationts.<viz>` | ☐ |
| `formatter_cards_94.xml` | Classic Simple XML | Formatter cards demo | ☐ |
| `risk_dashboard.xml` | (dashboard) | Related risk UI | ☐ |

---

## 5. Navigation (`default/data/ui/nav/default.xml`)

**Source:** `src/main/resources/splunk/default/data/ui/nav/default.xml`  
**Runtime:** `…/default/data/ui/nav/default.xml`  
**Override danger:** `…/local/data/ui/nav/default.xml` wins over `default/` if present.

Current content:

```xml
<nav>
    <view name="profile" default="true" />
    <collection label="Resources">
        <view name="documentation" />
        <a href="https://docs.splunk.com/Documentation/Splunk/9.4.0" target="_blank">Splunk 9.4 Docs</a>
        <a href="https://dev.splunk.com/" target="_blank">Splunk Dev</a>
    </collection>
</nav>
```

| Nav item | Type | Resolves to | ✓ | Note |
|----------|------|-------------|---|------|
| Profile | internal view | `views/profile.xml` → Profile React page | ☐ | |
| Resources → Documentation | internal view | `views/documentation.xml` | ☐ | |
| Resources → Splunk 9.4 Docs | external `<a>` | `https://docs.splunk.com/Documentation/Splunk/9.4.0` | ☐ | |
| Resources → Splunk Dev | external `<a>` | `https://dev.splunk.com/` | ☐ | |
| Feedback | — | **Not listed** (open via Action 2 / URL) | ☐ | |

App bar (Profile \| Resources) only appears when Splunk chrome is shown (`@splunk/react-page` `layout()`, no `hideChrome` in URL).

---

## 6. Key in-app URL references (React)

| File | Constant / link | Target | ✓ | Note |
|------|-----------------|--------|---|------|
| `pages/profile/index.jsx` | `ACTION_2_URL` | `/app/so_BUI_pickulationts/feedback` | ☐ | |
| `pages/profile/index.jsx` | Metric A (same pattern) | feedback | ☐ | |
| `pages/feedback/index.jsx` | `PROFILE_URL` | `/app/so_BUI_pickulationts/profile` | ☐ | |
| `pages/invest/index.jsx` | `to=` | `/app/so_BUI_pickulationts/profile` | ☐ | |

If you rename the app id, update **all** of these plus every template `page_path` and every view `template=` attribute.

---

## 7. `app.conf` reference

**Path:** `default/app.conf` (source under `resources/splunk/default/`)

| Section / key | Value | Purpose | ✓ |
|---------------|-------|---------|---|
| `[id] name` | `so_BUI_pickulationts` | Canonical app id | ☐ |
| `[package] id` | `so_BUI_pickulationts` | Packaging id (match name) | ☐ |
| `[ui] label` | `Splunk Stuff (local dev)` | Apps menu label only | ☐ |
| `[ui] is_visible` | `1` | Show in Apps | ☐ |
| `[install] is_configured` | `1` | Skip setup wizard | ☐ |
| `[install] build` | (timestamp) | Build stamp | ☐ |

---

## 8. Build, verify, deploy

### 8.1 What `yarn build` does

From `packages/splunk-one`:

1. **Webpack** — each `src/main/webapp/pages/<NAME>/` → `stage/appserver/static/pages/<NAME>.js`
2. **Copy** — `src/main/resources/splunk/**` → `stage/`
3. Viz sync hooks (vanilla/React viz into `stage` / `deliver`)

| After build, confirm | Path | ✓ | Note |
|----------------------|------|---|------|
| Profile bundle | `stage/appserver/static/pages/profile.js` | ☐ | |
| Feedback bundle | `stage/appserver/static/pages/feedback.js` | ☐ | |
| Profile template | `stage/appserver/templates/profile.html` | ☐ | |
| Feedback template | `stage/appserver/templates/feedback.html` | ☐ | |
| Nav | `stage/default/data/ui/nav/default.xml` | ☐ | |

### 8.2 Verify script

```bash
cd packages/splunk-one
yarn verify:profile-feedback
# or
node bin/verify-profile-feedback.js
```

Checks stage (or src fallback) for profile/feedback views, templates, page JS, and nav (`profile` + `Resources`, feedback **not** in nav).

| Command | Where to run | ✓ | Note |
|---------|--------------|---|------|
| `yarn verify:profile-feedback` | Host, `packages/splunk-one` (not Docker) | ☐ | |
| From monorepo root | `yarn workspace @splunk/splunk-one verify:profile-feedback` | ☐ | |

### 8.3 Deploy to Splunk

| Method | How | ✓ | Note |
|--------|-----|---|------|
| Symlink (local Splunk) | `export SPLUNK_HOME=…` then `yarn link:app` → `etc/apps/so_BUI_pickulationts` → `stage` | ☐ | |
| Docker volume | Mount `./packages/splunk-one/stage` → `/opt/splunk/etc/apps/so_BUI_pickulationts` | ☐ | |
| docker cp | `docker cp stage/. <container>:/opt/splunk/etc/apps/so_BUI_pickulationts/` | ☐ | |

After **new** views/nav: restart Splunk (or reload app) + hard refresh.  
After JS-only changes: bump `page_asset_version` in the Mako template and hard refresh.

### 8.4 Cache bust

| File | Variable | Purpose |
|------|----------|---------|
| `appserver/templates/profile.html` | `page_asset_version` | Query `?v=` on `profile.js` |
| `appserver/templates/feedback.html` | `page_asset_version` | Query `?v=` on `feedback.js` |

Bump when shipping JS so browsers don’t keep a stale bundle.

---

## 9. Custom visualizations (brief)

Live under:

```text
appserver/static/visualizations/<vizId>/
  visualization.js
  visualization.css
  formatter.html
  …
default/visualizations.conf          ← registers [vizId]
```

| Reference pattern | Example |
|-------------------|---------|
| Viz type in Simple XML | `so_BUI_pickulationts.splunkstuff_kpi_sparkline` |
| Option namespace | `display.visualizations.custom.so_BUI_pickulationts.<vizId>.*` |
| Static URL | `/static/app/so_BUI_pickulationts/visualizations/<vizId>/…` |

These also hardcode the app id; renaming the app requires updating viz `NS` strings and gallery XML.

Handoff copies also exist under `packages/splunk-one/deliver/<vizId>/` after build.

---

## 10. Common failure map

| Symptom | Likely cause | Where to look |
|---------|--------------|---------------|
| Blank Feedback page | `feedback.js` missing in runtime app | `…/static/pages/feedback.js` |
| 404 on script | Template app id ≠ folder name | `templates/*.html` `page_path` |
| Profile works, Feedback 404 | Only `profile.js` deployed | Copy full `stage/` or at least feedback artifacts |
| No Profile \| Resources bar | Chrome hidden / old local nav | URL `hideChrome`; `local/.../nav/`; `layout()` options |
| `yarn verify:…` not found | Wrong cwd (repo root vs package) | `cd packages/splunk-one` or `yarn workspace …` |
| Edited `demo/` but Profile unchanged | Wrong folder | Use `pages/profile`, not `pages/demo` |
| `etc/apps/…/packages/…/src` | Source package used as Splunk app | Deploy `stage/` instead |

---

## 11. Other-machine checklist (copy/paste)

```text
[ ] Git: packages/splunk-one exists with src/, bin/, package.json
[ ] Host: yarn install (from monorepo root)
[ ] Host: cd packages/splunk-one && yarn build
[ ] Host: ls stage/appserver/static/pages/profile.js
[ ] Host: ls stage/appserver/static/pages/feedback.js
[ ] Host: yarn verify:profile-feedback   → ok (stage)
[ ] Splunk/Docker: app folder name = so_BUI_pickulationts
[ ] Splunk/Docker: app tree has appserver/ + default/ (not just src/node_modules)
[ ] Deploy: stage → etc/apps/so_BUI_pickulationts (link, volume, or docker cp)
[ ] No stale local/data/ui/nav/default.xml unless intentional
[ ] Restart Splunk / hard refresh
[ ] Open /en-US/app/so_BUI_pickulationts/profile
[ ] Open /en-US/app/so_BUI_pickulationts/feedback
[ ] App bar shows Profile + Resources (if chrome enabled)
[ ] Action 2 from Profile reaches Feedback
```

**Other machine notes / dates:**

| Date | What you verified | Result |
|------|-------------------|--------|
| | | |
| | | |
| | | |

---

## 12. Quick path cheat sheet

| What you want | Path |
|---------------|------|
| Edit Profile UI | `src/main/webapp/pages/profile/` |
| Edit Feedback UI | `src/main/webapp/pages/feedback/` |
| Edit nav | `src/main/resources/splunk/default/data/ui/nav/default.xml` |
| Edit app id / label | `src/main/resources/splunk/default/app.conf` |
| Built JS Splunk serves | `stage/appserver/static/pages/*.js` |
| What Docker must contain | Contents of `stage/` at `etc/apps/so_BUI_pickulationts/` |
| Demo page (unrelated to Profile) | `src/main/webapp/pages/demo/` |

---

*Generated for mirroring `packages/splunk-one` ↔ Splunk `so_BUI_pickulationts`. Keep app id identical in folder, app.conf, view templates, Mako `page_path`, and React in-app links.*
