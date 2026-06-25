/**
 * Lightweight Splunk REST search client for the risk dashboard.
 * Uses saved search stanzas with token substitution.
 *
 * MODULE: Dispatches token-substituted SPL jobs via Splunk REST, polls for
 * completion, and returns parsed row objects for live dashboard panels.
 */

import { filtersToSplunkParams, substituteSplTokens } from '../filters/filtersToSplunkParams.js';

const SEARCH_TEMPLATES = {
    risk_summary: `
| makeresults count=1
| eval total_risk_score=847, previous_total_risk_score=756, delta_percent=12
| eval anomaly_count=23, previous_anomaly_count=18
| eval critical_count=8, high_count=15, medium_count=42, low_count=103
| eval mttd_hours=4.2, mttd_sparkline="5.1,4.8,4.5,4.3,4.2,4.0,3.9"
| where match("$filter_bu$", "*") OR business_unit="$filter_bu$"
`,
    risk_timeseries: `
| makeresults count=7
| streamstats count as n
| eval _time=relative_time(now(), "-" . (7-n) . "h")
| eval risk_score=720+n*20, baseline_score=700+n*2, is_anomaly=if(n=3 OR n=5, 1, 0)
| fields _time risk_score baseline_score is_anomaly
`,
    risk_heatmap_entity_category: `
| makeresults count=5
| eval entity_name=case(_serial=1,"host-abc-01", _serial=2,"user-jdoe", _serial=3,"host-db-02", 1=1,"svc-api-gw")
| eval risk_category=case(_serial=1,"network", _serial=2,"identity", _serial=3,"cloud", 1=1,"endpoint")
| eval value=60+_serial*8
`,
    risk_breakdown_domain: `
| makeresults count=4
| eval domain=case(_serial=1,"identity", _serial=2,"network", _serial=3,"endpoint", 1=1,"cloud")
| eval score=case(_serial=1,312, _serial=2,245, _serial=3,178, 1=1,112)
`,
    risk_calendar_heatmap: `
| makeresults count=6
| eval day=case(_serial=1,"Mon", _serial=2,"Mon", _serial=3,"Tue", _serial=4,"Wed", _serial=5,"Thu", 1=1,"Fri")
| eval hour=case(_serial=1,"9", _serial=2,"14", _serial=3,"10", _serial=4,"3", _serial=5,"15", 1=1,"11")
| eval value=60+_serial*5
`,
    risk_anomalies: `
| makeresults count=3
| eval id="anom-00"._serial, entity_id=case(_serial=1,"host-abc-01", _serial=2,"user-jdoe", 1=1,"host-db-02")
| eval entity_name=entity_id, domain=case(_serial=1,"network", _serial=2,"identity", 1=1,"cloud")
| eval severity=case(_serial=1,"critical", _serial=2,"high", 1=1,"medium"), risk_score=90-_serial*5
| eval delta_from_baseline=40, status="open", recurrence_count=1
`,
    risk_entity_detail: `
| makeresults count=1
| eval entity_id="$filter_entity_id$", entity_name="$filter_entity_id$", current_risk_score=92, threshold=80
| eval owner="SecOps-East", domain="network"
`,
};

const DEFAULT_MAX_WAIT_MS = 300000;
const POLL_INTERVAL_MS = 250;

/**
 * WHAT: Resolves the Splunk REST base URL from the Splunk Web page globals.
 * WORKS WITH: runSavedSearch, waitForJob, window.__splunkd_partials__, Splunk REST /services/search/jobs.
 */
function getSplunkBase() {
    if (typeof window === 'undefined') {
        return '';
    }
    const cfg = window.__splunkd_partials__ || {};
    return cfg.splunkd?.rootUrl || '';
}

/**
 * WHAT: Normalizes Splunk job results JSON into an array of field-name keyed row objects.
 * WORKS WITH: runSavedSearch, Splunk REST results endpoint, output_mode=json.
 */
function parseResultsJson(json) {
    const fields = (json.fields || []).map((f) => (typeof f === 'string' ? f : f.name));
    const rows = json.results || json.rows || [];
    if (!rows.length) {
        return [];
    }
    if (Array.isArray(rows[0])) {
        return rows.map((row) => {
            const obj = {};
            fields.forEach((field, i) => {
                obj[field] = row[i];
            });
            return obj;
        });
    }
    return rows;
}

/**
 * WHAT: Maps Splunk job content fields into a normalized progress snapshot for UI callbacks.
 * WORKS WITH: waitForJob, runSavedSearch onProgress, Splunk search job dispatchState/doneProgress.
 */
