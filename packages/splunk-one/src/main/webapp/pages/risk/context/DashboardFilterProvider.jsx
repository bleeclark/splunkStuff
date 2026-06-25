/**
 * React context provider for global dashboard filter state, URL sync, and refresh lifecycle.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
    createDefaultFilters,
    filtersAreValid,
    filtersEqual,
    setFilterValue,
} from '../filters/filterCatalog.js';
import { parseFiltersFromUrl, syncFiltersToUrl } from '../filters/filterUrlSync.js';

/** @typedef {import('../filters/filterCatalog.js').AppliedFilters & { dataMode?: string }} FilterState */

const DashboardFilterContext = createContext(null);

/**
 * WHAT: Reads initial filter state from the URL query string or returns defaults for SSR.
 * WORKS WITH: filterUrlSync, filterCatalog, window.location.search.
 */
function readInitialState() {
    if (typeof window === 'undefined') {
        const defaults = createDefaultFilters();
        return { ...defaults, dataMode: 'mock' };
    }
    const params = new URLSearchParams(window.location.search);
    return parseFiltersFromUrl(params);
}

/**
 * WHAT: Provides draft/applied filter state, apply/reset actions, and URL synchronization to descendants.
 * WORKS WITH: filterCatalog, filterUrlSync, useDashboardFilters, GlobalFilterBar, useRiskData.
 */
export function DashboardFilterProvider({ children }) {
    const initial = useMemo(() => readInitialState(), []);
    const [draftFilters, setDraftFilters] = useState(initial);
    const [appliedFilters, setAppliedFilters] = useState(initial);
    const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date().toISOString());
    const [refreshGeneration, setRefreshGeneration] = useState(0);

    const isDirty = useMemo(
        () => !filtersEqual(draftFilters, appliedFilters),
        [draftFilters, appliedFilters]
    );

    const setFilter = useCallback((filterId, value) => {
        setDraftFilters((prev) => setFilterValue(prev, filterId, value));
    }, []);

    const apply = useCallback(() => {
        if (!filtersAreValid(draftFilters)) {
            return;
        }
        const nextApplied = { ...draftFilters, entityFocus: appliedFilters.entityFocus };
        setDraftFilters(nextApplied);
        setAppliedFilters(nextApplied);
        syncFiltersToUrl(nextApplied);
        setLastRefreshedAt(new Date().toISOString());
        setRefreshGeneration((g) => g + 1);
    }, [draftFilters, appliedFilters.entityFocus]);

    const reset = useCallback(() => {
        const defaults = createDefaultFilters();
        const withMode = { ...defaults, dataMode: draftFilters.dataMode || 'mock' };
        setDraftFilters(withMode);
        setAppliedFilters(withMode);
        syncFiltersToUrl(withMode);
        setLastRefreshedAt(new Date().toISOString());
        setRefreshGeneration((g) => g + 1);
    }, [draftFilters.dataMode]);

    const applyDateOnly = useCallback(() => {
        setAppliedFilters((prev) => {
            const next = { ...prev, dateRange: { ...draftFilters.dateRange } };
            syncFiltersToUrl({ ...next, dataMode: draftFilters.dataMode });
            setLastRefreshedAt(new Date().toISOString());
            setRefreshGeneration((g) => g + 1);
            return next;
        });
    }, [draftFilters.dateRange, draftFilters.dataMode]);

    const setEntityFocus = useCallback((entityId) => {
        const next = { ...appliedFilters, entityFocus: entityId || null };
        setDraftFilters((prev) => ({ ...prev, entityFocus: entityId || null }));
        setAppliedFilters(next);
        syncFiltersToUrl({ ...next, dataMode: draftFilters.dataMode });
    }, [appliedFilters, draftFilters.dataMode]);

    const value = useMemo(
        () => ({
            draftFilters,
            appliedFilters,
            setFilter,
            apply,
            reset,
            applyDateOnly,
            isDirty,
            lastRefreshedAt,
            refreshGeneration,
            filtersValid: filtersAreValid(appliedFilters),
            setEntityFocus,
            dataMode: draftFilters.dataMode || 'mock',
        }),
        [
            draftFilters,
            appliedFilters,
            setFilter,
            apply,
            reset,
            applyDateOnly,
            isDirty,
            lastRefreshedAt,
            refreshGeneration,
            setEntityFocus,
        ]
    );

    return (
        <DashboardFilterContext.Provider value={value}>
            {children}
        </DashboardFilterContext.Provider>
    );
}

/**
 * WHAT: Returns the full dashboard filter context including draft, applied, and action callbacks.
 * WORKS WITH: DashboardFilterProvider, useAppliedFilters, useFilterDraft, panel hooks.
 */
export function useDashboardFilters() {
    const ctx = useContext(DashboardFilterContext);
    if (!ctx) {
        throw new Error('useDashboardFilters must be used within DashboardFilterProvider');
    }
    return ctx;
}

/**
 * WHAT: Returns only the currently applied (committed) filter values.
 * WORKS WITH: useDashboardFilters, useRiskData, useFilterOptions, filtersToSplunkParams.
 */
export function useAppliedFilters() {
    return useDashboardFilters().appliedFilters;
}

/**
 * WHAT: Returns draft filter state plus setFilter, apply, reset, and isDirty for the filter bar UI.
 * WORKS WITH: useDashboardFilters, GlobalFilterBar, FilterControl.
 */
export function useFilterDraft() {
    const { draftFilters, setFilter, apply, reset, isDirty } = useDashboardFilters();
    return { draft: draftFilters, setFilter, apply, reset, isDirty };
}
