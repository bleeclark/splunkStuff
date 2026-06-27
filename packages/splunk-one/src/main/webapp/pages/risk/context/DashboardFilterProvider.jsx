/**
 * React context provider for global dashboard filter state and refresh lifecycle.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import {
    createDefaultFilters,
    filtersAreValid,
    filtersEqual,
    setFilterValue,
} from '../filters/filterCatalog.js';
import { parseFiltersFromUrl } from '../filters/filterUrlSync.js';

/** @typedef {import('../filters/filterCatalog.js').AppliedFilters & { dataMode?: string }} FilterState */

const DashboardFilterContext = createContext(null);

/**
 * WHAT: Reads initial state from defaults plus URL runtime mode, or returns defaults for SSR.
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
 * WHAT: Provides draft/applied filter state and apply/reset actions to descendants.
 * WORKS WITH: filterCatalog, useDashboardFilters, GlobalFilterBar, useRiskData.
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
        setDraftFilters(draftFilters);
        setAppliedFilters(draftFilters);
        setLastRefreshedAt(new Date().toISOString());
        setRefreshGeneration((g) => g + 1);
    }, [draftFilters]);

    const reset = useCallback(() => {
        const defaults = createDefaultFilters();
        const withMode = { ...defaults, dataMode: draftFilters.dataMode || 'mock' };
        setDraftFilters(withMode);
        setAppliedFilters(withMode);
        setLastRefreshedAt(new Date().toISOString());
        setRefreshGeneration((g) => g + 1);
    }, [draftFilters.dataMode]);

    const value = useMemo(
        () => ({
            draftFilters,
            appliedFilters,
            setFilter,
            apply,
            reset,
            isDirty,
            lastRefreshedAt,
            refreshGeneration,
            filtersValid: filtersAreValid(appliedFilters),
            dataMode: draftFilters.dataMode || 'mock',
        }),
        [
            draftFilters,
            appliedFilters,
            setFilter,
            apply,
            reset,
            isDirty,
            lastRefreshedAt,
            refreshGeneration,
        ]
    );

    return (
        <DashboardFilterContext.Provider value={value}>
            {children}
        </DashboardFilterContext.Provider>
    );
}

DashboardFilterProvider.propTypes = {
    children: PropTypes.node,
};

DashboardFilterProvider.defaultProps = {
    children: null,
};

/**
 * WHAT: Returns the full dashboard filter context including draft, applied, and action callbacks.
 * WORKS WITH: DashboardFilterProvider, useFilterDraft, panel hooks.
 */
export function useDashboardFilters() {
    const ctx = useContext(DashboardFilterContext);
    if (!ctx) {
        throw new Error('useDashboardFilters must be used within DashboardFilterProvider');
    }
    return ctx;
}

/**
 * WHAT: Returns draft filter state plus setFilter, apply, reset, and isDirty for the filter bar UI.
 * WORKS WITH: useDashboardFilters, GlobalFilterBar, FilterControl.
 */
export function useFilterDraft() {
    const { draftFilters, setFilter, apply, reset, isDirty } = useDashboardFilters();
    return { draft: draftFilters, setFilter, apply, reset, isDirty };
}