/** @param {Record<string, unknown>} content */
export function parseJobProgress(content = {}) {
    const rawProgress = Number(content.doneProgress);
    const progress = Number.isFinite(rawProgress)
        ? Math.min(100, Math.max(0, Math.round(rawProgress * 100)))
        : 0;

    return {
        progress,
        dispatchState: content.dispatchState || 'QUEUED',
        eventCount: content.eventCount,
        isDone: Boolean(content.isDone),
        isFailed: Boolean(content.isFailed),
    };
}

/**
 * WHAT: Throws an AbortError if the given AbortSignal has been cancelled.
 * WORKS WITH: runSavedSearch, waitForJob, sleep, panel query cancellation.
 */
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw new DOMException('Search aborted', 'AbortError');
    }
}

/**
 * WHAT: Promise-based delay that rejects early when an AbortSignal fires.
 * WORKS WITH: waitForJob, POLL_INTERVAL_MS, runSavedSearch AbortSignal.
 */
function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Search aborted', 'AbortError'));
            return;
        }
        const timer = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener(
                'abort',
                () => {
                    clearTimeout(timer);
                    reject(new DOMException('Search aborted', 'AbortError'));
                },
                { once: true }
            );
        }
    });
}

/**
 * WHAT: Polls a Splunk search job until it completes, fails, times out, or is aborted.
 * WORKS WITH: parseJobProgress, getSplunkBase, runSavedSearch, Splunk REST /services/search/jobs/{sid}.
 */
async function waitForJob(base, sid, { onProgress, signal, maxWaitMs = DEFAULT_MAX_WAIT_MS } = {}) {
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
        throwIfAborted(signal);

        const res = await fetch(
            `${base}/services/search/jobs/${encodeURIComponent(sid)}?output_mode=json`,
            { credentials: 'include', signal }
        );
        const json = await res.json();
        const entry = json.entry?.[0];
        const content = entry?.content || {};
        const progress = parseJobProgress(content);

        onProgress?.(progress);

        if (progress.isFailed) {
            throw new Error(`Search job failed (${progress.dispatchState})`);
        }
        if (progress.isDone) {
            return sid;
        }

        await sleep(POLL_INTERVAL_MS, signal);
    }

    throw new Error('Search job timed out');
}

/**
 * WHAT: Creates a Splunk search job from a named template, waits for results, and returns parsed rows.
 * WORKS WITH: SEARCH_TEMPLATES, filtersToSplunkParams, substituteSplTokens, waitForJob, AppliedFilters.
 * @param {string} searchName
 * @param {import('../filters/filterCatalog.js').AppliedFilters} filters
 * @param {{ onProgress?: (progress: ReturnType<typeof parseJobProgress>) => void, signal?: AbortSignal, maxWaitMs?: number }} [options]
 */
export async function runSavedSearch(searchName, filters, options = {}) {
    const { onProgress, signal, maxWaitMs } = options;
    const template = SEARCH_TEMPLATES[searchName];
    if (!template) {
        throw new Error(`No search template for ${searchName}`);
    }

    throwIfAborted(signal);

    const params = filtersToSplunkParams(filters);
    const search = substituteSplTokens(template.trim(), params);
    const base = getSplunkBase();

    if (!base) {
        throw new Error('Splunk REST base URL unavailable');
    }

    const body = new URLSearchParams();
    body.set('search', search);
    body.set('earliest_time', params.earliest);
    body.set('latest_time', params.latest);
    body.set('output_mode', 'json');

    onProgress?.({
        progress: 0,
        dispatchState: 'QUEUED',
        eventCount: undefined,
        isDone: false,
        isFailed: false,
    });

    const createRes = await fetch(`${base}/services/search/jobs?output_mode=json`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal,
    });

    const createJson = await createRes.json();
    const sid = createJson.sid || createJson.entry?.[0]?.content?.sid;
    if (!sid) {
        throw new Error('Failed to create search job');
    }

    await waitForJob(base, sid, { onProgress, signal, maxWaitMs });

    throwIfAborted(signal);

    const resultsRes = await fetch(
        `${base}/services/search/jobs/${encodeURIComponent(sid)}/results?output_mode=json&count=500`,
        { credentials: 'include', signal }
    );
    const resultsJson = await resultsRes.json();
    return parseResultsJson(resultsJson);
}

export { SEARCH_TEMPLATES };
