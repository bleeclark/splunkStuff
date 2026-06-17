/**
 * @file booleanParsing.js
 * @description Low-level parsing helpers shared across the Dashboard Studio KPI sparkline
 *   extension. Dashboard Studio delivers formatter options as strings (checkbox values,
 *   color pickers, text inputs). This module normalizes those raw values before layout,
 *   color, and geometry code consumes them.
 *
 * @see resolveOptions.js — primary consumer of parseTruthyOption
 * @see sparkMath.js — primary consumer of clampNumber
 * @see renderTile.js — primary consumer of sanitizeHexColor
 */

/**
 * Interprets Dashboard Studio checkbox / radio string values as booleans.
 * Splunk formatters commonly emit "true", "1", "yes", or "on" for enabled states.
 *
 * @param {*} raw - Raw option value from VisualizationAPI options payload
 * @returns {boolean} True when the normalized string matches a known truthy token
 */
export function parseTruthyOption(raw) {
    const normalized = String(raw == null ? '' : raw)
        .trim()
        .toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

/**
 * Validates a six-digit hex color string from the Studio color picker.
 * Falls back when authors clear the field or Splunk sends a non-hex value.
 *
 * @param {*} raw - Raw color string (expected "#RRGGBB")
 * @param {string} fallbackColor - Safe default when validation fails
 * @returns {string} Valid hex color or fallbackColor
 */
export function sanitizeHexColor(raw, fallbackColor) {
    const candidate = String(raw == null ? '' : raw).trim();
    return /^#[0-9A-Fa-f]{6}$/.test(candidate) ? candidate : fallbackColor;
}

/**
 * Clamps a numeric value to an inclusive [minimum, maximum] range.
 * Used by spark pointer hit-testing so the hovered point index never escapes
 * the value series bounds.
 *
 * @param {number} value - Value to clamp
 * @param {number} minimum - Lower bound (inclusive)
 * @param {number} maximum - Upper bound (inclusive)
 * @returns {number} Clamped value
 */
export function clampNumber(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}
