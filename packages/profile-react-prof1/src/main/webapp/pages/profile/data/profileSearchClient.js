/**
 * Live Splunk REST search client for Profile (no mock / fixture mode).
 */

import { filtersToSplunkParams, substituteSplTokens } from '../filters/filtersToSplunkParams.js';

/**
 * Live SPL templates. Replace with product searches; keep $filter_region$ tokens.
 * Field contract for mappers: cards → title,value,delta ; viz/metric → series,_time,value|count.
 */
const SEARCH_TEMPLATES = {
    profile_cards: `
search index=_internal earliest=$earliest$ latest=$latest$
| stats count as value by sourcetype
| rename sourcetype as title
| eval delta="live"
| eval keep=if("$filter_region$"="*" OR match(title, "$filter_region$"), 1, 1)
| where keep=1
| head 3
| fields title value delta
`,
    profile_viz: `
search index=_internal earliest=$earliest$ latest=$latest$
| timechart span=1h count as value
| eval series="Events"
| fields _time series value
`,
    profile_metrics: `
search index=_internal earliest=$earliest$ latest=$latest$
| timechart span=1h count as value
| eval title="Throughput", series="Throughput"
| fields _time title series value
`,
};

const DEFAULT_MAX_WAIT_MS = 300000;
const POLL_INTERVAL_MS = 250;

function getSplunkBase() {
    if (typeof window === 'undefined') return '';
    const cfg = window.__splunkd_partials__ || {};
    return cfg.splunkd?.rootUrl || '';
}

function parseResultsJson(json) {
    const fields = (json.fields || []).map((f) => (typeof f === 'string' ? f : f.name));
    const rows = json.results || json.rows || [];
    if (!rows.length) return [];
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

function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw new DOMException('Search aborted', 'AbortError');
    }
}

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

async function waitForJob(base, sid, { onProgress, signal, maxWaitMs = DEFAULT_MAX_WAIT_MS } = {}) {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
        throwIfAborted(signal);
        const res = await fetch(
            `${base}/services/search/jobs/${encodeURIComponent(sid)}?output_mode=json`,
            { credentials: 'include', signal }
        );
        const json = await res.json();
        const content = json.entry?.[0]?.content || {};
        const progress = parseJobProgress(content);
        onProgress?.(progress);
        if (progress.isFailed) {
            throw new Error(`Search job failed (${progress.dispatchState})`);
        }
        if (progress.isDone) return sid;
        await sleep(POLL_INTERVAL_MS, signal);
    }
    throw new Error('Search job timed out');
}

/**
 * @param {string} searchName
 * @param {string} filterKey
 * @param {{ onProgress?: Function, signal?: AbortSignal, maxWaitMs?: number }} [options]
 */
export async function runProfileSearch(searchName, filterKey, options = {}) {
    const { onProgress, signal, maxWaitMs } = options;
    const template = SEARCH_TEMPLATES[searchName];
    if (!template) {
        throw new Error(`No search template for ${searchName}`);
    }

    throwIfAborted(signal);
    const params = filtersToSplunkParams(filterKey);
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
    return parseResultsJson(await resultsRes.json());
}

export { SEARCH_TEMPLATES };
