/** Map useRiskData() result to PanelShell props. */
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
