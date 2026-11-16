/**
 * Resize-aware hook for measuring a host element's dimensions for pixel-based visualizations.
 * Shared by Risk and Profile React pages.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * WHAT: Tracks host element width/height via ResizeObserver (or window resize) for responsive charts and KPIs.
 * WORKS WITH: ResizeObserver, hostRef, measure callback, LineChart, RiskTrendChart, Profile FullBleedChart.
 */
export function useContainerSize({
    minWidth = 120,
    minHeight = 80,
    defaultWidth = 400,
    defaultHeight = 105,
} = {}) {
    const hostRef = useRef(null);
    const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });

    const measure = useCallback(() => {
        const el = hostRef.current;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const width = Math.max(minWidth, Math.floor(rect.width));
        const height = Math.max(minHeight, Math.floor(rect.height));
        setSize((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height }
        );
    }, [minWidth, minHeight]);

    useEffect(() => {
        measure();
        const el = hostRef.current;
        if (!el) {
            return undefined;
        }
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => measure());
            ro.observe(el);
            return () => ro.disconnect();
        }
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    return { hostRef, ...size, measure };
}
