/**
 * Shared NewSingleValue visualization defaults for risk dashboard KPI sparkline tiles.
 */

/**
 * WHAT: Provides consistent height, colors, sparkline layout, and font sizes for all KPI widgets.
 * WORKS WITH: NewSingleValue, ResponsiveKpiValue, RiskScoreKpi, AnomalyCountKpi, MttdKpi.
 */
export const KPI_WIDGET_COMMON = {
    height: 150,
    goodColor: '#01417F',
    badColor: '#DFA611',
    textColor: '#FFFFFF',
    sparklineLayout: 'below',
    sparkStroke: 'rgba(255,255,255,0.95)',
    sparkStrokeWidth: 2,
    sparkHeight: 52,
    options: {
        majorFontSize: 36,
        trendFontSize: 12,
    },
};
