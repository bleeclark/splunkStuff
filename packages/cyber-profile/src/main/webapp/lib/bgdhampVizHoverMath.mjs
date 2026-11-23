/** Clamps a number into a range. Works with LineChart paths and hover math. */
export function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

/** True when a pointer is inside a rectangle. Works with line-chart hover. */
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

/** Maps a pointer x position to a series point index. Works with LineChart hover. */
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

/** Converts a pointer position into SVG user space. Works with the line-chart hover layer. */
export function viewportToSvgUserXY(clientX, clientY, rectSource, userW, userH) {
    const rect =
        rectSource && typeof rectSource.getBoundingClientRect === 'function'
            ? rectSource.getBoundingClientRect()
            : rectSource;
    if (
        !rect ||
        !rect.width ||
        !rect.height ||
        !Number.isFinite(userW) ||
        !Number.isFinite(userH) ||
        userW <= 0 ||
        userH <= 0
    ) {
        return null;
    }
    const scale = Math.min(rect.width / userW, rect.height / userH);
    const offX = rect.left + (rect.width - scale * userW) / 2;
    const offY = rect.top + (rect.height - scale * userH) / 2;
    return {
        x: (clientX - offX) / scale,
        y: (clientY - offY) / scale,
    };
}

/** Point index when the pointer meets the series using the meet mapping. Works with LineChart. */
export function seriesIndexFromPointerMeet(
    clientX,
    clientY,
    rectSource,
    userW,
    userH,
    padLeft,
    padRight,
    pointCount
) {
    const mapped = viewportToSvgUserXY(clientX, clientY, rectSource, userW, userH);
    if (!mapped || pointCount < 2) return null;
    const innerW = Math.max(1, userW - padLeft - padRight);
    const xStep = pointCount > 1 ? innerW / (pointCount - 1) : innerW;
    return clamp(Math.round((mapped.x - padLeft) / xStep), 0, pointCount - 1);
}

/** Converts a pointer position into SVG space for the none-aspect mapping. Works with LineChart hover. */
export function viewportToSvgUserXYNone(clientX, clientY, rectSource, userW, userH) {
    const rect =
        rectSource && typeof rectSource.getBoundingClientRect === 'function'
            ? rectSource.getBoundingClientRect()
            : rectSource;
    if (
        !rect ||
        !rect.width ||
        !rect.height ||
        !Number.isFinite(userW) ||
        !Number.isFinite(userH) ||
        userW <= 0 ||
        userH <= 0
    ) {
        return null;
    }
    return {
        x: ((clientX - rect.left) / rect.width) * userW,
        y: ((clientY - rect.top) / rect.height) * userH,
    };
}

/** Point index when the pointer uses the none-aspect mapping. Works with LineChart. */
export function seriesIndexFromPointerNone(
    clientX,
    clientY,
    rectSource,
    userW,
    userH,
    padLeft,
    padRight,
    pointCount
) {
    const mapped = viewportToSvgUserXYNone(clientX, clientY, rectSource, userW, userH);
    if (!mapped || pointCount < 2) return null;
    const innerW = Math.max(1, userW - padLeft - padRight);
    const xStep = pointCount > 1 ? innerW / (pointCount - 1) : innerW;
    return clamp(Math.round((mapped.x - padLeft) / xStep), 0, pointCount - 1);
}

/** Keeps the hover tooltip inside the viewport. Works with LineChart. */
export function clampTooltipViewport(clientX, clientY, viewport, opts) {
    const vw =
        (viewport && viewport.innerWidth) ||
        (typeof window !== 'undefined' ? window.innerWidth : 1024);
    const vh =
        (viewport && viewport.innerHeight) ||
        (typeof window !== 'undefined' ? window.innerHeight : 768);
    const tipW = (opts && opts.width) || 180;
    const tipH = (opts && opts.height) || 52;
    const pad = (opts && opts.pad) != null ? opts.pad : 8;
    const halfW = tipW / 2;
    const x = clamp(clientX, pad + halfW, Math.max(pad + halfW, vw - pad - halfW));
    // Keep room above cursor for the tip; if near top, still clamp into view.
    const minY = pad + tipH + 8;
    const y = clamp(clientY, minY, Math.max(minY, vh - pad));
    return { x, y };
}
