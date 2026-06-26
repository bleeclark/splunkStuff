/** Reads URL-only runtime switches for the risk page. Filter state stays in React. */

import { createDefaultFilters } from './filterCatalog.js';

/**
 * WHAT: Builds the initial filter state from defaults and only preserves URL runtime mode.
 * WORKS WITH: createDefaultFilters, DashboardFilterProvider, URLSearchParams.
 */
/** @returns {import('./filterCatalog.js').AppliedFilters} */
export function parseFiltersFromUrl(searchParams) {
    const defaults = createDefaultFilters();
    const dataMode = searchParams.get('data');

    return {
        ...defaults,
        dataMode: dataMode === 'splunk' ? 'splunk' : 'mock',
    };
}
