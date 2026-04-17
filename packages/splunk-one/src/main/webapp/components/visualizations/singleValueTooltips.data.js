/**
 * Stub / mirror of singleValueTooltips.data from your splunk-one app.
 * Extend with METRICS, DEMO_SERIES, etc. as needed when you merge back.
 */

export const METRICS = [];

export const SINGLE_VALUE_DEFAULTS = {};

export const DEMO_SERIES = {};

export function toSingleValueDataSources({ values = [], times = [] } = {}) {
    const len = Math.min(values.length, times.length);
    const colsT = [];
    const colsV = [];
    for (let i = 0; i < len; i += 1) {
        const rawT = times[i];
        const rawV = values[i];
        const t = typeof rawT === 'string' ? Date.parse(rawT) : Number(rawT);
        const v = Number(rawV);
        if (Number.isFinite(t) && Number.isFinite(v)) {
            colsT.push(t);
            colsV.push(v);
        }
    }
    return {
        primary: {
            data: {
                columns: [colsT, colsV],
                fields: [{ name: '_time' }, { name: 'sparklineValues' }],
            },
            meta: {},
        },
    };
}
