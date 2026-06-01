# SplunkStuff Agent Rules

These rules apply to this workspace. Follow them every time the user asks for a code, UI, visualization, asset, CSS, JavaScript, XML, dashboard, or Splunk app change.

## Splunk Cache-Busting Workflow

Splunk aggressively caches static assets and visualization bundles. After every change that should be visible in Splunk, do the following before claiming the work is done:

1. Identify every runtime copy of the changed file.
   - Check both source and delivered/static locations, especially paths under `packages/splunk-one/deliver/` and `packages/splunk-one/src/main/resources/splunk/appserver/static/visualizations/`.
   - If the same visualization exists in multiple deliverable folders, update or clearly report all copies that matter.

2. Rebuild or repackage when the project has a build step.
   - Prefer the repo's existing build/package commands.
   - If dependencies or build tools are missing, report the exact blocker and still update the source files.

3. Bust static asset caches for visible UI changes.
   - Add or update versioned query strings for changed JavaScript and CSS assets when they are referenced from Splunk XML, HTML, or loader files.
   - Use a new value such as a timestamp-style `v=YYYYMMDDHHMM` or an incremented local version.
   - If there is a manifest, loader, or registration file that controls asset names, update it consistently.

4. Account for Splunk Web caching.
   - When possible, restart the running Splunk/dev server after changing files served from `appserver/static`.
   - If a restart is not available or not safe to run, tell the user exactly what to restart.
   - Mention hard refresh/private-window testing when browser cache may still hide the change.

5. Verify from the user-visible path.
   - Prefer testing the rendered Splunk/dashboard/visualization URL rather than only checking local files.
   - If browser verification is not possible, verify with file timestamps, build output, and the final delivered file contents.

6. In the final response, always include the cache notes.
   - State which runtime/delivered paths were updated.
   - State whether a build/restart was run.
   - Give the user the shortest reliable way to see the change, for example hard refresh, add/update `?v=...`, restart Splunk, or open a specific URL.

Do not say a Splunk visual change is complete until this workflow has either been done or the remaining blocker is clearly named.
