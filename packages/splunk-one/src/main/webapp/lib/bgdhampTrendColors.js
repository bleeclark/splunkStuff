/**
 * Keith/ITSI trend background contract for BGDHamp visualizations.
 * delta >= 0 → up color (blue); delta < 0 → down color (gold).
 */

export const DEFAULT_UP_COLOR = '#01417F';
export const DEFAULT_DOWN_COLOR = '#DFA611';

export function trendDelta(values) {
    if (!values || !values.length) {
        return NaN;
    }
    const len = values.length;
    const last = Number(values[len - 1]);
    const prev = len > 1 ? Number(values[len - 2]) : last;
    if (!Number.isFinite(last) || !Number.isFinite(prev)) {
        return NaN;
    }
    return last - prev;
}

/** @param {number} delta @param {string} upColor @param {string} downColor */
export function trendBackground(delta, upColor, downColor) {
    const isUp = Number.isFinite(delta) ? delta >= 0 : true;
    return isUp ? upColor : downColor;
}

/** Paint a surface with trend background; overrides Splunk formatter `background`. */
export function applyTrendSurfaceStyle(el, bg) {
    if (!el) {
        return;
    }
    el.style.backgroundColor = bg;
    el.style.setProperty('background-color', bg, 'important');
}

/** Override Splunk formatter background on the viz host element. */
export function applyTrendHostStyle(el, bg, textColor) {
    if (!el) {
        return;
    }
    el.style.position = 'relative';
    applyTrendSurfaceStyle(el, bg);
    el.style.setProperty('background', bg, 'important');
    el.style.color = textColor;
    el.style.overflow = 'hidden';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.minHeight = '100%';
    el.style.boxSizing = 'border-box';
}

/** Re-apply trend bg after Splunk formatter may have painted host/parent navy. */
export function repaintTrendTile(hostEl, rootEl, chartEl, majorEl, bg, textColor) {
    applyTrendHostStyle(hostEl, bg, textColor);
    if (rootEl) {
        applyTrendSurfaceStyle(rootEl, bg);
    }
    if (majorEl) {
        applyTrendSurfaceStyle(majorEl, bg);
    }
    if (chartEl) {
        applyTrendSurfaceStyle(chartEl, bg);
    }
    let p = hostEl ? hostEl.parentElement : null;
    let depth = 0;
    while (p && depth < 4) {
        applyTrendSurfaceStyle(p, bg);
        p = p.parentElement;
        depth += 1;
    }
}
