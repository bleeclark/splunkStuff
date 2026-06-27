/**
 * Hook for loading cascading filter dropdown options with debounce and in-memory cache.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { canLoadFilterOptions } from '../filters/filterCatalog.js';
import { useDashboardFilters } from '../context/DashboardFilterProvider.jsx';
import { getMockFilterOptions } from '../data/filterOptionFixtures.js';
import { filtersToQueryKey } from '../filters/filtersToSplunkParams.js';

const optionCache = new Map();

/**
 * WHAT: Loads filter dropdown options when parent dependencies are satisfied, with debounce and cache.
 * WORKS WITH: DashboardFilterProvider, filterCatalog, filterOptionFixtures, FilterControl, filtersToSplunkParams.
 */
export function useFilterOptions(filterId) {
    const { draftFilters, dataMode } = useDashboardFilters();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);

    const canLoad = canLoadFilterOptions(filterId, draftFilters);

    const parentKey = filtersToQueryKey({
        dateRange: draftFilters.dateRange,
        businessUnit: draftFilters.businessUnit,
        domains: draftFilters.domains,
        entityType: draftFilters.entityType,
        entityIds: [],
        severities: draftFilters.severities,
        hideEmptyPanels: draftFilters.hideEmptyPanels,
    });

    const loadOptions = useCallback(async () => {
        if (!canLoad) {
            setOptions([]);
            return;
        }

        const cacheKey = `${filterId}:${parentKey}:${dataMode}`;
        if (optionCache.has(cacheKey)) {
            setOptions(optionCache.get(cacheKey));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const mockOpts = getMockFilterOptions(filterId, draftFilters);
            optionCache.set(cacheKey, mockOpts);
            setOptions(mockOpts);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [filterId, parentKey, dataMode, draftFilters, canLoad]);

    useEffect(() => {
        if (!canLoad) {
            setOptions([]);
            return undefined;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(loadOptions, 80);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [canLoad, loadOptions]);

    return { options, loading, error, canLoad, reload: loadOptions };
}
