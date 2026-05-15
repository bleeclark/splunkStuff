/**
 * Pure hover hit-test + series index math for SplunkStuff line visualizations.
 * Keep in sync with LineChart.jsx (React) and fixed_loaded_line_vanilla/visualization.js (AMD).
 */

export function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @param {{ left: number, top: number, right: number, bottom: number, width?: number, height?: number }} rect
 */
export function hitTestPointInRect(clientX, clientY, rect) {
    const w = rect.width != null ? rect.width : rect.right - rect.left;
    const h = rect.height != null ? rect.height : rect.bottom - rect.top;
    if (!(w > 0) || !(h > 0)) return false;
    return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
    );
}

/**
 * Map pointer X to series index (last numeric column / primary series).
 * `mappingRect` is the element used for scaleX (usually the SVG or chart-area box aligned with the plot).
 *
 * @param {number} clientX
 * @param {{ left: number, width: number }} mappingRect - must have width > 0
 * @param {number} modelWidth - logical plot width (matches SVG width attribute)
 * @param {number} padLeft
 * @param {number} padRight
 * @param {number} pointCount - n >= 2
 */
export function seriesIndexFromClientX(clientX, mappingRect, modelWidth, padLeft, padRight, pointCount) {
    const n = pointCount;
    if (n < 2 || !mappingRect.width) return 0;
    const innerW = Math.max(1, modelWidth - padLeft - padRight);
    const xStep = n > 1 ? innerW / (n - 1) : innerW;
    const scaleX = modelWidth / mappingRect.width;
    const x = (clientX - mappingRect.left) * scaleX;
    const relX = x - padLeft;
    return clamp(Math.round(relX / xStep), 0, n - 1);
}
