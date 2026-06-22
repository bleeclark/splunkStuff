import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultFilters } from '../../src/main/webapp/pages/risk/filters/filterCatalog.js';
import {
    parseJobProgress,
    runSavedSearch,
} from '../../src/main/webapp/pages/risk/data/splunkSearchClient.js';

test('parseJobProgress converts doneProgress to percent', () => {
    const progress = parseJobProgress({
        doneProgress: 0.47,
        dispatchState: 'RUNNING',
        eventCount: 1200000,
        isDone: false,
        isFailed: false,
    });

    assert.equal(progress.progress, 47);
    assert.equal(progress.dispatchState, 'RUNNING');
    assert.equal(progress.eventCount, 1200000);
    assert.equal(progress.isDone, false);
});

test('parseJobProgress handles completed jobs', () => {
    const progress = parseJobProgress({
        doneProgress: 1,
        dispatchState: 'DONE',
        isDone: true,
        isFailed: false,
    });

    assert.equal(progress.progress, 100);
    assert.equal(progress.isDone, true);
});

test('parseJobProgress handles failed jobs', () => {
    const progress = parseJobProgress({
        dispatchState: 'FAILED',
        isFailed: true,
    });

    assert.equal(progress.isFailed, true);
    assert.equal(progress.progress, 0);
});

test('runSavedSearch rejects when aborted before dispatch', async () => {
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
        () => runSavedSearch('risk_summary', createDefaultFilters(), { signal: controller.signal }),
        (err) => err instanceof DOMException && err.name === 'AbortError'
    );
});

test('runSavedSearch rejects unknown search name', async () => {
    await assert.rejects(
        () => runSavedSearch('missing_search', createDefaultFilters()),
        /No search template/
    );
});
