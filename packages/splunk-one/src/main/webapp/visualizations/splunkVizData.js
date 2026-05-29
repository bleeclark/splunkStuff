/* eslint-disable */

export function cellValue(cell) {
    if (cell == null) {
        return cell;
    }
    if (typeof cell === 'object' && cell.value != null) {
        return cell.value;
    }
    return cell;
}

export function fieldName(fields, idx) {
    if (!fields || idx < 0 || idx >= fields.length) {
        return '';
    }
    const f = fields[idx];
    if (typeof f === 'string') {
        return f;
    }
    if (f != null && f.name != null) {
        return String(f.name);
    }
    return '';
}

export function fieldsList(rawData) {
    if (rawData && rawData.fields && rawData.fields.length) {
        return rawData.fields;
    }
    if (rawData && rawData.meta && rawData.meta.fields && rawData.meta.fields.length) {
        return rawData.meta.fields;
    }
    return [];
}

export function parseNum(cell) {
    const raw = cellValue(cell);
    if (raw == null || raw === '') {
        return NaN;
    }
    if (typeof raw === 'number' && Number.isFinite(raw)) {
        return raw;
    }
    const n = parseFloat(String(raw).replace(/,/g, '').trim(), 10);
    return Number.isFinite(n) ? n : NaN;
}

export function readConfig(config, namespace, prop, fallback) {
    if (config == null || typeof config !== 'object') {
        return fallback;
    }
    const candidates = [namespace + prop, prop];
    for (let i = 0; i < candidates.length; i += 1) {
        const v = config[candidates[i]];
        if (v !== undefined && v !== null && v !== '') {
            return v;
        }
    }
    return fallback;
}

export function readBool(config, namespace, prop, fallback) {
    const raw = readConfig(config, namespace, prop, fallback);
    if (raw === true || raw === false) {
        return raw;
    }
    const s = String(raw == null ? '' : raw).trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') {
        return true;
    }
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') {
        return false;
    }
    return fallback;
}

export function readFloat(config, namespace, prop, fallback) {
    const n = parseFloat(readConfig(config, namespace, prop, fallback), 10);
    return Number.isFinite(n) ? n : fallback;
}

export function safeColor(raw, fallback) {
    const s = String(raw == null ? '' : raw).trim();
    return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
}

function timeSortKey(rawData, timeIdx, rowIdx) {
    const cell = cellValue(rawData.columns[timeIdx][rowIdx]);
    if (cell == null || cell === '') {
        return 0;
    }
    if (typeof cell === 'number' && Number.isFinite(cell)) {
        return cell;
    }
    const s = String(cell).trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) {
        const n = parseFloat(s, 10);
        return Number.isFinite(n) ? n : 0;
    }
    const ms = Date.parse(s);
    return Number.isFinite(ms) ? ms / 1000 : 0;
}

export function pickNumericColumnIndex(rawData) {
    if (!rawData || !rawData.columns) {
        return -1;
    }
    const fields = fieldsList(rawData);
    let best = -1;
    for (let c = 0; c < rawData.columns.length; c += 1) {
        if (fieldName(fields, c) === '_time') {
            continue;
        }
        const col = rawData.columns[c] || [];
        if (col.length && col.every((cell) => Number.isFinite(parseNum(cell)))) {
            best = c;
        }
    }
    return best;
}

export function numericSeries(rawData) {
    const valueIdx = pickNumericColumnIndex(rawData);
    if (valueIdx < 0) {
        return { values: [], times: [] };
    }
    const fields = fieldsList(rawData);
    const timeIdx = fields.findIndex((_, idx) => fieldName(fields, idx) === '_time');
    const valuesCol = rawData.columns[valueIdx] || [];
    if (timeIdx < 0 || !rawData.columns[timeIdx]) {
        return { values: valuesCol.map(parseNum), times: [] };
    }
    const order = [...Array(valuesCol.length).keys()].sort((a, b) => {
        const ka = timeSortKey(rawData, timeIdx, a);
        const kb = timeSortKey(rawData, timeIdx, b);
        return ka === kb ? a - b : ka - kb;
    });
    return {
        values: order.map((row) => parseNum(valuesCol[row])),
        times: order.map((row) => cellValue(rawData.columns[timeIdx][row])),
    };
}

