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
/**
 * Single-file AMD deliver: trend + hover math are inlined below so this viz only
 * needs the Classic 4-file set (visualization.js, visualization.css, formatter.html, preview.png).
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var VIZ_ID = 'splunkstuff_kpi_line';
    /** Fallback only — runtime NS comes from getPropertyNamespaceInfo() (Splunk 9.4+). */
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_line.';
    var VIZ_BUILD = '202611181405-kpi-line-table-fix';
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
    /** Category / X labels for | table / | stats by … results (no _time). */
    var CATEGORY_FIELD_HINTS = [
        'category',
        'host',
        'name',
        'label',
        'sourcetype',
        'source',
        'user',
        'status',
        'method',
        'action',
        'index',
        'region',
        'type',
    ];
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

    /** Unwrap Splunk table / JSON cell objects (and nested arrays). */
    function cellValue(cell) {
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
        return raw;
    }

    /** Parse numeric cells the way Studio / pie do — objects, commas, percents. */
    function parseNum(cell) {
        if (typeof cell === 'number' && isFinite(cell)) {
            return cell;
        }
        var raw = cellValue(cell);
        if (raw == null || raw === '') {
            return NaN;
        }
        if (typeof raw === 'number' && isFinite(raw)) {
            return raw;
        }
        var s = String(raw)
            .replace(/,/g, '')
            .replace(/%$/, '')
            .trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'nan') {
            return NaN;
        }
        var n = parseFloat(s, 10);
        return isFinite(n) ? n : NaN;
    }

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

    function propertyNamespace(viz) {
        if (viz && typeof viz.getPropertyNamespaceInfo === 'function') {
            try {
                var info = viz.getPropertyNamespaceInfo();
                if (info && info.propertyNamespace) {
                    var ns = String(info.propertyNamespace);
                    return ns.charAt(ns.length - 1) === '.' ? ns : ns + '.';
                }
            } catch (ignoreErr) {
                /* SplunkVisualizationBase may not expose namespace in all contexts */
            }
        }
        return NS;
    }

    /**
     * Splunk 9.4.x Format keys use the installed app id in the namespace.
     * Also accept bare prop / suffix matches so Appearance/Data still apply after transfer.
     */
    function findConfigValue(config, prop, viz) {
        if (config == null || typeof config !== 'object') {
            return { found: false, value: undefined };
        }
        var ns = propertyNamespace(viz || readConfig._activeViz);
        var candidates = [ns + prop, NS + prop, prop];
        var ci;
        for (ci = 0; ci < candidates.length; ci += 1) {
            var v = config[candidates[ci]];
            if (v !== undefined && v !== null) {
                return { found: true, value: v };
            }
        }
        var suffix = '.' + prop;
        var keys = Object.keys(config);
        var ki;
        for (ki = 0; ki < keys.length; ki += 1) {
            var key = keys[ki];
            if (key.length >= suffix.length && key.slice(-suffix.length) === suffix) {
                var v2 = config[key];
                if (v2 !== undefined && v2 !== null) {
                    return { found: true, value: v2 };
                }
            }
        }
        return { found: false, value: undefined };
    }

    function readConfig(config, prop, defaultVal) {
        var found = findConfigValue(config, prop, readConfig._activeViz);
        if (!found.found || found.value === '') {
            return defaultVal;
        }
        return found.value;
    }

    function readBool(config, prop, defaultVal) {
        var v = readConfig(config, prop, null);
        if (v === null || v === '') return defaultVal;
        if (v === true) return true;
        if (v === false) return false;
        var s = String(v).toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
        if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
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
        if (raw == null) return fallback;
        var s = String(raw).trim();
        if (!s) return fallback;
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
        if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
            return (
                '#' +
                s.charAt(1) +
                s.charAt(1) +
                s.charAt(2) +
                s.charAt(2) +
                s.charAt(3) +
                s.charAt(3)
            );
        }
        if (/^rgba?\(\s*[\d.]+\s*,/.test(s)) return s;
        return fallback;
    }

    /** Hex (#RRGGBB/#RGB), transparent, or rgb/rgba(...) for fills / strokes. */
    function sanitizeCssColor(raw, fallback) {
        if (raw == null) return fallback;
        var s = String(raw).trim();
        if (!s) return fallback;
        if (s.toLowerCase() === 'transparent') return 'transparent';
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
        if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
            return sanitizeHexColor(s, fallback);
        }
        if (/^rgba?\(\s*[\d.]+\s*,/.test(s)) return s;
        return fallback;
    }

    /* --- Inlined former ./bgdhampTrendColors (no separate AMD file) --- */
    var trendColors = (function () {
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
            trendDelta: trendDelta,
            trendBackground: trendBackground,
            applyTrendSurfaceStyle: applyTrendSurfaceStyle,
            applyTrendHostStyle: applyTrendHostStyle,
            repaintTrendTile: repaintTrendTile,
        };
    })();

    /* --- Inlined former ./bgdhampVizHoverMath (no separate AMD file) --- */
    var hoverMath = (function () {
        function clampNum(v, lo, hi) {
            return Math.max(lo, Math.min(hi, v));
        }
        // Stretch mapping: SVG uses preserveAspectRatio=none and fills the chart strip.
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
            return {
                x: ((clientX - rect.left) / rect.width) * userW,
                y: ((clientY - rect.top) / rect.height) * userH,
            };
        }
        function seriesIndexFromPointerMeet(
            clientX,
            clientY,
            rectSource,
            userW,
            userH,
            padLeft,
            padRight,
            pointCount
        ) {
            var mapped = viewportToSvgUserXY(clientX, clientY, rectSource, userW, userH);
            if (!mapped || pointCount < 2) {
                return null;
            }
            var innerW = Math.max(1, userW - padLeft - padRight);
            var xStep = pointCount > 1 ? innerW / (pointCount - 1) : innerW;
            return clampNum(Math.round((mapped.x - padLeft) / xStep), 0, pointCount - 1);
        }
        return {
            seriesIndexFromPointerMeet: seriesIndexFromPointerMeet,
        };
    })();

    function repaintTrendTileCompat(hostEl, rootEl, chartEl, majorEl, bg, textColor) {
        if (typeof trendColors.repaintTrendTile === 'function') {
            trendColors.repaintTrendTile(hostEl, rootEl, chartEl, majorEl, bg, textColor);
            return;
        }
        trendColors.applyTrendHostStyle(hostEl, bg, textColor);
        if (rootEl) trendColors.applyTrendSurfaceStyle(rootEl, bg);
        if (majorEl) trendColors.applyTrendSurfaceStyle(majorEl, bg);
        if (chartEl) trendColors.applyTrendSurfaceStyle(chartEl, bg);
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

    /**
     * Accept column-major, row-major, or raw result objects from Splunk Search.
     * | table / stats panels occasionally arrive as rows/results depending on host path.
     */
    function normalizeSearchData(rawData) {
        if (!rawData || typeof rawData !== 'object') {
            return { fields: [], columns: [] };
        }
        var fields = rawData.fields || [];
        if (rawData.columns && rawData.columns.length) {
            return { fields: fields, columns: rawData.columns };
        }
        var c;
        var r;
        if (rawData.rows && rawData.rows.length) {
            var colCount = fields.length;
            if (!colCount && rawData.rows[0] && rawData.rows[0].length) {
                colCount = rawData.rows[0].length;
                fields = [];
                for (c = 0; c < colCount; c += 1) {
                    fields.push({ name: 'field' + c });
                }
            }
            var cols = [];
            for (c = 0; c < colCount; c += 1) {
                cols[c] = [];
                for (r = 0; r < rawData.rows.length; r += 1) {
                    cols[c].push(rawData.rows[r] ? rawData.rows[r][c] : null);
                }
            }
            return { fields: fields, columns: cols };
        }
        if (rawData.results && rawData.results.length) {
            if (!fields.length) {
                fields = Object.keys(rawData.results[0] || {}).map(function (k) {
                    return { name: k };
                });
            }
            var cols2 = [];
            for (c = 0; c < fields.length; c += 1) {
                var name = fieldName(fields, c);
                cols2[c] = rawData.results.map(function (row) {
                    return row ? row[name] : null;
                });
            }
            return { fields: fields, columns: cols2 };
        }
        return { fields: fields, columns: [] };
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
        var cell = cellValue(rawData.columns[timeIdx][rowIdx]);
        if (cell == null || cell === '') return 0;
        if (typeof cell === 'number' && isFinite(cell)) return cell;
        var s = String(cell).trim();
        if (/^-?\d+(\.\d+)?$/.test(s)) {
            var n = parseFloat(s, 10);
            return isFinite(n) ? n : 0;
        }
        var ms = Date.parse(s);
        if (isFinite(ms)) return ms / 1000;
        var fb = parseNum(cell);
        return isFinite(fb) ? fb : 0;
    }

    /** Prefer a string/category column for X labels when SPL is | table / | stats by … */
    function pickCategoryColumnIndex(rawData, valueIdx, xField) {
        if (!rawData || !rawData.columns || !rawData.fields) {
            return -1;
        }
        var wanted = normalizeName(xField);
        if (wanted && wanted !== 'auto' && wanted !== 'none' && wanted !== '_time') {
            var explicit = findFieldIndex(rawData.fields, xField);
            if (explicit >= 0 && explicit !== valueIdx) {
                return explicit;
            }
        }
        var h;
        var c;
        for (h = 0; h < CATEGORY_FIELD_HINTS.length; h += 1) {
            var hinted = findFieldIndex(rawData.fields, CATEGORY_FIELD_HINTS[h]);
            if (hinted >= 0 && hinted !== valueIdx) {
                return hinted;
            }
        }
        // First non-numeric, non-skipped column (typical | table label, count).
        for (c = 0; c < rawData.columns.length; c += 1) {
            if (c === valueIdx) {
                continue;
            }
            var name = fieldName(rawData.fields, c);
            if (isSkippedValueField(name) || name === '_time') {
                continue;
            }
            if (!columnHasNumber(rawData, c)) {
                return c;
            }
        }
        // Fall back to first other column (even if numeric — e.g. status codes).
        for (c = 0; c < rawData.columns.length; c += 1) {
            if (c === valueIdx) {
                continue;
            }
            var name2 = fieldName(rawData.fields, c);
            if (isSkippedValueField(name2) || name2 === '_time') {
                continue;
            }
            return c;
        }
        return -1;
    }

    function reorderValuesAndTimesByTime(rawData, valueIdx, timeIdx, xField) {
        var valCol = rawData.columns[valueIdx];
        var n = valCol ? valCol.length : 0;
        if (!n) return { values: [], times: [], rowOrder: [], categoryField: '' };
        if (timeIdx < 0 || !rawData.columns[timeIdx] || rawData.columns[timeIdx].length !== n) {
            var plainOrder = [];
            var pi;
            for (pi = 0; pi < n; pi += 1) {
                plainOrder.push(pi);
            }
            var catIdx = pickCategoryColumnIndex(rawData, valueIdx, xField);
            var catCol = catIdx >= 0 ? rawData.columns[catIdx] : null;
            return {
                values: valCol.map(function (v) {
                    return parseNum(v);
                }),
                // Studio-like categorical X for table SPL (aligned with values).
                times: plainOrder.map(function (ri) {
                    if (catCol) {
                        return cellText(catCol[ri]) || String(ri + 1);
                    }
                    return String(ri + 1);
                }),
                rowOrder: plainOrder,
                categoryField: catIdx >= 0 ? fieldName(rawData.fields, catIdx) : '',
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
                return parseNum(valCol[ri]);
            }),
            times: order.map(function (ri) {
                return cellValue(tcol[ri]);
            }),
            rowOrder: order,
            categoryField: '',
        };
    }

    function cellText(cell) {
        var raw = cellValue(cell);
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
            if (isFinite(parseNum(col[i]))) {
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

    function buildSeriesFromRaw(rawData, valueField, xField) {
        if (!rawData || !rawData.columns || rawData.columns.length === 0) {
            return { values: [], times: [], rowOrder: [], fieldName: '', stringFields: {} };
        }
        var idx = resolveValueColumnIndex(rawData, valueField);
        if (idx < 0) {
            return { values: [], times: [], rowOrder: [], fieldName: '', stringFields: {} };
        }
        var tIdx = findTimeColumnIndex(rawData);
        var out = reorderValuesAndTimesByTime(rawData, idx, tIdx, xField);
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
            return parseNum(col[ri]);
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

    /** NaN-safe SMA: only finite samples contribute; gaps stay NaN. */
    function sma(values, windowSize) {
        var w = Math.max(1, Math.floor(Number(windowSize) || 1));
        if (w <= 1) return values.slice();
        var out = [];
        var i;
        var j;
        for (i = 0; i < values.length; i += 1) {
            if (!isFinite(Number(values[i]))) {
                out.push(NaN);
                continue;
            }
            var sum = 0;
            var count = 0;
            var start = Math.max(0, i - w + 1);
            for (j = start; j <= i; j += 1) {
                var sample = Number(values[j]);
                if (isFinite(sample)) {
                    sum += sample;
                    count += 1;
                }
            }
            out.push(count ? sum / count : NaN);
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

    /**
     * nullMode: gaps (break line), zero (treat null as 0), connect (skip nulls, keep stroke).
     */
    function buildPath(values, width, height, padL, padR, padT, padB, vmin, vmax, nullMode) {
        var mode = nullMode === 'zero' || nullMode === 'connect' ? nullMode : 'gaps';
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
                if (mode === 'zero') {
                    v = 0;
                } else if (mode === 'connect') {
                    continue;
                } else {
                    penUp = true;
                    continue;
                }
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

    /** Area fill per contiguous finite segment so null gaps do not poison the path. */
    function buildAreaPath(values, width, height, padL, padR, padT, padB, vmin, vmax, nullMode) {
        var mode = nullMode === 'zero' || nullMode === 'connect' ? nullMode : 'gaps';
        if (mode !== 'gaps') {
            var line = buildPath(values, width, height, padL, padR, padT, padB, vmin, vmax, mode);
            if (!line) {
                return '';
            }
            var nAll = values.length;
            var iwAll = Math.max(1, width - padL - padR);
            var xStepAll = nAll > 1 ? iwAll / (nAll - 1) : 0;
            var lastX = padL + (nAll - 1) * xStepAll;
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
        var iw = Math.max(1, width - padL - padR);
        var ih = Math.max(1, height - padT - padB);
        var n = values.length;
        if (n < 2) return '';
        var xStep = iw / (n - 1);
        var baselineY = height - padB;
        var parts = [];
        var seg = [];
        var i;
        function flushSeg() {
            if (seg.length < 2) {
                seg = [];
                return;
            }
            var s;
            var firstX = padL + seg[0].i * xStep;
            var lastSegX = padL + seg[seg.length - 1].i * xStep;
            for (s = 0; s < seg.length; s += 1) {
                parts.push(
                    (s === 0 ? 'M' : 'L') +
                        (padL + seg[s].i * xStep).toFixed(1) +
                        ' ' +
                        seg[s].y.toFixed(1)
                );
            }
            parts.push('L' + lastSegX.toFixed(1) + ' ' + baselineY.toFixed(1));
            parts.push('L' + firstX.toFixed(1) + ' ' + baselineY.toFixed(1));
            parts.push('Z');
            seg = [];
        }
        for (i = 0; i < n; i += 1) {
            var v = Number(values[i]);
            if (!isFinite(v)) {
                flushSeg();
                continue;
            }
            var ratio = clamp((v - vmin) / (vmax - vmin), 0, 1);
            seg.push({ i: i, y: padT + ih - ratio * ih });
        }
        flushSeg();
        return parts.join(' ');
    }

    function buildBetweenPath(primaryValues, compareValues, width, height, padL, padR, padT, padB, vmin, vmax, nullMode) {
        var mode = nullMode === 'zero' || nullMode === 'connect' ? nullMode : 'gaps';
        var n = Math.min(primaryValues.length, compareValues.length);
        if (n < 2) {
            return '';
        }
        var iw = Math.max(1, width - padL - padR);
        var ih = Math.max(1, height - padT - padB);
        var xStep = iw / (n - 1);
        var parts = [];
        var i;
        function resolveV(raw) {
            var v = Number(raw);
            if (isFinite(v)) {
                return v;
            }
            return mode === 'zero' ? 0 : NaN;
        }
        function yAt(v) {
            var ratio = clamp((v - vmin) / (vmax - vmin), 0, 1);
            return padT + ih - ratio * ih;
        }
        var top = [];
        var bottom = [];
        for (i = 0; i < n; i += 1) {
            var pv = resolveV(primaryValues[i]);
            var cv = resolveV(compareValues[i]);
            if (!isFinite(pv) || !isFinite(cv)) {
                if (mode === 'connect') {
                    continue;
                }
                if (top.length >= 2) {
                    break;
                }
                top = [];
                bottom = [];
                continue;
            }
            top.push({ x: padL + i * xStep, y: yAt(pv) });
            bottom.push({ x: padL + i * xStep, y: yAt(cv) });
        }
        if (top.length < 2) {
            return '';
        }
        for (i = 0; i < top.length; i += 1) {
            parts.push((i === 0 ? 'M' : 'L') + top[i].x.toFixed(1) + ' ' + top[i].y.toFixed(1));
        }
        for (i = bottom.length - 1; i >= 0; i -= 1) {
            parts.push('L' + bottom[i].x.toFixed(1) + ' ' + bottom[i].y.toFixed(1));
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

    /**
     * Avoid Date.parse('web-01') style false positives that turn table categories into times.
     * Accept ISO / common Splunk datetime strings only.
     */
    function looksLikeDateTimeString(s) {
        var t = String(s == null ? '' : s).trim();
        if (!t) {
            return false;
        }
        if (/^\d{4}-\d{2}-\d{2}([T\s].*)?$/.test(t)) {
            return true;
        }
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}([,\s].*)?$/.test(t)) {
            return true;
        }
        if (/^[A-Za-z]{3},?\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(t)) {
            return true;
        }
        if (/^\d{4}\/\d{2}\/\d{2}/.test(t)) {
            return true;
        }
        return false;
    }

    function normalizeTimes(rawTimes, len) {
        var times = Array.isArray(rawTimes) ? rawTimes.slice(0, len) : [];
        var ms = [];
        var ok = 0;
        var i;
        for (i = 0; i < len; i += 1) {
            var t = cellValue(times[i]);
            if (typeof t === 'string' && looksLikeDateTimeString(t)) {
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

    /** Keep tiny ratios readable (0.0028 → not "0"). */
    function formatNumber(v) {
        if (!isFinite(v)) return '—';
        var abs = Math.abs(v);
        if (abs > 0 && abs < 0.01) {
            return v.toLocaleString(undefined, { maximumSignificantDigits: 4 });
        }
        return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    /** Studio-like Y tick steps (nice numbers across [min, max]). */
    function buildYTicks(min, max, targetCount) {
        var lo = Number(min);
        var hi = Number(max);
        var count = Math.max(2, Math.floor(Number(targetCount) || 5));
        if (!isFinite(lo) || !isFinite(hi)) {
            return [0, 1];
        }
        if (hi < lo) {
            var swap = lo;
            lo = hi;
            hi = swap;
        }
        if (!(hi > lo)) {
            hi = lo + 1;
        }
        var range = hi - lo;
        var rough = range / (count - 1);
        var exp = Math.floor(Math.log(rough) / Math.LN10);
        var pow = Math.pow(10, exp);
        var frac = rough / pow;
        var niceFrac;
        if (frac <= 1) niceFrac = 1;
        else if (frac <= 2) niceFrac = 2;
        else if (frac <= 5) niceFrac = 5;
        else niceFrac = 10;
        var step = niceFrac * pow;
        var start = Math.ceil(lo / step) * step;
        var ticks = [];
        var v;
        var guard = 0;
        for (v = start; v <= hi + step * 0.001 && guard < 24; v += step) {
            ticks.push(v);
            guard += 1;
        }
        if (!ticks.length) {
            ticks = [lo, hi];
        } else if (ticks[0] > lo + step * 0.05) {
            ticks.unshift(lo);
        }
        if (ticks[ticks.length - 1] < hi - step * 0.05) {
            ticks.push(hi);
        }
        return ticks;
    }

    function estimateYAxisPad(ticks) {
        var maxLen = 2;
        var i;
        for (i = 0; i < ticks.length; i += 1) {
            maxLen = Math.max(maxLen, String(formatNumber(ticks[i])).length);
        }
        return Math.min(76, Math.max(36, Math.round(maxLen * 7.2 + 12)));
    }

    function formatDelta(d) {
        if (!isFinite(d)) return '—';
        return (d >= 0 ? '\u25b2 ' : '\u25bc ') + formatNumber(d);
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
        return formatNumber(v) + String(unit || '');
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
        initialize: function () {
            // Splunk Enterprise 9.4 custom viz lifecycle
            if (this.el && this.el.classList) {
                this.el.classList.add('bgdhamp-kpi-line-viz-host');
            }
            this._lastData = null;
            this._lastConfig = null;
        },

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
            var safe = normalizeSearchData(rawData);
            if (!safe.columns.length) {
                log('formatData: empty columns');
                return { rawData: safe, values: [], times: [], fieldName: '', stringFields: {} };
            }
            var series = buildSeriesFromRaw(safe, 'auto', 'auto');
            if (!series.values.length) {
                // Classic OOTB shows empty panel — soft-fail instead of VisualizationError.
                log('formatData: no numeric column — soft empty');
                return { rawData: safe, values: [], times: [], fieldName: '', stringFields: {} };
            }
            log(
                'formatData: field',
                series.fieldName,
                'points',
                series.values.length,
                '_time',
                findTimeColumnIndex(safe) >= 0,
                'x',
                series.categoryField || '(row)'
            );
            return {
                rawData: safe,
                values: series.values,
                times: series.times,
                fieldName: series.fieldName,
                categoryField: series.categoryField || '',
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
            readConfig._activeViz = viz;
            if (config == null || typeof config !== 'object') {
                log('updateView: config missing or non-object — using {}');
                config = {};
            }
            this._lastData = data;
            this._lastConfig = config;
            log('updateView: propertyNamespace', propertyNamespace(viz));
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
            var xFieldCustom = String(readConfig(config, 'xFieldCustom', '') || '').trim();
            var xField = xFieldCustom
                ? xFieldCustom
                : String(readConfig(config, 'xField', 'auto') || 'auto').trim() || 'auto';
            var rawData = normalizeSearchData(
                data && data.rawData ? data.rawData : data && data.columns ? data : null
            );
            if (!rawData.columns.length && data && data.values) {
                rawData = null;
            }
            var series =
                rawData && rawData.columns && rawData.columns.length
                    ? buildSeriesFromRaw(rawData, valueField, xField)
                    : {
                          values: (data && data.values) || [],
                          times: (data && data.times) || [],
                          fieldName: (data && data.fieldName) || '',
                          categoryField: (data && data.categoryField) || '',
                          stringFields: (data && data.stringFields) || {},
                      };
            var values = series.values || [];
            var times = series.times || [];
            var stringFields = series.stringFields || {};
            log(
                'updateView: valueField',
                valueField,
                'xField',
                xField,
                'resolved',
                series.fieldName || '(none)',
                'x',
                series.categoryField || '(none)',
                'points',
                values.length
            );
            var backgroundMode = String(readConfig(config, 'backgroundMode', 'transparent') || 'transparent')
                .trim()
                .toLowerCase();
            var backgroundRaw = readConfig(config, 'background', '#01417F');
            var background;
            if (
                backgroundMode === 'transparent' ||
                String(backgroundRaw == null ? '' : backgroundRaw).trim().toLowerCase() === 'transparent'
            ) {
                background = 'transparent';
            } else {
                background = sanitizeCssColor(backgroundRaw, '#01417F');
            }
            var textColorRaw = readConfig(config, 'textColor', null);
            var textColor;
            if (textColorRaw != null && String(textColorRaw).trim() !== '') {
                textColor = sanitizeHexColor(textColorRaw, background === 'transparent' ? '#1D2733' : '#FFFFFF');
            } else {
                // Search / transparent panels are light — use dark ink. Solid navy tiles stay white.
                textColor = background === 'transparent' ? '#1D2733' : '#FFFFFF';
            }
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
            var seriesModeRaw = String(readConfig(config, 'seriesMode', 'auto') || 'auto')
                .trim()
                .toLowerCase();
            var seriesMode = seriesModeRaw === 'multi' ? 'multi' : seriesModeRaw === 'single' ? 'single' : 'auto';
            var nullValueMode = String(readConfig(config, 'nullValueMode', 'gaps') || 'gaps')
                .trim()
                .toLowerCase();
            if (nullValueMode !== 'zero' && nullValueMode !== 'connect') {
                nullValueMode = 'gaps';
            }
            var markersCfg = readConfig(config, 'showMarkers', null);
            var showMarkers = markersCfg == null ? false : readBool(config, 'showMarkers', false);
            var showLegend = readBool(config, 'showLegend', true);
            var chartStyle = String(readConfig(config, 'chartStyle', '') || '')
                .trim()
                .toLowerCase();
            var showArea = readBool(config, 'showArea', false);
            if (chartStyle === 'area') {
                showArea = true;
            } else if (chartStyle === 'line') {
                showArea = false;
            }
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

            if (seriesMode === 'auto' && rawData && primaryColumnIndex >= 0) {
                seriesMode =
                    listMultiSeriesColumns(rawData, primaryColumnIndex).length > 0 ? 'multi' : 'single';
            } else if (seriesMode !== 'multi') {
                seriesMode = 'single';
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

            // Y scale: Auto (default) fits all plotted series; Fixed uses Format min/max.
            var yScaleMode = String(readConfig(config, 'yScale', 'auto') || 'auto')
                .trim()
                .toLowerCase();
            if (yScaleMode !== 'fixed') {
                yScaleMode = 'auto';
            }
            var scale = bounds(readConfig(config, 'min', 0), readConfig(config, 'max', 100));
            if (yScaleMode === 'auto' || seriesMode === 'multi' || cmpValues) {
                var fitArrays = [plotValues];
                if (cmpValues) {
                    fitArrays.push(cmpValues);
                }
                for (mi = 0; mi < extraSeries.length; mi += 1) {
                    fitArrays.push(extraSeries[mi].values);
                }
                scale = fitScaleToSeries(scale, fitArrays);
            }
            var strokeRaw = readConfig(config, 'stroke', null);
            var stroke = sanitizeHexColor(
                strokeRaw != null && String(strokeRaw).trim() !== '' ? strokeRaw : '#01417F',
                '#01417F'
            );
            var unit = String(readConfig(config, 'unit', '') || '');
            var subheader = String(readConfig(config, 'subheader', '') || '');
            var useThreshold = readBool(config, 'threshold', false);
            var thMin = useThreshold ? readFloat(config, 'thresholdMin', 20) : null;
            var thMax = useThreshold ? readFloat(config, 'thresholdMax', 80) : null;
            var target = useThreshold ? readFloat(config, 'target', 50) : null;
            var anomalyMode = String(readConfig(config, 'anomalies', 'none'));
            var anomalySens = readInt(config, 'anomalySensitivity', 3);
            // Chart defaults: X ticks on, Y scale/grid off, no up/down trend delta.
            var showXAxis = readBool(config, 'showXAxis', true);
            var showYAxis = readBool(config, 'showYAxis', false);
            var showYGrid = readBool(config, 'showYGrid', false);
            // Splunk formatter text fields may omit the key; only explicit false disables hover.
            var showHover = readBool(config, 'showHover', true);
            if (readConfig(config, 'showHover', null) === null) {
                showHover = true;
            }
            var drilldown = readBool(config, 'drilldown', false);
            var drilldownQuery = String(
                readConfig(config, 'drilldownQuery', 'search index=_internal | stats count') || ''
            );

            var showMajor = readBool(config, 'showMajor', false);
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
            // Chart margins — Studio mode auto-bumps when axes are enabled.
            var padLeftCfg = readFloat(config, 'padLeft', 0);
            var padRightCfg = readFloat(config, 'padRight', 8);
            var padTopCfg = readFloat(config, 'padTop', 8);
            var padBottomCfg = readFloat(config, 'padBottom', 0);
            if (!isFinite(padLeftCfg)) padLeftCfg = 0;
            if (!isFinite(padRightCfg)) padRightCfg = 8;
            if (!isFinite(padTopCfg)) padTopCfg = 8;
            if (!isFinite(padBottomCfg)) padBottomCfg = 0;

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

            // No good/bad trend fills — tile always uses Format background (default transparent).
            var tileBg = background;
            trendColors.applyTrendHostStyle(this.el, tileBg, textColor);

            var last = plotValues[plotValues.length - 1];

            var norm = normalizeTimes(times, plotValues.length);
            var isCategorical = !norm.timeLike;
            // Table / stats-by categories: show point markers by default so the series is obvious.
            if (markersCfg == null && isCategorical) {
                showMarkers = true;
            }
            var anomalyFlags = computeAnomalies(plotValues, anomalyMode, anomalySens);

            var width = Math.max(120, this.el.clientWidth || 400);
            var height = Math.max(80, this.el.clientHeight || 200);
            var subheaderH = subheader ? 28 : 0;
            var majorH = showMajor ? 44 : 0;
            var padL = Math.max(0, padLeftCfg);
            var padR = Math.max(0, padRightCfg);
            var padT = Math.max(0, padTopCfg);
            var padB = Math.max(0, padBottomCfg);
            var yTicks = showYAxis ? buildYTicks(scale.min, scale.max, 5) : [];
            if (showYAxis) {
                var autoPadL = estimateYAxisPad(yTicks);
                if (padL < autoPadL) {
                    padL = autoPadL;
                }
                if (padT < 8) {
                    padT = 8;
                }
                if (padR < 8) {
                    padR = 8;
                }
            }
            if (showXAxis && padB < 18) {
                padB = 18;
            }
            // Keep first/last category labels inside the plot for | table results.
            if (isCategorical && showXAxis) {
                if (padL < 28) {
                    padL = 28;
                }
                if (padR < 28) {
                    padR = 28;
                }
            }
            var chartH = Math.max(40, height - subheaderH - majorH - textRowH);

            var containerBg = tileBg;
            var chartStripBg = tileBg;
            var classicChart = !showMajor || background === 'transparent';
            var onLightPanel = background === 'transparent';
            var guideStroke = onLightPanel || classicChart ? 'rgba(29,39,51,0.28)' : 'rgba(255,255,255,0.22)';
            var axisLabelFill = textColor || (onLightPanel ? '#1D2733' : '#FFFFFF');
            var gridStroke = onLightPanel ? 'rgba(29,39,51,0.12)' : 'rgba(255,255,255,0.16)';

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
                textRow.style.background = 'rgba(0,0,0,0.42)';
                textRow.style.color = textColor;
                textRow.style.textShadow = '0 1px 1px rgba(0,0,0,0.45)';
                textRow.style.fontWeight = '600';
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
                majorRow.style.justifyContent = centerMajor ? 'center' : 'flex-start';
                majorRow.style.textAlign = centerMajor ? 'center' : '';
                var major = ownerDoc.createElement('div');
                major.className = 'bgdhamp-kpi-line-viz__majorVal';
                major.textContent = isFinite(last) ? formatNumber(last) : '—';
                if (unit) {
                    var unitSpan = ownerDoc.createElement('span');
                    unitSpan.className = 'bgdhamp-kpi-line-viz__unit';
                    unitSpan.style.fontSize = unitScale + 'em';
                    unitSpan.textContent = unit;
                    major.appendChild(unitSpan);
                }

                // No up/down trend delta — major value only.
                trendColors.applyTrendSurfaceStyle(majorRow, tileBg);

                majorRow.appendChild(major);
                root.appendChild(majorRow);
            }

            var chartWrap = ownerDoc.createElement('div');
            chartWrap.className = 'bgdhamp-kpi-line-viz__chart';
            chartWrap.style.flex = '1 1 auto';
            chartWrap.style.minHeight = '0';
            chartWrap.style.width = '100%';
            chartWrap.style.overflow = 'hidden';
            trendColors.applyTrendSurfaceStyle(chartWrap, chartStripBg);
            chartWrap.style.pointerEvents = 'auto';

            // --- SVG fills the chart strip flush (stretch); hover math uses stretch mapping ---
            var svg = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', String(width));
            svg.setAttribute('height', String(chartH));
            svg.setAttribute('viewBox', '0 0 ' + width + ' ' + chartH);
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.style.display = 'block';
            svg.style.width = '100%';
            svg.style.height = '100%';
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

            if (showYAxis && showYGrid && yTicks.length) {
                var gi;
                for (gi = 0; gi < yTicks.length; gi += 1) {
                    var gy = yFor(yTicks[gi]);
                    var gLine = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
                    gLine.setAttribute('class', 'bgdhamp-kpi-line-viz__yGrid');
                    gLine.setAttribute('x1', String(padL));
                    gLine.setAttribute('y1', gy.toFixed(1));
                    gLine.setAttribute('x2', String(width - padR));
                    gLine.setAttribute('y2', gy.toFixed(1));
                    gLine.setAttribute('stroke', gridStroke);
                    gLine.setAttribute('stroke-width', '1');
                    gLine.setAttribute('vector-effect', 'non-scaling-stroke');
                    svg.appendChild(gLine);
                }
            }

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
                    scale.max,
                    nullValueMode
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
                    scale.max,
                    nullValueMode
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
                    scale.max,
                    nullValueMode
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
                    scale.max,
                    nullValueMode
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
                scale.max,
                nullValueMode
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

            if (showMarkers && plotValues.length) {
                var nMark = plotValues.length;
                var xStepMark = nMark > 1 ? Math.max(1, width - padL - padR) / (nMark - 1) : 0;
                var miMark;
                for (miMark = 0; miMark < nMark; miMark += 1) {
                    var mv = Number(plotValues[miMark]);
                    if (!isFinite(mv) && nullValueMode !== 'zero') {
                        continue;
                    }
                    if (!isFinite(mv) && nullValueMode === 'zero') {
                        mv = 0;
                    }
                    var mDot = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    mDot.setAttribute('cx', (padL + miMark * xStepMark).toFixed(1));
                    mDot.setAttribute('cy', yFor(mv).toFixed(1));
                    mDot.setAttribute('r', '2.5');
                    mDot.setAttribute('fill', stroke);
                    mDot.setAttribute(
                        'stroke',
                        onLightPanel ? '#FFFFFF' : classicChart ? '#fff' : 'rgba(0,0,0,0.25)'
                    );
                    mDot.setAttribute('stroke-width', '1');
                    svg.appendChild(mDot);
                }
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

            if (showYAxis && yTicks.length) {
                var yAxisLine = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
                yAxisLine.setAttribute('class', 'bgdhamp-kpi-line-viz__yAxis');
                yAxisLine.setAttribute('x1', String(padL));
                yAxisLine.setAttribute('y1', String(padT));
                yAxisLine.setAttribute('x2', String(padL));
                yAxisLine.setAttribute('y2', String(chartH - padB));
                yAxisLine.setAttribute('stroke', guideStroke);
                yAxisLine.setAttribute('stroke-width', '1');
                yAxisLine.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(yAxisLine);

                var yi;
                for (yi = 0; yi < yTicks.length; yi += 1) {
                    var yTickVal = yTicks[yi];
                    var yTickY = yFor(yTickVal);
                    var yTickMark = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
                    yTickMark.setAttribute('x1', String(padL - 4));
                    yTickMark.setAttribute('y1', yTickY.toFixed(1));
                    yTickMark.setAttribute('x2', String(padL));
                    yTickMark.setAttribute('y2', yTickY.toFixed(1));
                    yTickMark.setAttribute('stroke', guideStroke);
                    yTickMark.setAttribute('stroke-width', '1');
                    svg.appendChild(yTickMark);

                    var yLabel = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
                    yLabel.setAttribute('class', 'bgdhamp-kpi-line-viz__yTick');
                    yLabel.setAttribute('x', String(padL - 6));
                    yLabel.setAttribute('y', yTickY.toFixed(1));
                    yLabel.setAttribute('fill', axisLabelFill);
                    yLabel.setAttribute('font-size', '10');
                    yLabel.setAttribute('font-weight', '600');
                    yLabel.setAttribute('text-anchor', 'end');
                    yLabel.setAttribute('dominant-baseline', 'middle');
                    yLabel.textContent = formatNumber(yTickVal);
                    svg.appendChild(yLabel);
                }
            }

            if (showXAxis && n >= 2) {
                var xAxisLine = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
                xAxisLine.setAttribute('class', 'bgdhamp-kpi-line-viz__xAxis');
                xAxisLine.setAttribute('x1', String(padL));
                xAxisLine.setAttribute('y1', String(chartH - padB));
                xAxisLine.setAttribute('x2', String(width - padR));
                xAxisLine.setAttribute('y2', String(chartH - padB));
                xAxisLine.setAttribute('stroke', guideStroke);
                xAxisLine.setAttribute('stroke-width', '1');
                xAxisLine.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(xAxisLine);

                var tickCount = Math.min(5, n);
                var ti;
                for (ti = 0; ti < tickCount; ti += 1) {
                    var idx = Math.round((ti * (n - 1)) / (tickCount - 1));
                    var tx = padL + idx * xStep;
                    var xTickMark = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'line');
                    xTickMark.setAttribute('x1', tx.toFixed(1));
                    xTickMark.setAttribute('y1', String(chartH - padB));
                    xTickMark.setAttribute('x2', tx.toFixed(1));
                    xTickMark.setAttribute('y2', String(chartH - padB + 4));
                    xTickMark.setAttribute('stroke', guideStroke);
                    xTickMark.setAttribute('stroke-width', '1');
                    svg.appendChild(xTickMark);

                    var tick = ownerDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
                    tick.setAttribute('class', 'bgdhamp-kpi-line-viz__xTick');
                    tick.setAttribute('x', tx.toFixed(1));
                    tick.setAttribute('y', String(chartH - 3));
                    tick.setAttribute('fill', axisLabelFill);
                    tick.setAttribute('font-size', '10');
                    tick.setAttribute('font-weight', '600');
                    tick.setAttribute('text-anchor', 'middle');
                    var label;
                    if (norm.timeLike && isFinite(norm.ms[idx])) {
                        label = new Date(norm.ms[idx]).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                    } else if (times[idx] != null && String(times[idx]).trim() !== '') {
                        // Category / table SPL labels (host, status, …)
                        label = String(times[idx]);
                        if (label.length > 18) {
                            label = label.slice(0, 16) + '…';
                        }
                    } else {
                        label = String(idx + 1);
                    }
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
                // SVG stretches to fill chartWrap (preserveAspectRatio=none), so either rect works.
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
            if (showLegend && legendItems.length > 1) {
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
                repaintTrendTileCompat(vizHost, root, chartWrap, majorRow, tileBg, textColor);
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
