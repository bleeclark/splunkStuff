/**
 * Splunk 9.4 radial meter arc geometry (D3-style polar coords).
 * Keep in sync with visualizations/_shared/radialMeterArc.js (AMD).
 */

export const ARC_START = -Math.PI * 0.75;
export const ARC_END = Math.PI * 0.75;
export const INNER_R = 70;
export const OUTER_R = 85;
export const WIDTH = 220;
export const HEIGHT = 220;

/** D3-style polar: 0 = 12 o'clock, angles increase clockwise. */
export function pointAt(angle, radius) {
    return {
        x: Math.sin(angle) * radius,
        y: -Math.cos(angle) * radius,
    };
}

export function valueToAngle(value, maxValue) {
    const max = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 100;
    const t = Math.max(0, Math.min(1, value / max));
    return ARC_START + t * (ARC_END - ARC_START);
}

export function describeArc(cx, cy, innerR, outerR, startAngle, endAngle) {
    if (endAngle <= startAngle + 1e-6) {
        return '';
    }
    const p1o = pointAt(startAngle, outerR);
    const p2o = pointAt(endAngle, outerR);
    const p1i = pointAt(endAngle, innerR);
    const p2i = pointAt(startAngle, innerR);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M${(cx + p1o.x).toFixed(2)} ${(cy + p1o.y).toFixed(2)} A${outerR} ${outerR} 0 ${large} 1 ${(cx + p2o.x).toFixed(2)} ${(cy + p2o.y).toFixed(2)} L${(cx + p1i.x).toFixed(2)} ${(cy + p1i.y).toFixed(2)} A${innerR} ${innerR} 0 ${large} 0 ${(cx + p2i.x).toFixed(2)} ${(cy + p2i.y).toFixed(2)} Z`;
}

export function buildRadialMeterPaths(value, maxValue) {
    const max = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 100;
    const v = Math.max(0, Math.min(value, max));
    const trackStart = valueToAngle(0, max);
    const trackEnd = valueToAngle(max, max);
    const valueEnd = valueToAngle(v, max);
    return {
        track: describeArc(0, 0, INNER_R, OUTER_R, trackStart, trackEnd),
        fill: describeArc(0, 0, INNER_R, OUTER_R, trackStart, valueEnd),
        displayValue: v,
        trackStart,
        trackEnd,
        valueEnd,
    };
}
