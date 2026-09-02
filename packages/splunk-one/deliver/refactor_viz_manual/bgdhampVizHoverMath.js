/* eslint-disable */
/**
 * Hover hit-test + SVG user-space mapping (meet letterboxing + none stretch).
 * Keep in sync with src/main/webapp/lib/bgdhampVizHoverMath.mjs
 */
define([], function () {
    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    /**
     * @param {number} clientX
     * @param {number} clientY
     * @param {Element | { left: number, top: number, width: number, height: number }} rectSource
     * @param {number} userW - SVG width attribute / model width
     * @param {number} userH - SVG height attribute / model height
     * @returns {{ x: number, y: number } | null}
     */
    function viewportToSvgUserXY(clientX, clientY, rectSource, userW, userH) {
        var rect =
            rectSource && typeof rectSource.getBoundingClientRect === 'function'
                ? rectSource.getBoundingClientRect()
                : rectSource;
        if (
            !rect ||
            !rect.width ||
            !rect.height ||
            !isFinite(userW) ||
            !isFinite(userH) ||
            userW <= 0 ||
            userH <= 0
        ) {
            return null;
        }
        var scale = Math.min(rect.width / userW, rect.height / userH);
        var offX = rect.left + (rect.width - scale * userW) / 2;
        var offY = rect.top + (rect.height - scale * userH) / 2;
        return {
            x: (clientX - offX) / scale,
            y: (clientY - offY) / scale,
        };
    }

    function viewportToSvgUserXYNone(clientX, clientY, rectSource, userW, userH) {
        var rect =
            rectSource && typeof rectSource.getBoundingClientRect === 'function'
                ? rectSource.getBoundingClientRect()
                : rectSource;
        if (
            !rect ||
            !rect.width ||
            !rect.height ||
            !isFinite(userW) ||
            !isFinite(userH) ||
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

    /**
     * Series index from pointer, accounting for default SVG meet scaling.
     */
    function seriesIndexFromPointerMeet(clientX, clientY, rectSource, userW, userH, padLeft, padRight, pointCount) {
        var mapped = viewportToSvgUserXY(clientX, clientY, rectSource, userW, userH);
        if (!mapped || pointCount < 2) return null;
        var innerW = Math.max(1, userW - padLeft - padRight);
        var xStep = pointCount > 1 ? innerW / (pointCount - 1) : innerW;
        return clamp(Math.round((mapped.x - padLeft) / xStep), 0, pointCount - 1);
    }

    function seriesIndexFromPointerNone(clientX, clientY, rectSource, userW, userH, padLeft, padRight, pointCount) {
        var mapped = viewportToSvgUserXYNone(clientX, clientY, rectSource, userW, userH);
        if (!mapped || pointCount < 2) return null;
        var innerW = Math.max(1, userW - padLeft - padRight);
        var xStep = pointCount > 1 ? innerW / (pointCount - 1) : innerW;
        return clamp(Math.round((mapped.x - padLeft) / xStep), 0, pointCount - 1);
    }

    function clampTooltipViewport(clientX, clientY, viewport, opts) {
        var vw = (viewport && viewport.innerWidth) || (typeof window !== 'undefined' ? window.innerWidth : 1024);
        var vh = (viewport && viewport.innerHeight) || (typeof window !== 'undefined' ? window.innerHeight : 768);
        var tipW = (opts && opts.width) || 180;
        var tipH = (opts && opts.height) || 52;
        var pad = opts && opts.pad != null ? opts.pad : 8;
        var halfW = tipW / 2;
        var x = clamp(clientX, pad + halfW, Math.max(pad + halfW, vw - pad - halfW));
        var minY = pad + tipH + 8;
        var y = clamp(clientY, minY, Math.max(minY, vh - pad));
        return { x: x, y: y };
    }

    return {
        clamp: clamp,
        viewportToSvgUserXY: viewportToSvgUserXY,
        viewportToSvgUserXYNone: viewportToSvgUserXYNone,
        seriesIndexFromPointerMeet: seriesIndexFromPointerMeet,
        seriesIndexFromPointerNone: seriesIndexFromPointerNone,
        clampTooltipViewport: clampTooltipViewport,
    };
});
