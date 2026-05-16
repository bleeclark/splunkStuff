/* eslint-disable */
/**
 * Keith/ITSI trend background contract (AMD shared module).
 * Keep in sync with src/main/webapp/lib/splunkstuffTrendColors.js
 */
define([], function () {
    var DEFAULT_UP_COLOR = '#01417F';
    var DEFAULT_DOWN_COLOR = '#DFA611';

    function trendDelta(values) {
        if (!values || !values.length) {
            return NaN;
        }
        var len = values.length;
        var last = Number(values[len - 1]);
        var prev = len > 1 ? Number(values[len - 2]) : last;
        if (!isFinite(last) || !isFinite(prev)) {
            return NaN;
        }
        return last - prev;
    }

    function trendBackground(delta, upColor, downColor) {
        var isUp = isFinite(delta) ? delta >= 0 : true;
        return isUp ? upColor : downColor;
    }

    function applyTrendSurfaceStyle(el, bg) {
        if (!el) {
            return;
        }
        el.style.backgroundColor = bg;
        el.style.setProperty('background-color', bg, 'important');
    }

    function applyTrendHostStyle(el, bg, textColor) {
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
        el.style.pointerEvents = 'auto';
    }

    /** Re-apply trend bg after Splunk formatter may have painted host/parent navy. */
    function repaintTrendTile(hostEl, rootEl, chartEl, majorEl, bg, textColor) {
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
        var p = hostEl ? hostEl.parentElement : null;
        var depth = 0;
        while (p && depth < 4) {
            applyTrendSurfaceStyle(p, bg);
            p = p.parentElement;
            depth += 1;
        }
    }

    return {
        DEFAULT_UP_COLOR: DEFAULT_UP_COLOR,
        DEFAULT_DOWN_COLOR: DEFAULT_DOWN_COLOR,
        trendDelta: trendDelta,
        trendBackground: trendBackground,
        applyTrendSurfaceStyle: applyTrendSurfaceStyle,
        applyTrendHostStyle: applyTrendHostStyle,
        repaintTrendTile: repaintTrendTile,
    };
});
