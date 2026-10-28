/* eslint-disable */
/**
 * Splunk custom visualization: KPI loaded line — vanilla AMD (full formatter options)
 *
 * Readable hand-maintained source — Webpack does NOT overwrite this file.
 * Feature parity with React fixed_loaded_line / LineChart.jsx.
 *
 * Debug logging (browser console on the Splunk dashboard):
 *   window.SPLUNKSTUFF_KPI_LINE_DEBUG = true;
 * then hard-refresh. Logs are prefixed with [splunkstuff_kpi_line].
 */
define([
    'api/SplunkVisualizationBase',
    './bgdhampTrendColors',
    './bgdhampVizHoverMath',
], function (SplunkVisualizationBase, trendColors, hoverMath) {
    var VIZ_ID = 'splunkstuff_kpi_line';
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_line.';
    var VIZ_BUILD = '20261028-kpi-line-annotations';
    var TEXT_ROW_HEIGHT_PX = 28;
    var TEXT_ROW_SLOTS = 3;
    var INFO_ICON_SIZE_PX = 18;
    var MAX_MULTI_SERIES = 8;
    /** Prefer these names when Format valueField is Auto (_time + metric). */
    var VALUE_FIELD_HINTS = [
        'value',
        'total_count',
        'count',
        'total',
        'amount',
        'sum',
        'avg',
        'metric',
        'score',
    ];
    var COMPARE_FIELD_HINTS = ['previous', 'prior', 'baseline', 'compare', 'target', 'last', 'prev'];
    var SERIES_PALETTE = [
        '#FFFFFF',
        '#7EB6FF',
        '#DFA611',
        '#5CC05C',
        '#F47A22',
        '#9B6BFF',
        '#00A9D4',
        '#E85B79',
    ];
    /** Skip metadata and text-row columns when Auto picks the Y series. */
    var SKIP_VALUE_FIELDS = {
        _time: true,
        _span: true,
        _spandays: true,
        _si: true,
        _serial: true,
        _cd: true,
        _indextime: true,
        linecount: true,
        text1: true,
        text2: true,
        text3: true,
        info: true,
    };

    /** Splunk loads AMD in a browser context; guard for odd embeds. */
    function debugEnabled() {
        try {
            return typeof window !== 'undefined' && window.SPLUNKSTUFF_KPI_LINE_DEBUG === true;
        } catch (e) {
            return false;
        }
    }

    function log() {
        if (!debugEnabled()) return;
        var args = ['[' + VIZ_ID + ']'].concat(Array.prototype.slice.call(arguments));
        // eslint-disable-next-line no-console
        console.log.apply(console, args);
    }

    function readConfig(config, prop, defaultVal) {
        if (config == null || typeof config !== 'object') return defaultVal;
        var v = config[NS + prop];
        if (v === undefined || v === null || v === '') return defaultVal;
        return v;
    }

    function readBool(config, prop, defaultVal) {
        var v = readConfig(config, prop, null);
        if (v === null || v === '') return defaultVal;
        if (v === true) return true;
        if (v === false) return false;
        var s = String(v).toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes') return true;
        if (s === 'false' || s === '0' || s === 'no') return false;
        return defaultVal;
    }

    function readFloat(config, prop, defaultVal) {
        var raw = readConfig(config, prop, null);
        if (raw === null || raw === '') return defaultVal;
        var n = parseFloat(raw, 10);
        return isFinite(n) ? n : defaultVal;
    }

    function readInt(config, prop, defaultVal) {
        var raw = readConfig(config, prop, null);
        if (raw === null || raw === '') return defaultVal;
        var n = parseInt(raw, 10);
        return isFinite(n) ? n : defaultVal;
    }

    function sanitizeHexColor(raw, fallback) {
        if (typeof raw !== 'string') return fallback;
        var s = raw.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
        return fallback;
    }

    /** Hex (#RRGGBB) or rgb/rgba(...) for threshold fills / strokes. */
    function sanitizeCssColor(raw, fallback) {
        if (typeof raw !== 'string') return fallback;
        var s = raw.trim();
        if (!s) return fallback;
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
        if (/^rgba?\(\s*[\d.]+\s*,/.test(s)) return s;
        return fallback;
    }

    /**
     * Older bgdhampTrendColors module may lack repaintTrendTile; mirror the
     * current implementation so panels still render until per-viz helper is refreshed.
     */
    function repaintTrendTileCompat(hostEl, rootEl, chartEl, majorEl, bg, textColor) {
        trendColors.applyTrendHostStyle(hostEl, bg, textColor);
        if (rootEl) trendColors.applyTrendSurfaceStyle(rootEl, bg);
        if (majorEl) trendColors.applyTrendSurfaceStyle(majorEl, bg);
        if (chartEl) trendColors.applyTrendSurfaceStyle(chartEl, bg);
        var p = hostEl ? hostEl.parentElement : null;
        var depth = 0;
        while (p && depth < 4) {
            trendColors.applyTrendSurfaceStyle(p, bg);
            p = p.parentElement;
            depth += 1;
        }
    }

    /** Splunk dashboard wrappers often set pointer-events:none on viz hosts; don't stop early. */
    function enableAncestorPointerEvents(el, maxDepth) {
        var node = el;
        var depth = 0;
        var limit = maxDepth == null ? 24 : maxDepth;
        while (node && depth < limit) {
            if (node.style) {
                node.style.pointerEvents = 'auto';
            }
            node = node.parentElement;
            depth += 1;
        }
    }

    function fieldName(fields, idx) {
        if (!fields || idx < 0 || idx >= fields.length) return '';
        var f = fields[idx];
        if (typeof f === 'string') return f;
        if (f != null && f.name != null) return String(f.name);
        return '';
    }

    function findTimeColumnIndex(rawData) {
        if (!rawData || !rawData.fields) return -1;
        var i;
        for (i = 0; i < rawData.fields.length; i += 1) {
            if (fieldName(rawData.fields, i) === '_time') return i;
        }
        return -1;
    }

    function timeSortKey(rawData, timeIdx, rowIdx) {
        var cell = rawData.columns[timeIdx][rowIdx];
        if (cell == null || cell === '') return 0;
        if (typeof cell === 'number' && isFinite(cell)) return cell;
        var s = String(cell).trim();
        if (/^-?\d+(\.\d+)?$/.test(s)) {
            var n = parseFloat(s, 10);
            return isFinite(n) ? n : 0;
        }
        var ms = Date.parse(s);
        if (isFinite(ms)) return ms / 1000;
        var fb = parseFloat(s, 10);
        return isFinite(fb) ? fb : 0;
    }

    function reorderValuesAndTimesByTime(rawData, valueIdx, timeIdx) {
        var valCol = rawData.columns[valueIdx];
        var n = valCol ? valCol.length : 0;
        if (!n) return { values: [], times: [], rowOrder: [] };
        if (timeIdx < 0 || !rawData.columns[timeIdx] || rawData.columns[timeIdx].length !== n) {
            var plainOrder = [];
            var pi;
            for (pi = 0; pi < n; pi += 1) {
                plainOrder.push(pi);
            }
            return {
                values: valCol.map(function (v) {
                    return parseFloat(v, 10);
                }),
                times: [],
                rowOrder: plainOrder,
            };
        }
        var tcol = rawData.columns[timeIdx];
        var order = [];
        var r;
        for (r = 0; r < n; r += 1) order.push(r);
        order.sort(function (a, b) {
            var ka = timeSortKey(rawData, timeIdx, a);
            var kb = timeSortKey(rawData, timeIdx, b);
            if (ka !== kb) return ka - kb;
            return a - b;
        });
        return {
            values: order.map(function (ri) {
                return parseFloat(valCol[ri], 10);
            }),
            times: order.map(function (ri) {
                return tcol[ri];
            }),
            rowOrder: order,
        };
    }

    function cellText(cell) {
        var guard = 0;
        var raw = cell;
        while (raw != null && guard < 6) {
            if (Array.isArray(raw)) {
                raw = raw.length ? raw[0] : null;
                guard += 1;
                continue;
            }
            if (typeof raw === 'object' && raw.value != null) {
                raw = raw.value;
                guard += 1;
                continue;
            }
            break;
        }
        return raw == null ? '' : String(raw).trim();
    }

    /** Non-numeric columns, in the same time order as the line, so the latest row is last. */
    function stringFieldsInOrder(rawData, rowOrder, valueIdx) {
        var out = {};
        var c;
        if (!rawData || !rawData.columns || !rowOrder) {
            return out;
        }
        for (c = 0; c < rawData.columns.length; c += 1) {
            var name = fieldName(rawData.fields, c);
            if (!name || name === '_time' || c === valueIdx) {
                continue;
            }
            var col = rawData.columns[c] || [];
            out[name] = rowOrder.map(function (ri) {
                return cellText(col[ri]);
            });
        }
        return out;
    }

    function lastStringValue(stringFields, field) {
        var name = String(field == null ? '' : field).trim();
        if (!name || !stringFields) {
            return '';
        }
        var col = stringFields[name];
        if (!col || !col.length) {
            return '';
        }
        return col[col.length - 1] == null ? '' : String(col[col.length - 1]).trim();
    }

    function fillTemplate(template, value, label) {
        return String(template)
            .split('$value$')
            .join(value)
            .split('$label$')
            .join(label);
    }

    function escapeSplValue(v) {
        return String(v == null ? '' : v)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
    }

    function splunkPathPrefix(ownerDoc) {
        var win = ownerDoc && ownerDoc.defaultView;
        var p = win && win.location ? String(win.location.pathname || '') : '';
        var idx = p.indexOf('/app/');
        return idx > 0 ? p.slice(0, idx) : '';
    }

    function withSplunkPrefix(url, prefix) {
        if (!prefix) {
            return url;
        }
        if (url.indexOf('/app/') === 0 || url.indexOf('/manager/') === 0) {
            return prefix + url;
        }
        return url;
    }

    function isSafeUrlTemplate(template) {
        var t = String(template == null ? '' : template).trim();
        return /^https?:\/\//i.test(t) || /^\/(?![\/\\])/.test(t);
    }

    function buildUrlLink(template, value, label, prefix) {
        var t = String(template == null ? '' : template).trim();
        if (!t || !isSafeUrlTemplate(t)) {
            return '';
        }
        var url = fillTemplate(
            t,
            encodeURIComponent(value == null ? '' : value),
            encodeURIComponent(label == null ? '' : label)
        );
        return withSplunkPrefix(url, prefix || '');
    }

    function buildSearchLink(template, value, label, earliest, latest, prefix) {
        var t = String(template == null ? '' : template).trim();
        if (!t) {
            return '';
        }
        var spl = fillTemplate(t, escapeSplValue(value), escapeSplValue(label));
        var url = '/app/search/search?q=' + encodeURIComponent(spl);
        var e = String(earliest == null ? '' : earliest).trim();
        var l = String(latest == null ? '' : latest).trim();
        if (e) {
            url += '&earliest=' + encodeURIComponent(e);
        }
        if (l) {
            url += '&latest=' + encodeURIComponent(l);
        }
        return withSplunkPrefix(url, prefix || '');
    }

    function cellLabel(stringFields, labelField, fallbackLabel) {
        var fromField = lastStringValue(stringFields, labelField);
        if (fromField) {
            return fromField;
        }
        return String(fallbackLabel == null ? '' : fallbackLabel);
    }

    function cellUrl(urlTpl, urlFromField, value, label, prefix) {
        return (
            buildUrlLink(urlTpl, value, label, prefix) ||
            buildUrlLink(urlFromField, value, label, prefix)
        );
    }

    function collectTextCells(stringFields, readConfig, config) {
        var cells = [];
        var i;
        if (!readBool(config, 'showTextRow', true)) {
            return cells;
        }
        for (i = 1; i <= TEXT_ROW_SLOTS; i += 1) {
            var field = String(readConfig(config, 'text' + i + 'Field', 'text' + i) || '').trim();
            var value = lastStringValue(stringFields, field);
            if (!value) {
                continue;
            }
            var labelField = String(readConfig(config, 'text' + i + 'LabelField', '') || '').trim();
            var urlField = String(readConfig(config, 'text' + i + 'LinkUrlField', '') || '').trim();
            cells.push({
                slot: i,
                label: cellLabel(
                    stringFields,
                    labelField,
                    String(readConfig(config, 'text' + i + 'Label', 'Text' + i) || '')
                ),
                value: value,
                urlTpl: String(readConfig(config, 'text' + i + 'LinkUrl', '') || ''),
                urlFromField: lastStringValue(stringFields, urlField),
                searchTpl: String(readConfig(config, 'text' + i + 'LinkSearch', '') || ''),
            });
        }
        return cells;
    }

    function normalizeName(name) {
        return String(name == null ? '' : name)
            .trim()
            .toLowerCase();
    }

    function findFieldIndex(fields, requested) {
        var wanted = normalizeName(requested);
        if (!wanted || !fields || !fields.length) {
            return -1;
        }
        var i;
        for (i = 0; i < fields.length; i += 1) {
            if (normalizeName(fieldName(fields, i)) === wanted) {
                return i;
            }
        }
        return -1;
    }

    function isSkippedValueField(name) {
        var n = normalizeName(name);
        if (!n || SKIP_VALUE_FIELDS[n] || n.charAt(0) === '_') {
            return true;
        }
        if (/^text[123]$/.test(n) || /^text[123]_/.test(n) || /^urls?\d*$/.test(n)) {
            return true;
        }
        return false;
    }

    /** True when a column has at least one finite number (OOTB timecharts often have null gaps). */
    function columnHasNumber(rawData, columnIndex) {
        var name = fieldName(rawData.fields, columnIndex);
        if (isSkippedValueField(name)) {
            return false;
        }
        var col = rawData.columns[columnIndex];
        if (!col || col.length === 0) {
            return false;
        }
        var i;
        for (i = 0; i < col.length; i += 1) {
            if (isFinite(parseFloat(col[i], 10))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Auto: prefer value/count/… then the last numeric non-skipped column.
     * Allows sparse/null buckets like OOTB line charts. Explicit Format valueField still wins.
     */
    function pickNumericColumnIndex(rawData) {
        if (!rawData || !rawData.columns || !rawData.fields) return -1;
        var fields = rawData.fields;
        var h;
        var c;
        for (h = 0; h < VALUE_FIELD_HINTS.length; h += 1) {
            var hinted = findFieldIndex(fields, VALUE_FIELD_HINTS[h]);
            if (hinted >= 0 && columnHasNumber(rawData, hinted)) {
                return hinted;
            }
        }
        var best = -1;
        for (c = 0; c < rawData.columns.length; c += 1) {
            if (columnHasNumber(rawData, c)) {
                best = c;
            }
        }
        return best;
    }

    function resolveValueColumnIndex(rawData, valueField) {
        if (!rawData || !rawData.columns || !rawData.fields) {
            return -1;
        }
        var fields = rawData.fields;
        var wanted = normalizeName(valueField);
        if (wanted && wanted !== 'auto') {
            var explicit = findFieldIndex(fields, valueField);
            if (explicit >= 0 && fieldName(fields, explicit) !== '_time') {
                return explicit;
            }
            return -1;
        }
        return pickNumericColumnIndex(rawData);
    }

    function buildSeriesFromRaw(rawData, valueField) {
        if (!rawData || !rawData.columns || rawData.columns.length === 0) {
            return { values: [], times: [], rowOrder: [], fieldName: '', stringFields: {} };
        }
        var idx = resolveValueColumnIndex(rawData, valueField);
        if (idx < 0) {
            return { values: [], times: [], rowOrder: [], fieldName: '', stringFields: {} };
        }
        var tIdx = findTimeColumnIndex(rawData);
        var out = reorderValuesAndTimesByTime(rawData, idx, tIdx);
        out.fieldName = fieldName(rawData.fields, idx);
        out.columnIndex = idx;
        out.stringFields = stringFieldsInOrder(rawData, out.rowOrder, idx);
        return out;
    }

    function valuesFromColumnInOrder(rawData, columnIndex, rowOrder) {
        var col = rawData && rawData.columns && rawData.columns[columnIndex];
        if (!col || !rowOrder || !rowOrder.length) {
            return [];
        }
        return rowOrder.map(function (ri) {
            return parseFloat(col[ri], 10);
        });
    }

    function resolveCompareColumnIndex(rawData, compareField, primaryIdx) {
        if (!rawData || !rawData.columns || !rawData.fields) {
            return -1;
        }
        var wanted = normalizeName(compareField);
        if (!wanted || wanted === 'none' || wanted === 'auto') {
            var h;
            for (h = 0; h < COMPARE_FIELD_HINTS.length; h += 1) {
                var hinted = findFieldIndex(rawData.fields, COMPARE_FIELD_HINTS[h]);
                if (hinted >= 0 && hinted !== primaryIdx && columnHasNumber(rawData, hinted)) {
                    return hinted;
                }
            }
            return -1;
        }
        var explicit = findFieldIndex(rawData.fields, compareField);
        if (explicit >= 0 && explicit !== primaryIdx && fieldName(rawData.fields, explicit) !== '_time') {
            return explicit;
        }
        return -1;
    }

    function listMultiSeriesColumns(rawData, primaryIdx) {
        var out = [];
        if (!rawData || !rawData.columns || !rawData.fields) {
            return out;
        }
        var c;
        for (c = 0; c < rawData.columns.length; c += 1) {
            if (c === primaryIdx) {
                continue;
            }
            if (!columnHasNumber(rawData, c)) {
                continue;
            }
            out.push({ index: c, name: fieldName(rawData.fields, c) });
            if (out.length >= MAX_MULTI_SERIES - 1) {
                break;
            }
        }
        return out;
    }

    function downsampleAligned(values, times, maxPoints) {
        var cap = Math.floor(Number(maxPoints) || 0);
        if (!cap || !values || values.length <= cap) {
            return { values: values || [], times: times || [], indices: null };
        }
        var stride = Math.ceil(values.length / cap);
        var vOut = [];
        var tOut = [];
        var indices = [];
        var i;
        for (i = 0; i < values.length; i += stride) {
            vOut.push(values[i]);
            tOut.push(times[i]);
            indices.push(i);
        }
        if (indices[indices.length - 1] !== values.length - 1) {
            vOut.push(values[values.length - 1]);
            tOut.push(times[times.length - 1]);
            indices.push(values.length - 1);
        }
        return { values: vOut, times: tOut, indices: indices };
    }

    function pickAligned(values, indices) {
        if (!indices || !values) {
            return values || [];
        }
        return indices.map(function (i) {
            return values[i];
        });
    }

    function fitScaleToSeries(scale, seriesArrays) {
        var lo = scale.min;
        var hi = scale.max;
        var s;
        var i;
        var v;
        var saw = false;
        for (s = 0; s < seriesArrays.length; s += 1) {
            var arr = seriesArrays[s] || [];
            for (i = 0; i < arr.length; i += 1) {
                v = Number(arr[i]);
                if (!isFinite(v)) {
                    continue;
                }
                if (!saw) {
                    lo = v;
                    hi = v;
                    saw = true;
                } else {
                    if (v < lo) lo = v;
                    if (v > hi) hi = v;
                }
            }
        }
        if (!saw) {
            return scale;
        }
        if (!(hi > lo)) {
            hi = lo + 1;
        }
        var pad = (hi - lo) * 0.05;
        return { min: lo - pad, max: hi + pad };
    }

    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    function sma(values, windowSize) {
        var w = Math.max(1, Math.floor(Number(windowSize) || 1));
        if (w <= 1) return values.slice();
        var out = [];
        var sum = 0;
        var i;
        for (i = 0; i < values.length; i += 1) {
            sum += values[i];
            if (i >= w) sum -= values[i - w];
            out.push(sum / Math.min(i + 1, w));
        }
        return out;
    }

    function downsample(values, times, maxPoints) {
        var cap = Math.floor(Number(maxPoints) || 0);
        if (!cap || values.length <= cap) return { values: values, times: times };
        var stride = Math.ceil(values.length / cap);
        var vOut = [];
        var tOut = [];
        var i;
        for (i = 0; i < values.length; i += stride) {
            vOut.push(values[i]);
            tOut.push(times[i]);
        }
        if (vOut[vOut.length - 1] !== values[values.length - 1]) {
            vOut.push(values[values.length - 1]);
            tOut.push(times[times.length - 1]);
        }
        return { values: vOut, times: tOut };
    }

    function buildPath(values, width, height, padL, padR, padT, padB, vmin, vmax) {
        var iw = Math.max(1, width - padL - padR);
        var ih = Math.max(1, height - padT - padB);
        var n = values.length;
        if (n < 2) return '';
        var xStep = iw / (n - 1);
        var parts = [];
        var i;
        var penUp = true;
        var plotted = 0;
        for (i = 0; i < n; i += 1) {
            var v = Number(values[i]);
            if (!isFinite(v)) {
                penUp = true;
                continue;
            }
            var ratio = clamp((v - vmin) / (vmax - vmin), 0, 1);
            var x = padL + i * xStep;
            var y = padT + ih - ratio * ih;
            parts.push((penUp ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
            penUp = false;
            plotted += 1;
        }
        return plotted >= 2 ? parts.join(' ') : '';
    }

    function buildAreaPath(values, width, height, padL, padR, padT, padB, vmin, vmax) {
        var line = buildPath(values, width, height, padL, padR, padT, padB, vmin, vmax);
        if (!line) {
            return '';
        }
        var n = values.length;
        var iw = Math.max(1, width - padL - padR);
        var xStep = iw / (n - 1);
        var lastX = padL + (n - 1) * xStep;
        var baselineY = height - padB;
        return (
            line +
            ' L' +
            lastX.toFixed(1) +
            ' ' +
            baselineY.toFixed(1) +
            ' L' +
            padL.toFixed(1) +
            ' ' +
            baselineY.toFixed(1) +
            ' Z'
        );
    }

    function buildBetweenPath(primaryValues, compareValues, width, height, padL, padR, padT, padB, vmin, vmax) {
        var n = Math.min(primaryValues.length, compareValues.length);
        if (n < 2) {
            return '';
        }
        var iw = Math.max(1, width - padL - padR);
        var ih = Math.max(1, height - padT - padB);
        var xStep = iw / (n - 1);
        var parts = [];
        var i;
        function yAt(v) {
            var ratio = clamp((Number(v) - vmin) / (vmax - vmin), 0, 1);
            return padT + ih - ratio * ih;
        }
        for (i = 0; i < n; i += 1) {
            parts.push((i === 0 ? 'M' : 'L') + (padL + i * xStep).toFixed(1) + ' ' + yAt(primaryValues[i]).toFixed(1));
        }
        for (i = n - 1; i >= 0; i -= 1) {
            parts.push('L' + (padL + i * xStep).toFixed(1) + ' ' + yAt(compareValues[i]).toFixed(1));
        }
        parts.push('Z');
        return parts.join(' ');
    }

    function computeAnomalies(values, mode, sensitivity) {
        var m = mode || 'none';
        var s = isFinite(Number(sensitivity)) ? Number(sensitivity) : 3;
        var flags = [];
        var i;
        for (i = 0; i < values.length; i += 1) flags.push(false);
        if (m === 'none' || values.length < 3) return flags;

        if (m === 'pctChange') {
            for (i = 1; i < values.length; i += 1) {
                var prev = values[i - 1];
                var cur = values[i];
                if (!isFinite(prev) || !isFinite(cur) || prev === 0) continue;
                if (Math.abs((cur - prev) / prev) >= s / 10) flags[i] = true;
            }
            return flags;
        }

        var deltas = [];
        for (i = 1; i < values.length; i += 1) {
            var d = values[i] - values[i - 1];
            if (isFinite(d)) deltas.push(d);
        }
        if (deltas.length < 2) return flags;
        var mean = deltas.reduce(function (a, b) {
            return a + b;
        }, 0) / deltas.length;
        var varN =
            deltas.reduce(function (acc, d) {
                return acc + (d - mean) * (d - mean);
            }, 0) / deltas.length;
        var sd = Math.sqrt(varN) || 0;
        if (!sd) return flags;
        for (i = 1; i < values.length; i += 1) {
            d = values[i] - values[i - 1];
            if (!isFinite(d)) continue;
            if (Math.abs((d - mean) / sd) >= s) flags[i] = true;
        }
        return flags;
    }

    function isLikelyEpochSeconds(n) {
        return isFinite(n) && n > 31536000 && n < 4102444800;
    }

    function isLikelyEpochMs(n) {
        return isFinite(n) && n > 31536000000 && n < 4102444800000;
    }

    function normalizeTimes(rawTimes, len) {
        var times = Array.isArray(rawTimes) ? rawTimes.slice(0, len) : [];
        var ms = [];
        var ok = 0;
        var i;
        for (i = 0; i < len; i += 1) {
            var t = times[i];
            if (typeof t === 'string') {
                var parsed = Date.parse(t);
                if (isFinite(parsed)) {
                    ms.push(parsed);
                    ok += 1;
                    continue;
                }
            }
            if (typeof t === 'number' && isFinite(t)) {
                if (isLikelyEpochMs(t)) {
                    ms.push(t);
                    ok += 1;
                    continue;
                }
                if (isLikelyEpochSeconds(t)) {
                    ms.push(t * 1000);
                    ok += 1;
                    continue;
                }
            }
            ms.push(null);
        }
        return { ms: ms, timeLike: ok >= Math.max(2, Math.floor(len * 0.7)) };
    }

    function bounds(minIn, maxIn) {
        var lo = parseFloat(minIn, 10);
        var hi = parseFloat(maxIn, 10);
        if (!isFinite(lo)) lo = 0;
        if (!isFinite(hi)) hi = 100;
        if (lo > hi) {
            var t = lo;
            lo = hi;
            hi = t;
        }
        if (hi <= lo) hi = lo + 1;
        return { min: lo, max: hi };
    }

    function formatDelta(d) {
        if (!isFinite(d)) return '—';
        return (d >= 0 ? '\u25b2 ' : '\u25bc ') + d.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    function formatHoverTime(times, ms, idx, timeLike) {
        if (timeLike && isFinite(ms[idx])) {
            return new Date(ms[idx]).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        if (times[idx] == null) return '';
        return String(times[idx]);
    }

    function formatHoverValue(v, unit) {
        if (!isFinite(v)) return '—';
        return v.toLocaleString(undefined, { maximumFractionDigits: 2 }) + String(unit || '');
    }

    function clearHoverOverlay(svg, tooltip, hoverAnnEl) {
        if (!svg) return;
        var old = svg.querySelector('.bgdhamp-kpi-line-viz__hover');
        if (old) {
            old.parentNode.removeChild(old);
        }
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        if (hoverAnnEl) {
            hoverAnnEl.style.display = 'none';
            hoverAnnEl.textContent = '';
        }
    }

    function updateHoverOverlay(svg, tooltip, ownerDoc, opts) {
        var hx = opts.hx;
        var hy = opts.hy;
        var padT = opts.padT;
        var padB = opts.padB;
        var chartH = opts.chartH;
        var stroke = opts.stroke;
        var idx = opts.idx;
        var plotValues = opts.plotValues;
        var times = opts.times;
        var norm = opts.norm;
        var unit = opts.unit;
        var width = opts.width;
        var guideStroke = opts.guideStroke || 'rgba(255,255,255,0.22)';
        var primaryName = opts.primaryName || 'value';
        var cmpValues = opts.cmpValues;
        var cmpStroke = opts.cmpStroke || '#7EB6FF';
        var cmpName = opts.cmpName || 'compare';
        var yFor = opts.yFor;
        var annotations = opts.annotations || [];
        var compareAnnotations = opts.compareAnnotations || [];

        var svgDoc = svg.ownerDocument || ownerDoc;

        clearHoverOverlay(svg, tooltip, opts.hoverAnnEl);

        var g = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'bgdhamp-kpi-line-viz__hover');
        g.setAttribute('pointer-events', 'none');

        var line = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', hx.toFixed(1));
        line.setAttribute('x2', hx.toFixed(1));
        line.setAttribute('y1', String(padT));
        line.setAttribute('y2', String(chartH - padB));
        line.setAttribute('stroke', guideStroke);
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);

        function addHoverDot(cy, fill) {
            if (!isFinite(cy)) {
                return;
            }
            var dot = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', hx.toFixed(1));
            dot.setAttribute('cy', cy.toFixed(1));
            dot.setAttribute('r', '4');
            dot.setAttribute('fill', fill);
            dot.setAttribute('stroke', 'rgba(0,0,0,0.35)');
            dot.setAttribute('stroke-width', '1');
            g.appendChild(dot);
        }

        addHoverDot(hy, stroke);
        if (cmpValues && typeof yFor === 'function' && isFinite(cmpValues[idx])) {
            addHoverDot(yFor(cmpValues[idx]), cmpStroke);
        }

        svg.appendChild(g);

        var v = plotValues[idx];
        var timeLabel = formatHoverTime(times, norm.ms, idx, norm.timeLike);
        var valueLabel = formatHoverValue(v, unit);
        var cmpLabel =
            cmpValues && isFinite(cmpValues[idx]) ? formatHoverValue(cmpValues[idx], unit) : '';
        var primaryAnn = annotations[idx] ? String(annotations[idx]).trim() : '';
        var compareAnn = compareAnnotations[idx] ? String(compareAnnotations[idx]).trim() : '';

        tooltip.innerHTML = '';
        function addTipLine(text, className) {
            if (!text) {
                return;
            }
            var el = ownerDoc.createElement('div');
            el.className = className || 'bgdhamp-kpi-line-viz__tooltipTime';
            el.textContent = text;
            tooltip.appendChild(el);
        }
        addTipLine(primaryName + ': ' + valueLabel, 'bgdhamp-kpi-line-viz__tooltipValue');
        if (primaryAnn) {
            addTipLine(primaryAnn, 'bgdhamp-kpi-line-viz__tooltipAnn');
        }
        if (cmpLabel) {
            addTipLine(cmpName + ': ' + cmpLabel, 'bgdhamp-kpi-line-viz__tooltipValue');
        }
        if (compareAnn) {
            addTipLine(compareAnn, 'bgdhamp-kpi-line-viz__tooltipAnn');
        }
        if (timeLabel) {
            addTipLine(timeLabel, 'bgdhamp-kpi-line-viz__tooltipTime');
        }

        tooltip.style.display = 'block';
        tooltip.style.visibility = '';
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '2147483646';
        if (isFinite(opts.clientX) && isFinite(opts.clientY)) {
            tooltip.style.left = opts.clientX + 'px';
            tooltip.style.top = opts.clientY + 'px';
            tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
        } else if (opts.chartWrap) {
            var wrapRect = opts.chartWrap.getBoundingClientRect();
            var fx = clamp(opts.hx, 8, Math.max(8, opts.width - 8)) + wrapRect.left;
            var fy = opts.hy + wrapRect.top;
            tooltip.style.left = fx + 'px';
            tooltip.style.top = fy + 'px';
            tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
        } else {
            var leftPx = clamp(opts.hx, 8, Math.max(8, opts.width - 8));
            var topPx = Math.max(8, opts.hy - 8);
            tooltip.style.left = leftPx + 'px';
            tooltip.style.top = topPx + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
        }
        var bodyEl = ownerDoc.body || ownerDoc.documentElement;
        if (bodyEl && tooltip.parentNode !== bodyEl) {
            bodyEl.appendChild(tooltip);
        }

        if (opts.showHoverAnnotation && opts.hoverAnnEl) {
            var ann = opts.hoverAnnEl;
            var annParts = [primaryName + ' ' + valueLabel];
            if (cmpLabel) {
                annParts.push(cmpName + ' ' + cmpLabel);
            }
            if (primaryAnn) {
                annParts.push(primaryAnn);
            }
            if (compareAnn) {
                annParts.push(compareAnn);
            }
            if (timeLabel) {
                annParts.push(timeLabel);
            }
            ann.textContent = annParts.join(' \u2014 ');
            ann.style.display = 'block';
        }
    }

    function annotationColumn(stringFields, fieldNameKey, len) {
        var out = [];
        var i;
        var name = String(fieldNameKey || '').trim();
        var col = name && stringFields ? stringFields[name] : null;
        for (i = 0; i < len; i += 1) {
            out.push(col && col[i] != null ? String(col[i]).trim() : '');
        }
        return out;
    }

    function appendAnnotationMarks(svg, ownerDoc, values, annotations, width, chartH, padL, padR, padT, padB, scale, color, showLabels) {
        if (!values || !annotations || values.length < 2) {
            return;
        }
        var n = values.length;
        var iw = Math.max(1, width - padL - padR);
        var ih = Math.max(1, chartH - padT - padB);
        var xStep = iw / (n - 1);
        var i;
        for (i = 0; i < n; i += 1) {
            var label = annotations[i] ? String(annotations[i]).trim() : '';
            if (!label || !isFinite(values[i])) {
                continue;
            }
            var x = padL + i * xStep;
            var ratio = clamp((Number(values[i]) - scale.min) / (scale.max - scale.min), 0, 1);
            var y = padT + ih - ratio * ih;
            var mark = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
            mark.setAttribute('class', 'bgdhamp-kpi-line-viz__annMark');
            mark.setAttribute('cx', x.toFixed(1));
            mark.setAttribute('cy', y.toFixed(1));
            mark.setAttribute('r', '3.5');
            mark.setAttribute('fill', color);
            mark.setAttribute('stroke', '#fff');
            mark.setAttribute('stroke-width', '1');
            svg.appendChild(mark);
            if (showLabels) {
                var text = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('class', 'bgdhamp-kpi-line-viz__annLabel');
                text.setAttribute('x', x.toFixed(1));
                text.setAttribute('y', Math.max(10, y - 8).toFixed(1));
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', color);
                text.setAttribute('font-size', '9');
                text.textContent = label.length > 18 ? label.slice(0, 16) + '…' : label;
                svg.appendChild(text);
            }
        }
    }

    function appendRefLine(svg, ownerDoc, y, width, padL, padR, stroke, dash, label) {
        if (!isFinite(y)) {
            return;
        }
        var line = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(padL));
        line.setAttribute('x2', String(width - padR));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('stroke', stroke);
        line.setAttribute('stroke-width', '1.5');
        if (dash) {
            line.setAttribute('stroke-dasharray', dash);
        }
        svg.appendChild(line);
        if (label) {
            var text = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', String(padL + 2));
            text.setAttribute('y', String(Math.max(10, y - 3)));
            text.setAttribute('fill', stroke);
            text.setAttribute('font-size', '9');
            text.textContent = label;
            svg.appendChild(text);
        }
    }

    function styleTextCell(el, isFirst) {
        el.className = 'bgdhamp-kpi-line-viz__textCell';
        el.style.setProperty('flex', '1 1 0', 'important');
        el.style.setProperty('width', 'auto', 'important');
        el.style.setProperty('min-width', '0', 'important');
        el.style.display = 'block';
        el.style.boxSizing = 'border-box';
        el.style.padding = '0 8px';
        el.style.lineHeight = TEXT_ROW_HEIGHT_PX + 'px';
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.textAlign = 'center';
        el.style.fontSize = '12px';
        el.style.fontWeight = '500';
        if (!isFirst) {
            el.style.borderLeft = '1px solid rgba(255,255,255,0.25)';
        }
    }

    function makeLinkCell(ownerDoc, href, target) {
        var a = ownerDoc.createElement('a');
        a.setAttribute('href', href);
        a.setAttribute('target', target);
        a.setAttribute('rel', 'noopener noreferrer');
        a.style.setProperty('color', 'inherit', 'important');
        a.style.setProperty('text-decoration', 'none', 'important');
        a.style.cursor = 'pointer';
        a.addEventListener('mouseenter', function () {
            a.style.setProperty('text-decoration', 'underline', 'important');
        });
        a.addEventListener('mouseleave', function () {
            if (ownerDoc.activeElement !== a) {
                a.style.setProperty('text-decoration', 'none', 'important');
            }
        });
        a.addEventListener('focus', function () {
            a.style.setProperty('text-decoration', 'underline', 'important');
            a.style.outline = '2px solid currentColor';
            a.style.outlineOffset = '-2px';
        });
        a.addEventListener('blur', function () {
            a.style.setProperty('text-decoration', 'none', 'important');
            a.style.outline = 'none';
        });
        return a;
    }

    var infoPopoverSeq = 0;

    function mountInfoPopover(viz, root, ownerDoc, text, topPx) {
        var btn = ownerDoc.createElement('button');
        btn.type = 'button';
        btn.className = 'bgdhamp-kpi-line-viz__info';
        btn.setAttribute('aria-label', 'More information');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'i';
        btn.style.position = 'absolute';
        btn.style.top = topPx + 'px';
        btn.style.right = '8px';
        btn.style.zIndex = '7';
        btn.style.width = INFO_ICON_SIZE_PX + 'px';
        btn.style.height = INFO_ICON_SIZE_PX + 'px';
        btn.style.padding = '0';
        btn.style.margin = '0';
        btn.style.border = '1.5px solid currentColor';
        btn.style.borderRadius = '50%';
        btn.style.background = 'rgba(0,0,0,0.2)';
        btn.style.color = 'inherit';
        btn.style.font = 'italic 700 11px/1 Georgia, "Times New Roman", serif';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.boxSizing = 'border-box';

        infoPopoverSeq += 1;
        var pop = ownerDoc.createElement('div');
        pop.className = 'bgdhamp-kpi-line-viz__infoPopover';
        pop.setAttribute('role', 'tooltip');
        pop.textContent = text;
        pop.style.display = 'none';
        pop.style.position = 'fixed';
        pop.style.zIndex = '2147483646';
        pop.style.maxWidth = '280px';
        pop.style.padding = '8px 10px';
        pop.style.fontSize = '12px';
        pop.style.lineHeight = '1.4';
        pop.style.color = '#FFFFFF';
        pop.style.background = 'rgba(11,31,59,0.96)';
        pop.style.border = '1px solid rgba(255,255,255,0.25)';
        pop.style.borderRadius = '4px';
        pop.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
        pop.style.whiteSpace = 'pre-wrap';

        var pinned = false;

        function place() {
            var rect = btn.getBoundingClientRect();
            var win = ownerDoc.defaultView || window;
            var vw = win.innerWidth || ownerDoc.documentElement.clientWidth || 0;
            pop.style.top = Math.round(rect.bottom + 6) + 'px';
            pop.style.right = Math.max(4, Math.round(vw - rect.right)) + 'px';
        }

        function show() {
            var bodyEl = ownerDoc.body || ownerDoc.documentElement;
            if (bodyEl && pop.parentNode !== bodyEl) {
                bodyEl.appendChild(pop);
            }
            place();
            pop.style.display = 'block';
            btn.setAttribute('aria-expanded', 'true');
            viz._infoOpen = true;
        }

        function hide() {
            pop.style.display = 'none';
            btn.setAttribute('aria-expanded', 'false');
            viz._infoOpen = false;
        }

        btn.addEventListener('mouseenter', show);
        btn.addEventListener('focus', show);
        btn.addEventListener('mouseleave', function () {
            if (!pinned) {
                hide();
            }
        });
        btn.addEventListener('blur', function () {
            if (!pinned) {
                hide();
            }
        });
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            pinned = !pinned;
            if (pinned) {
                show();
            } else {
                hide();
            }
        });

        function onDocClick(e) {
            if (!pinned) {
                return;
            }
            var t = e.target;
            if (t === btn || btn.contains(t) || t === pop || pop.contains(t)) {
                return;
            }
            pinned = false;
            hide();
        }

        function onKey(e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (pop.style.display !== 'none') {
                    pinned = false;
                    hide();
                }
            }
        }

        ownerDoc.addEventListener('click', onDocClick, true);
        ownerDoc.addEventListener('keydown', onKey, true);
        root.appendChild(btn);

        return function teardownInfo() {
            ownerDoc.removeEventListener('click', onDocClick, true);
            ownerDoc.removeEventListener('keydown', onKey, true);
            if (pop.parentNode) {
                pop.parentNode.removeChild(pop);
            }
            viz._infoOpen = false;
        };
    }

    log('module loaded');

    if (typeof console !== 'undefined' && typeof console.info === 'function') {
        // One-time signpost; detailed traces need window.SPLUNKSTUFF_KPI_LINE_DEBUG = true (see file header).
        // eslint-disable-next-line no-console
        console.info(
            '[' + VIZ_ID + '] visualization loaded. Verbose logs: window.SPLUNKSTUFF_KPI_LINE_DEBUG = true (then refresh).'
        );
    }

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        /**
         * Column-major input → series for updateView.
         * Config valueField is applied in updateView; formatData uses Auto as a baseline.
         * X axis is _time when present; Y / major number is the resolved value field.
         */
        formatData: function (rawData) {
            var safe = rawData && rawData.columns ? rawData : { columns: [], fields: [] };
            if (!safe.columns.length) {
                log('formatData: empty columns');
                return { rawData: safe, values: [], times: [], fieldName: '', stringFields: {} };
            }
            var series = buildSeriesFromRaw(safe, 'auto');
            if (!series.values.length) {
                log('formatData: no numeric column — VisualizationError');
                throw new SplunkVisualizationBase.VisualizationError(
                    'KPI line requires _time (optional) plus one numeric value field. Set Format → Value field, or include a column named value.'
                );
            }
            log(
                'formatData: field',
                series.fieldName,
                'points',
                series.values.length,
                '_time',
                findTimeColumnIndex(safe) >= 0
            );
            return {
                rawData: safe,
                values: series.values,
                times: series.times,
                fieldName: series.fieldName,
                stringFields: series.stringFields || {},
            };
        },

        /**
         * Full DOM rebuild: subheader, optional major row, SVG strip, hover + optional drilldown.
         */
        updateView: function (data, config) {
            var t0 = debugEnabled() && typeof performance !== 'undefined' ? performance.now() : 0;
            try {
            var viz = this;
            if (config == null || typeof config !== 'object') {
                log('updateView: config missing or non-object — using {}');
                config = {};
            }
            this._lastData = data;
            this._lastConfig = config;
            if (typeof this._docHoverCleanup === 'function') {
                this._docHoverCleanup();
                this._docHoverCleanup = null;
            }
            if (this._hoverTooltipEl && this._hoverTooltipEl.parentNode) {
                this._hoverTooltipEl.parentNode.removeChild(this._hoverTooltipEl);
                this._hoverTooltipEl = null;
            }
            if (typeof this._infoCleanup === 'function') {
                this._infoCleanup();
                this._infoCleanup = null;
            }
            this.el.innerHTML = '';

            var ownerDoc = (this.el && this.el.ownerDocument) || document;

            var valueFieldCustom = String(readConfig(config, 'valueFieldCustom', '') || '').trim();
            var valueField = valueFieldCustom
                ? valueFieldCustom
                : String(readConfig(config, 'valueField', 'auto') || 'auto').trim() || 'auto';
            var rawData = data && data.rawData ? data.rawData : null;
            var series =
                rawData && rawData.columns
                    ? buildSeriesFromRaw(rawData, valueField)
                    : {
                          values: (data && data.values) || [],
                          times: (data && data.times) || [],
                          fieldName: (data && data.fieldName) || '',
                          stringFields: (data && data.stringFields) || {},
                      };
            var values = series.values || [];
            var times = series.times || [];
            var stringFields = series.stringFields || {};
            log(
                'updateView: valueField',
                valueField,
                'resolved',
                series.fieldName || '(none)',
                'points',
                values.length
            );
            var goodColor = sanitizeHexColor(readConfig(config, 'goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(readConfig(config, 'badColor', '#DFA611'), '#DFA611');
            var textColor = sanitizeHexColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');
            var background = sanitizeHexColor(readConfig(config, 'background', '#0B1F3B'), '#0B1F3B');
            var emptyText = String(readConfig(config, 'emptyText', '') || '');

            // --- Empty / insufficient points (emptyText when set) ---
            if (values.length < 2) {
                log('updateView: empty branch len=', values.length);
                trendColors.applyTrendHostStyle(this.el, background, textColor);
                var empty = ownerDoc.createElement('div');
                empty.className = 'bgdhamp-kpi-line-viz__err';
                var defaultEmptyMsg =
                    values.length === 0
                        ? valueField !== 'auto'
                          ? 'No results for value field "' + valueField + '".'
                          : 'No numeric results to display. Set Format → Value field to your metric column.'
                        : 'Need at least 2 numeric points for the line chart.';
                empty.textContent = emptyText || defaultEmptyMsg;
                this.el.appendChild(empty);
                return;
            }

            var smoothing = String(readConfig(config, 'smoothing', 'none')).toLowerCase();
            var smaWindow = readInt(config, 'smaWindow', 3);
            var maxPoints = readInt(config, 'maxPoints', 0);
            var seriesMode = String(readConfig(config, 'seriesMode', 'single') || 'single')
                .trim()
                .toLowerCase();
            if (seriesMode !== 'multi') {
                seriesMode = 'single';
            }
            var showArea = readBool(config, 'showArea', false);
            var shadeBetween = readBool(config, 'shadeBetween', false);
            var areaColor = sanitizeCssColor(
                readConfig(config, 'areaColor', 'rgba(255,255,255,0.22)'),
                'rgba(255,255,255,0.22)'
            );
            var compareStroke = sanitizeHexColor(
                readConfig(config, 'compareStroke', '#7EB6FF'),
                '#7EB6FF'
            );
            var comparison = readBool(config, 'comparison', false);
            var compareFieldCustom = String(readConfig(config, 'compareFieldCustom', '') || '').trim();
            var compareField = compareFieldCustom
                ? compareFieldCustom
                : String(readConfig(config, 'compareField', 'auto') || 'auto').trim() || 'auto';
            var annotationField = String(readConfig(config, 'annotationField', 'annotation') || '').trim();
            var compareAnnotationField = String(
                readConfig(config, 'compareAnnotationField', 'annotation_compare') || ''
            ).trim();
            var showAnnotationLabels = readBool(config, 'showAnnotationLabels', false);
            var highLineRaw = readConfig(config, 'highLine', '');
            var criticalLineRaw = readConfig(config, 'criticalLine', '');
            var highLine =
                highLineRaw === '' || highLineRaw == null ? null : readFloat(config, 'highLine', NaN);
            var criticalLine =
                criticalLineRaw === '' || criticalLineRaw == null
                    ? null
                    : readFloat(config, 'criticalLine', NaN);
            if (!isFinite(highLine)) {
                highLine = null;
            }
            if (!isFinite(criticalLine)) {
                criticalLine = null;
            }

            var primaryColumnIndex =
                rawData && series.columnIndex != null
                    ? series.columnIndex
                    : resolveValueColumnIndex(rawData || { columns: [], fields: [] }, valueField);
            var rowOrder =
                (series && series.rowOrder) ||
                (function () {
                    var order = [];
                    var ri;
                    for (ri = 0; ri < values.length; ri += 1) {
                        order.push(ri);
                    }
                    return order;
                })();

            var plotValues = values.slice();
            if (smoothing === 'sma') plotValues = sma(plotValues, smaWindow);

            var cmpValues = null;
            var compareFieldName = '';
            if (comparison && rawData && primaryColumnIndex >= 0) {
                var cmpIdx = resolveCompareColumnIndex(rawData, compareField, primaryColumnIndex);
                if (cmpIdx >= 0) {
                    cmpValues = valuesFromColumnInOrder(rawData, cmpIdx, rowOrder);
                    compareFieldName = fieldName(rawData.fields, cmpIdx);
                    if (smoothing === 'sma') {
                        cmpValues = sma(cmpValues, smaWindow);
                    }
                }
            }

            var extraSeries = [];
            if (seriesMode === 'multi' && rawData && primaryColumnIndex >= 0) {
                var multiCols = listMultiSeriesColumns(rawData, primaryColumnIndex);
                var mi;
                for (mi = 0; mi < multiCols.length; mi += 1) {
                    if (compareFieldName && multiCols[mi].name === compareFieldName) {
                        continue;
                    }
                    var multiVals = valuesFromColumnInOrder(rawData, multiCols[mi].index, rowOrder);
                    if (smoothing === 'sma') {
                        multiVals = sma(multiVals, smaWindow);
                    }
                    extraSeries.push({ name: multiCols[mi].name, values: multiVals });
                }
            }

            var ds = downsampleAligned(plotValues, times, maxPoints);
            plotValues = ds.values;
            times = ds.times;
            if (cmpValues && ds.indices) {
                cmpValues = pickAligned(cmpValues, ds.indices);
            } else if (cmpValues && cmpValues.length !== plotValues.length) {
                cmpValues = cmpValues.slice(0, plotValues.length);
            }
            for (mi = 0; mi < extraSeries.length; mi += 1) {
                if (ds.indices) {
                    extraSeries[mi].values = pickAligned(extraSeries[mi].values, ds.indices);
                } else if (extraSeries[mi].values.length !== plotValues.length) {
                    extraSeries[mi].values = extraSeries[mi].values.slice(0, plotValues.length);
                }
            }

            var annotationsFull = annotationColumn(stringFields, annotationField, values.length);
            var compareAnnotationsFull = annotationColumn(
                stringFields,
                compareAnnotationField,
                values.length
            );
            var annotations = annotationsFull;
            var compareAnnotations = compareAnnotationsFull;
            if (ds.indices) {
                annotations = pickAligned(annotationsFull, ds.indices);
                compareAnnotations = pickAligned(compareAnnotationsFull, ds.indices);
            }

            var scale = bounds(readConfig(config, 'min', 0), readConfig(config, 'max', 100));
            if (seriesMode === 'multi' || cmpValues || highLine != null || criticalLine != null) {
                var fitArrays = [plotValues];
                if (cmpValues) {
                    fitArrays.push(cmpValues);
                }
                for (mi = 0; mi < extraSeries.length; mi += 1) {
                    fitArrays.push(extraSeries[mi].values);
                }
                if (highLine != null) {
                    fitArrays.push([highLine]);
                }
                if (criticalLine != null) {
                    fitArrays.push([criticalLine]);
                }
                scale = fitScaleToSeries(scale, fitArrays);
            }
            var strokeRaw = readConfig(config, 'stroke', null);
            var stroke = sanitizeHexColor(
                strokeRaw != null && String(strokeRaw).trim() !== '' ? strokeRaw : '#FFFFFF',
                '#FFFFFF'
            );
            var unit = String(readConfig(config, 'unit', '') || '');
            var subheader = String(readConfig(config, 'subheader', '') || '');
            var useThreshold = readBool(config, 'threshold', false);
            var thMin = useThreshold ? readFloat(config, 'thresholdMin', 20) : null;
            var thMax = useThreshold ? readFloat(config, 'thresholdMax', 80) : null;
            var target = useThreshold ? readFloat(config, 'target', 50) : null;
            var anomalyMode = String(readConfig(config, 'anomalies', 'none'));
            var anomalySens = readInt(config, 'anomalySensitivity', 3);
            var showXAxis = readBool(config, 'showXAxis', false);
            // Splunk formatter text fields may omit the key; only explicit false disables hover.
            var showHover = readBool(config, 'showHover', true);
            if (readConfig(config, 'showHover', null) === null) {
                showHover = true;
            }
            var drilldown = readBool(config, 'drilldown', false);
            var drilldownQuery = String(
                readConfig(config, 'drilldownQuery', 'search index=_internal | stats count') || ''
            );

            var showMajor = readBool(config, 'showMajor', true);
            var centerMajor = readBool(config, 'centerMajor', true);
            var colorPlacement = String(readConfig(config, 'colorPlacement', 'full') || 'full').toLowerCase();
            if (colorPlacement !== 'top') colorPlacement = 'full';
            var strokeWidth = readFloat(config, 'strokeWidth', 2);
            if (!isFinite(strokeWidth) || strokeWidth <= 0) strokeWidth = 2;
            var unitScale = readFloat(config, 'unitScale', 0.6);
            if (!isFinite(unitScale) || unitScale <= 0) unitScale = 0.6;
            var thresholdShade = sanitizeCssColor(
                readConfig(config, 'thresholdShade', 'rgba(0,0,0,0.12)'),
                'rgba(0,0,0,0.12)'
            );
            var targetStroke = sanitizeCssColor(
                readConfig(config, 'targetStroke', 'rgba(255,255,255,0.5)'),
                'rgba(255,255,255,0.5)'
            );
            var showHoverAnnotation = readBool(config, 'showHoverAnnotation', false);
            var padLeftCfg = readFloat(config, 'padLeft', 10);
            var padRightCfg = readFloat(config, 'padRight', 10);
            var padTopCfg = readFloat(config, 'padTop', 2);
            var padBottomCfg = readFloat(config, 'padBottom', 12);
            if (!isFinite(padLeftCfg)) padLeftCfg = 10;
            if (!isFinite(padRightCfg)) padRightCfg = 10;
            if (!isFinite(padTopCfg)) padTopCfg = 2;
            if (!isFinite(padBottomCfg)) padBottomCfg = 12;

            var textCells = collectTextCells(stringFields, readConfig, config);
            var textRowH = textCells.length ? TEXT_ROW_HEIGHT_PX : 0;
            var showInfo = readBool(config, 'showInfo', false);
            var infoText = '';
            if (showInfo) {
                infoText = String(readConfig(config, 'infoText', '') || '').trim();
                if (!infoText) {
                    infoText = lastStringValue(
                        stringFields,
                        String(readConfig(config, 'infoField', 'info') || 'info')
                    );
                }
                showInfo = !!infoText;
            }

            var delta = trendColors.trendDelta(plotValues);
            var trendBg = trendColors.trendBackground(delta, goodColor, badColor);
            trendColors.applyTrendHostStyle(this.el, trendBg, textColor);

            var last = plotValues[plotValues.length - 1];

            var norm = normalizeTimes(times, plotValues.length);
            var anomalyFlags = computeAnomalies(plotValues, anomalyMode, anomalySens);

            var width = Math.max(120, this.el.clientWidth || 400);
            var height = Math.max(80, this.el.clientHeight || 200);
            var subheaderH = subheader ? 28 : 0;
            var majorH = showMajor ? 44 : 0;
            var effPadL = showMajor ? Math.min(padLeftCfg, 10) : padLeftCfg;
            var effPadR = showMajor ? Math.min(padRightCfg, 10) : padRightCfg;
            var effPadT = showMajor ? Math.min(padTopCfg, 2) : padTopCfg;
            var effPadB = showMajor ? Math.min(padBottomCfg, 12) : padBottomCfg;
            var padL = effPadL;
            var padR = effPadR;
            var padT = effPadT;
            var padB = effPadB;
            var chartH = Math.max(40, height - subheaderH - majorH - textRowH);

            // Chart-only (no major row) uses Format background — Classic-like panels stay light/neutral.
            var containerBg =
                !showMajor || colorPlacement === 'top' ? background : trendBg;
            var chartStripBg =
                !showMajor || colorPlacement === 'top' ? background : trendBg;
            var classicChart = !showMajor;
            var guideStroke = classicChart ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.22)';
            // Chart-only on light panels: default white stroke is invisible — use goodColor like OOTB.
            if (classicChart && (strokeRaw == null || String(strokeRaw).trim() === '')) {
                stroke = goodColor;
            }

            log(
                'layout:',
                'showMajor',
                showMajor,
                'colorPlacement',
                colorPlacement,
                'chartH',
                chartH,
                'size',
                width + 'x' + height,
                'hover',
                showHover,
                'annot',
                showHoverAnnotation,
                'drill',
                drilldown
            );

            // --- Root flex column: header → major row → chart strip ---
            var root = ownerDoc.createElement('div');
            root.className = 'bgdhamp-kpi-line-viz';
            root.setAttribute('data-bgdhamp-viz-build', VIZ_BUILD);
            trendColors.applyTrendSurfaceStyle(root, containerBg);
            root.style.color = textColor;
            root.style.width = '100%';
            root.style.height = '100%';
            root.style.minHeight = '100%';
            root.style.pointerEvents = 'auto';

            if (subheader) {
                var head = ownerDoc.createElement('div');
                head.className = 'bgdhamp-kpi-line-viz__header';
                head.textContent = subheader;
                if (showInfo) {
                    head.style.paddingRight = 8 + INFO_ICON_SIZE_PX + 8 + 'px';
                }
                root.appendChild(head);
            }

            if (textCells.length) {
                var textRow = ownerDoc.createElement('div');
                textRow.className = 'bgdhamp-kpi-line-viz__textRow';
                textRow.style.display = 'flex';
                textRow.style.flexDirection = 'row';
                textRow.style.alignItems = 'stretch';
                textRow.style.width = '100%';
                textRow.style.flex = '0 0 ' + TEXT_ROW_HEIGHT_PX + 'px';
                textRow.style.height = TEXT_ROW_HEIGHT_PX + 'px';
                textRow.style.boxSizing = 'border-box';
                textRow.style.overflow = 'hidden';
                textRow.style.background = 'rgba(0,0,0,0.18)';
                textRow.style.color = textColor;
                var linkPrefix = splunkPathPrefix(ownerDoc);
                var linkTarget =
                    String(readConfig(config, 'linkTarget', 'newTab') || '')
                        .replace(/[^a-z0-9]+/gi, '')
                        .toLowerCase() === 'sametab'
                        ? '_self'
                        : '_blank';
                var linkEarliest = String(readConfig(config, 'linkEarliest', '') || '');
                var linkLatest = String(readConfig(config, 'linkLatest', '') || '');
                var ci;
                for (ci = 0; ci < textCells.length; ci += 1) {
                    var tc = textCells[ci];
                    var cellTextLabel = tc.label ? tc.label + ': ' + tc.value : tc.value;
                    var href =
                        cellUrl(tc.urlTpl, tc.urlFromField, tc.value, tc.label, linkPrefix) ||
                        buildSearchLink(
                            tc.searchTpl,
                            tc.value,
                            tc.label,
                            linkEarliest,
                            linkLatest,
                            linkPrefix
                        );
                    var cell = href
                        ? makeLinkCell(ownerDoc, href, linkTarget)
                        : ownerDoc.createElement('div');
                    styleTextCell(cell, ci === 0);
                    cell.textContent = cellTextLabel;
                    cell.setAttribute('title', cellTextLabel);
                    textRow.appendChild(cell);
                }
                root.appendChild(textRow);
            }

            if (showInfo) {
                var infoTopPx = subheader ? 5 : 6;
                this._infoCleanup = mountInfoPopover(viz, root, ownerDoc, infoText, infoTopPx);
            }

            var majorRow = null;
            if (showMajor) {
                majorRow = ownerDoc.createElement('div');
                majorRow.className = 'bgdhamp-kpi-line-viz__major';
                majorRow.style.justifyContent = centerMajor ? 'center' : 'space-between';
                majorRow.style.textAlign = centerMajor ? 'center' : '';
                var major = ownerDoc.createElement('div');
                major.className = 'bgdhamp-kpi-line-viz__majorVal';
                major.textContent = isFinite(last)
                    ? last.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : '—';
                if (unit) {
                    var unitSpan = ownerDoc.createElement('span');
                    unitSpan.className = 'bgdhamp-kpi-line-viz__unit';
                    unitSpan.style.fontSize = unitScale + 'em';
                    unitSpan.textContent = unit;
                    major.appendChild(unitSpan);
                }

                var trend = ownerDoc.createElement('div');
                trend.className = 'bgdhamp-kpi-line-viz__trend';
                trend.style.marginLeft = centerMajor ? '6px' : '';
                trend.textContent = formatDelta(delta);

                trendColors.applyTrendSurfaceStyle(majorRow, trendBg);

                majorRow.appendChild(major);
                majorRow.appendChild(trend);
                root.appendChild(majorRow);
            }

            var chartWrap = ownerDoc.createElement('div');
            chartWrap.className = 'bgdhamp-kpi-line-viz__chart';
            chartWrap.style.flex = '1 1 auto';
            chartWrap.style.minHeight = chartH + 'px';
            chartWrap.style.width = '100%';
            trendColors.applyTrendSurfaceStyle(chartWrap, chartStripBg);
            chartWrap.style.pointerEvents = 'auto';

            // --- SVG model space; screen size uses meet letterboxing in bgdhampVizHoverMath ---
            var svg = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', String(width));
            svg.setAttribute('height', String(chartH));
            svg.style.display = 'block';
            svg.style.width = '100%';
            svg.style.cursor = drilldown && norm.timeLike ? 'pointer' : 'default';
            svg.style.pointerEvents = 'auto';

            function yFor(v) {
                var ih = Math.max(1, chartH - padT - padB);
                var ratio = (v - scale.min) / (scale.max - scale.min);
                return padT + ih - clamp(ratio, 0, 1) * ih;
            }

            var chartBg = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
            chartBg.setAttribute('class', 'bgdhamp-kpi-line-viz__chartBg');
            chartBg.setAttribute('x', '0');
            chartBg.setAttribute('y', '0');
            chartBg.setAttribute('width', String(width));
            chartBg.setAttribute('height', String(chartH));
            chartBg.setAttribute('fill', chartStripBg);
            svg.appendChild(chartBg);

            if (useThreshold && isFinite(thMin)) {
                var rectLo = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rectLo.setAttribute('x', String(padL));
                rectLo.setAttribute('y', '0');
                rectLo.setAttribute('width', String(Math.max(0, width - padL - padR)));
                rectLo.setAttribute('height', String(Math.max(0, yFor(thMin))));
                rectLo.setAttribute('fill', thresholdShade);
                svg.appendChild(rectLo);
            }
            if (useThreshold && isFinite(thMax)) {
                var yHi = yFor(thMax);
                var rectHi = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rectHi.setAttribute('x', String(padL));
                rectHi.setAttribute('y', String(Math.max(0, yHi)));
                rectHi.setAttribute('width', String(Math.max(0, width - padL - padR)));
                rectHi.setAttribute('height', String(Math.max(0, chartH - padB - yHi)));
                rectHi.setAttribute('fill', thresholdShade);
                svg.appendChild(rectHi);
            }
            if (useThreshold && isFinite(target)) {
                var yT = yFor(target);
                var tLine = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
                tLine.setAttribute('x1', String(padL));
                tLine.setAttribute('y1', String(yT));
                tLine.setAttribute('x2', String(width - padR));
                tLine.setAttribute('y2', String(yT));
                tLine.setAttribute('stroke', targetStroke);
                tLine.setAttribute('stroke-width', '1');
                tLine.setAttribute('stroke-dasharray', '4 3');
                svg.appendChild(tLine);
            }

            if (highLine != null) {
                appendRefLine(
                    svg,
                    ownerDoc,
                    yFor(highLine),
                    width,
                    padL,
                    padR,
                    classicChart ? '#F1813F' : '#FFB020',
                    '5 4',
                    'High ' + highLine
                );
            }
            if (criticalLine != null) {
                appendRefLine(
                    svg,
                    ownerDoc,
                    yFor(criticalLine),
                    width,
                    padL,
                    padR,
                    classicChart ? '#DC4E41' : '#FF6B6B',
                    '2 3',
                    'Critical ' + criticalLine
                );
            }

            if (showArea) {
                var areaD = buildAreaPath(
                    plotValues,
                    width,
                    chartH,
                    padL,
                    padR,
                    padT,
                    padB,
                    scale.min,
                    scale.max
                );
                if (areaD) {
                    var areaPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
                    areaPath.setAttribute('class', 'bgdhamp-kpi-line-viz__area');
                    areaPath.setAttribute('d', areaD);
                    areaPath.setAttribute('fill', areaColor);
                    areaPath.setAttribute('stroke', 'none');
                    svg.appendChild(areaPath);
                }
            }

            if (shadeBetween && cmpValues) {
                var betweenD = buildBetweenPath(
                    plotValues,
                    cmpValues,
                    width,
                    chartH,
                    padL,
                    padR,
                    padT,
                    padB,
                    scale.min,
                    scale.max
                );
                if (betweenD) {
                    var betweenPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
                    betweenPath.setAttribute('class', 'bgdhamp-kpi-line-viz__shadeBetween');
                    betweenPath.setAttribute('d', betweenD);
                    betweenPath.setAttribute('fill', 'rgba(126,182,255,0.22)');
                    betweenPath.setAttribute('stroke', 'none');
                    svg.appendChild(betweenPath);
                }
            }

            var legendItems = [];
            var ei;
            for (ei = 0; ei < extraSeries.length; ei += 1) {
                var extraColor = SERIES_PALETTE[(ei + 2) % SERIES_PALETTE.length];
                var extraD = buildPath(
                    extraSeries[ei].values,
                    width,
                    chartH,
                    padL,
                    padR,
                    padT,
                    padB,
                    scale.min,
                    scale.max
                );
                if (extraD) {
                    var extraPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
                    extraPath.setAttribute('d', extraD);
                    extraPath.setAttribute('fill', 'none');
                    extraPath.setAttribute('stroke', extraColor);
                    extraPath.setAttribute('stroke-width', String(Math.max(1, strokeWidth - 0.5)));
                    extraPath.setAttribute('stroke-opacity', '0.85');
                    extraPath.setAttribute('vector-effect', 'non-scaling-stroke');
                    svg.appendChild(extraPath);
                    legendItems.push({ name: extraSeries[ei].name, color: extraColor });
                }
            }

            if (cmpValues) {
                var cmpPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
                var cmpD = buildPath(
                    cmpValues,
                    width,
                    chartH,
                    padL,
                    padR,
                    padT,
                    padB,
                    scale.min,
                    scale.max
                );
                if (cmpD) {
                    cmpPath.setAttribute('d', cmpD);
                    cmpPath.setAttribute('fill', 'none');
                    cmpPath.setAttribute('stroke', compareStroke);
                    cmpPath.setAttribute('stroke-width', String(strokeWidth));
                    cmpPath.setAttribute('stroke-dasharray', '6 4');
                    cmpPath.setAttribute('stroke-opacity', '0.9');
                    cmpPath.setAttribute('vector-effect', 'non-scaling-stroke');
                    svg.appendChild(cmpPath);
                    legendItems.unshift({
                        name: compareFieldName || 'compare',
                        color: compareStroke,
                        dashed: true,
                    });
                }
            }

            var mainD = buildPath(
                plotValues,
                width,
                chartH,
                padL,
                padR,
                padT,
                padB,
                scale.min,
                scale.max
            );
            if (mainD) {
                var mainPath = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
                mainPath.setAttribute('d', mainD);
                mainPath.setAttribute('fill', 'none');
                mainPath.setAttribute('stroke', stroke);
                mainPath.setAttribute('stroke-width', String(strokeWidth));
                mainPath.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(mainPath);
                legendItems.unshift({
                    name: series.fieldName || valueField || 'value',
                    color: stroke,
                });
            }

            appendAnnotationMarks(
                svg,
                ownerDoc,
                plotValues,
                annotations,
                width,
                chartH,
                padL,
                padR,
                padT,
                padB,
                scale,
                stroke,
                showAnnotationLabels
            );
            if (cmpValues) {
                appendAnnotationMarks(
                    svg,
                    ownerDoc,
                    cmpValues,
                    compareAnnotations,
                    width,
                    chartH,
                    padL,
                    padR,
                    padT,
                    padB,
                    scale,
                    compareStroke,
                    showAnnotationLabels
                );
            }

            var n = plotValues.length;
            var innerW = Math.max(1, width - padL - padR);
            var xStep = n > 1 ? innerW / (n - 1) : innerW;
            var ai;
            for (ai = 0; ai < n; ai += 1) {
                if (!anomalyFlags[ai]) continue;
                var ax = padL + ai * xStep;
                var ay = yFor(plotValues[ai]);
                var dot = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', ax.toFixed(1));
                dot.setAttribute('cy', ay.toFixed(1));
                dot.setAttribute('r', '3');
                dot.setAttribute('fill', '#ff6b6b');
                svg.appendChild(dot);
            }

            if (showXAxis && norm.timeLike && norm.ms.length >= 2) {
                var tickCount = 4;
                var ti;
                for (ti = 0; ti < tickCount; ti += 1) {
                    var idx = Math.round((ti * (n - 1)) / (tickCount - 1));
                    var tx = padL + idx * xStep;
                    var tick = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
                    tick.setAttribute('x', tx.toFixed(1));
                    tick.setAttribute('y', String(chartH - 2));
                    tick.setAttribute(
                        'fill',
                        classicChart ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
                    );
                    tick.setAttribute('font-size', '9');
                    tick.setAttribute('text-anchor', 'middle');
                    var label = isFinite(norm.ms[idx])
                        ? new Date(norm.ms[idx]).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : String(times[idx] != null ? times[idx] : '');
                    tick.textContent = label;
                    svg.appendChild(tick);
                }
            }

            var hoverAnnEl = null;
            if (showHoverAnnotation) {
                hoverAnnEl = ownerDoc.createElement('div');
                hoverAnnEl.className = 'bgdhamp-kpi-line-viz__hoverAnn';
                hoverAnnEl.setAttribute('aria-hidden', 'true');
            }

            var tooltip = ownerDoc.createElement('div');
            tooltip.className = 'bgdhamp-kpi-line-viz__tooltip';
            tooltip.setAttribute('role', 'status');
            tooltip.setAttribute('aria-live', 'polite');
            tooltip.setAttribute('aria-atomic', 'true');
            tooltip.style.display = 'none';
            tooltip.style.position = 'fixed';
            this._hoverTooltipEl = tooltip;

            function hitTestChart(px, py) {
                // Use chartWrap, not svg: flex can make chartWrap taller than svg while the gold
                // “footer” still looks like chart area — svg hit-test would miss those rows (React
                // pins a wrapper to exact chartH so it doesn’t have this gap).
                var rect = chartWrap.getBoundingClientRect();
                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    px >= rect.left &&
                    px <= rect.right &&
                    py >= rect.top &&
                    py <= rect.bottom
                );
            }

            var teardownDoc = [];

            // --- Document-level listeners: Splunk overlays block bubble events on the SVG ---
            if (showHover && n >= 2) {
                function onDocPointerMove(e) {
                    if (viz._infoOpen || !hitTestChart(e.clientX, e.clientY)) {
                        clearHoverOverlay(svg, tooltip, hoverAnnEl);
                        return;
                    }
                    var idx = hoverMath.seriesIndexFromPointerMeet(
                        e.clientX,
                        e.clientY,
                        svg,
                        width,
                        chartH,
                        padL,
                        padR,
                        n
                    );
                    if (idx === null) {
                        clearHoverOverlay(svg, tooltip, hoverAnnEl);
                        return;
                    }
                    var hx = padL + idx * xStep;
                    var hy = yFor(plotValues[idx]);
                    updateHoverOverlay(svg, tooltip, ownerDoc, {
                        hx: hx,
                        hy: hy,
                        padT: padT,
                        padB: padB,
                        chartH: chartH,
                        stroke: stroke,
                        idx: idx,
                        plotValues: plotValues,
                        times: times,
                        norm: norm,
                        unit: unit,
                        width: width,
                        chartWrap: chartWrap,
                        clientX: e.clientX,
                        clientY: e.clientY,
                        showHoverAnnotation: showHoverAnnotation,
                        hoverAnnEl: hoverAnnEl,
                        guideStroke: guideStroke,
                        primaryName: series.fieldName || valueField || 'value',
                        cmpValues: cmpValues,
                        cmpStroke: compareStroke,
                        cmpName: compareFieldName || 'compare',
                        yFor: yFor,
                        annotations: annotations,
                        compareAnnotations: compareAnnotations,
                    });
                }
                teardownDoc.push(function () {
                    ownerDoc.removeEventListener('pointermove', onDocPointerMove, true);
                    ownerDoc.removeEventListener('pointerdown', onDocPointerMove, true);
                    ownerDoc.removeEventListener('mousemove', onDocPointerMove, true);
                    if (ownerDoc.defaultView) {
                        ownerDoc.defaultView.removeEventListener('mousemove', onDocPointerMove, true);
                    }
                });
                ownerDoc.addEventListener('pointermove', onDocPointerMove, true);
                ownerDoc.addEventListener('pointerdown', onDocPointerMove, true);
                ownerDoc.addEventListener('mousemove', onDocPointerMove, true);
                if (ownerDoc.defaultView) {
                    ownerDoc.defaultView.addEventListener('mousemove', onDocPointerMove, true);
                }
            }

            // Same stacking issue breaks svg.onclick on dashboards.
            if (drilldown && norm.timeLike) {
                function onDocClick(e) {
                    if (!hitTestChart(e.clientX, e.clientY)) return;
                    var idx = hoverMath.seriesIndexFromPointerMeet(
                        e.clientX,
                        e.clientY,
                        svg,
                        width,
                        chartH,
                        padL,
                        padR,
                        n
                    );
                    if (idx === null) return;
                    var ms = norm.ms[idx];
                    if (!isFinite(ms)) return;
                    var prevMs = idx > 0 ? norm.ms[idx - 1] : ms;
                    var nextMs = idx < norm.ms.length - 1 ? norm.ms[idx + 1] : ms;
                    var earliest = Math.floor((prevMs + ms) / 2 / 1000);
                    var latest = Math.floor((ms + nextMs) / 2 / 1000);
                    var params = new URLSearchParams();
                    params.set('q', drilldownQuery || '*');
                    params.set('earliest', String(earliest));
                    params.set('latest', String(latest));
                    var navWin = ownerDoc.defaultView || window;
                    navWin.location.href = '/app/search/search?' + params.toString();
                }
                teardownDoc.push(function () {
                    ownerDoc.removeEventListener('click', onDocClick, true);
                });
                ownerDoc.addEventListener('click', onDocClick, true);
            }

            if (teardownDoc.length) {
                this._docHoverCleanup = function () {
                    var ti;
                    for (ti = 0; ti < teardownDoc.length; ti += 1) teardownDoc[ti]();
                };
            }

            if (this.el && this.el.style) {
                this.el.style.pointerEvents = 'auto';
            }
            enableAncestorPointerEvents(this.el);

            chartWrap.appendChild(svg);
            if (legendItems.length > 1) {
                var legend = ownerDoc.createElement('div');
                legend.className = 'bgdhamp-kpi-line-viz__legend';
                var li;
                for (li = 0; li < legendItems.length; li += 1) {
                    var row = ownerDoc.createElement('div');
                    row.className = 'bgdhamp-kpi-line-viz__legendRow';
                    var swatch = ownerDoc.createElement('span');
                    swatch.className = 'bgdhamp-kpi-line-viz__legendSwatch';
                    swatch.style.background = legendItems[li].color;
                    if (legendItems[li].dashed) {
                        swatch.style.background =
                            'repeating-linear-gradient(90deg,' +
                            legendItems[li].color +
                            ' 0 4px, transparent 4px 7px)';
                    }
                    var lab = ownerDoc.createElement('span');
                    lab.className = 'bgdhamp-kpi-line-viz__legendLabel';
                    lab.textContent = legendItems[li].name;
                    row.appendChild(swatch);
                    row.appendChild(lab);
                    legend.appendChild(row);
                }
                chartWrap.appendChild(legend);
            }
            if (hoverAnnEl) {
                chartWrap.appendChild(hoverAnnEl);
            }
            root.appendChild(chartWrap);
            this.el.appendChild(root);

            // --- Re-tint after Splunk may have painted chrome over the tile (vanilla pattern + placement colors) ---
            var vizHost = this.el;
            var repaintPass = 0;
            function repaintTrend() {
                repaintPass += 1;
                log('repaintTrend pass', repaintPass);
                repaintTrendTileCompat(vizHost, root, chartWrap, majorRow, trendBg, textColor);
                trendColors.applyTrendSurfaceStyle(root, containerBg);
                trendColors.applyTrendSurfaceStyle(chartWrap, chartStripBg);
                chartBg.setAttribute('fill', chartStripBg);
            }
            repaintTrend();
            if (typeof requestAnimationFrame === 'function') {
                log('repaintTrend: scheduling rAF follow-up');
                requestAnimationFrame(repaintTrend);
            }

            if (t0) {
                log('updateView: done', plotValues.length, 'points', 'ms', (performance.now() - t0).toFixed(1));
            } else {
                log('updateView: done', plotValues.length, 'points');
            }
            } catch (err) {
                if (debugEnabled()) {
                    // eslint-disable-next-line no-console
                    console.error('[' + VIZ_ID + '] updateView exception', err);
                }
                throw err;
            }
        },

        reflow: function () {
            log('reflow');
            if (this._lastData) {
                this.updateView(this._lastData, this._lastConfig == null ? {} : this._lastConfig);
            }
        },

        remove: function () {
            log('remove');
            if (typeof this._docHoverCleanup === 'function') {
                this._docHoverCleanup();
                this._docHoverCleanup = null;
            }
            if (this._hoverTooltipEl && this._hoverTooltipEl.parentNode) {
                this._hoverTooltipEl.parentNode.removeChild(this._hoverTooltipEl);
            }
            this._hoverTooltipEl = null;
            if (typeof this._infoCleanup === 'function') {
                this._infoCleanup();
                this._infoCleanup = null;
            }
            this._lastData = null;
            this._lastConfig = null;
            this.el.innerHTML = '';
        },
    });
});
