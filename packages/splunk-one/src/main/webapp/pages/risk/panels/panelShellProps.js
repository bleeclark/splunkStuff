/**
 * Adapter utilities mapping useRiskData results to PanelShell presentation props.
 */

/**
 * WHAT: Converts useRiskData status/progress fields into PanelShell-compatible props including emptyState on error.
 * WORKS WITH: useRiskData, PanelShell, all risk panel components.
 */
export function panelShellPropsFromRiskData({
    status,
    progress,
    dispatchState,
    lastRefreshedAt,
    error,
}) {
    return {
        status,
        progress,
        dispatchState,
        lastRefreshedAt,
        emptyState: status === 'error' ? error?.message || 'Error loading panel' : undefined,
    };
}
