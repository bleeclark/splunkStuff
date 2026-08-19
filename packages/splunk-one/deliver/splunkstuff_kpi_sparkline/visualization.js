/* eslint-disable */
/**
 * Splunk custom visualization: KPI + labels + delta + sparkline (gallery-intended layout).
 * New viz id so Splunk loads fresh AMD module; labels use inline styles (CSS optional).
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_kpi_sparkline.';
    var VIZ_BUILD = '20260817-kpi-spark-light-wash';
    /** Layout budget: 35px subheader + 137px body = 172px panel default_height. */
    var SUBHEADER_HEIGHT_PX = 35;
    var BODY_FRAME_HEIGHT_PX = 137;
    var PANEL_DEFAULT_HEIGHT_PX = SUBHEADER_HEIGHT_PX + BODY_FRAME_HEIGHT_PX;
    var SPARK_STRIP_HEIGHT_PX = 36;
    var DEMO_LABELS = {
        majorLabel: '',
        deltaLabel: '',
        badgeText: '',
        sparkPointLabels: '',
    };
    /** Prefer these names when Format valueField is Auto (Single Value–like panels). */
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
    /** Skip Splunk metadata that looks numeric but is constant (flat sparklines). */
    var SKIP_VALUE_FIELDS = {
        _time: true,
        _span: true,
        _spandays: true,
        _si: true,
        _serial: true,
        _cd: true,
        _indextime: true,
        linecount: true,
    };

    function inlineCaptionStyle(el, textColor) {
        el.style.display = 'block';
        el.style.fontSize = '11px';
        el.style.fontWeight = '700';
        el.style.lineHeight = '1.15';
        el.style.color = textColor;
        el.style.textShadow = '0 1px 2px rgba(0,0,0,0.35)';
        el.style.padding = '1px 6px';
        el.style.borderRadius = '3px';
        el.style.background = 'rgba(0,0,0,0.28)';
        el.style.marginBottom = '1px';
        el.style.textAlign = 'center';
    }

    function appendIndicatorPair(container, valueEl, labelText, textColor, position) {
        var pos = position === 'right' ? 'right' : 'above';
        var pair = document.createElement('div');
        pair.className =
            'bgdhamp-sparkline-value-viz__indicatorPair bgdhamp-sparkline-value-viz__indicatorPair--' +
            pos;

        function makeLabel() {
            var lbl = document.createElement('div');
            lbl.className = 'bgdhamp-sparkline-value-viz__indicatorLabel';
            lbl.textContent = labelText;
            inlineCaptionStyle(lbl, textColor);
            if (pos === 'right') {
                lbl.style.marginBottom = '0';
            }
            return lbl;
        }

        if (pos === 'right') {
            pair.appendChild(valueEl);
            if (labelText) {
                pair.appendChild(makeLabel());
            }
        } else {
            if (labelText) {
                pair.appendChild(makeLabel());
            }
            pair.appendChild(valueEl);
        }
        container.appendChild(pair);
        return pair;
    }

    function inlineBadgeStyle(el) {
        el.style.position = 'absolute';
        el.style.top = '8px';
        el.style.right = '10px';
        el.style.zIndex = '6';
        el.style.maxWidth = '45%';
        el.style.padding = '5px 12px';
        el.style.fontSize = '12px';
        el.style.fontWeight = '700';
        el.style.lineHeight = '1.25';
        el.style.textAlign = 'right';
        el.style.color = '#fff';
        el.style.background = 'rgba(0,0,0,0.55)';
        el.style.border = '1px solid rgba(255,255,255,0.25)';
        el.style.borderRadius = '4px';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';
        el.style.pointerEvents = 'none';
    }

    function fieldsList(rawData) {
        if (rawData && rawData.fields && rawData.fields.length) {
            return rawData.fields;
        }
        if (rawData && rawData.meta && rawData.meta.fields && rawData.meta.fields.length) {
            return rawData.meta.fields;
        }
        return [];
    }

    function cellValue(cell) {
        if (cell == null) {
            return cell;
        }
        if (typeof cell === 'object' && cell.value != null) {
            return cell.value;
        }
        return cell;
    }

    function parseNum(cell) {
        var n = parseFloat(cellValue(cell), 10);
        return isFinite(n) ? n : NaN;
    }

    function fieldName(fields, idx) {
        if (!fields || idx < 0 || idx >= fields.length) {
            return '';
        }
        var f = fields[idx];
        if (typeof f === 'string') {
            return f;
        }
        if (f != null && f.name != null) {
            return String(f.name);
        }
        return '';
    }

    function findTimeColumnIndex(rawData) {
        var fields = fieldsList(rawData);
        var i;
        for (i = 0; i < fields.length; i += 1) {
            if (fieldName(fields, i) === '_time') {
                return i;
            }
        }
        return -1;
    }

    function timeSortKey(rawData, timeIdx, rowIdx) {
        var cell = cellValue(rawData.columns[timeIdx][rowIdx]);
        if (cell == null || cell === '') {
            return 0;
        }
        if (typeof cell === 'number' && isFinite(cell)) {
            return cell;
        }
        var s = String(cell).trim();
        if (/^-?\d+(\.\d+)?$/.test(s)) {
            var n = parseFloat(s, 10);
            return isFinite(n) ? n : 0;
        }
        var ms = Date.parse(s);
        if (isFinite(ms)) {
            return ms / 1000;
        }
        var fb = parseFloat(s, 10);
        return isFinite(fb) ? fb : 0;
    }

    function propertyNamespace(viz) {
        if (viz && typeof viz.getPropertyNamespaceInfo === 'function') {
            try {
                var info = viz.getPropertyNamespaceInfo();
                if (info && info.propertyNamespace) {
                    return info.propertyNamespace;
                }
            } catch (ignoreErr) {
                /* SplunkVisualizationBase may not expose namespace in all contexts */
            }
        }
        return NS;
    }

    function readConfig(config, prop, defaultVal, viz) {
        var found = findConfigValue(config, prop, viz);
        if (!found.found || found.value === '') {
            return defaultVal;
        }
        return found.value;
    }

    function findConfigValue(config, prop, viz) {
        if (config == null || typeof config !== 'object') {
            return { found: false, value: undefined };
        }
        var ns = propertyNamespace(viz);
        var candidates = [
            ns + prop,
            NS + prop,
            'so_BUI_pickulationts.' + prop,
            'display.visualizations.custom.so_BUI_pickulationts.' + prop,
            prop,
        ];
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

    function truthy(raw) {
        var s = String(raw == null ? '' : raw).trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'on';
    }

    function sanitizeHexColor(raw, fallback) {
        var s = String(raw == null ? '' : raw).trim();
        return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
    }

    function clamp(n, lo, hi) {
        return Math.max(lo, Math.min(hi, n));
    }

    function dataSparkBounds(values) {
        var lo = Infinity;
        var hi = -Infinity;
        var i;
        for (i = 0; i < values.length; i += 1) {
            var v = Number(values[i]);
            if (!isFinite(v)) {
                continue;
            }
            if (v < lo) {
                lo = v;
            }
            if (v > hi) {
                hi = v;
            }
        }
        if (!isFinite(lo) || !isFinite(hi)) {
            return { min: 0, max: 100 };
        }
        if (lo === hi) {
            hi = lo + 1;
        }
        return { min: lo, max: hi };
    }

    /**
     * Resolve spark Y scale. Auto when sparkAuto is on, or when min/max are blank
     * (formatter labels say "blank if auto" — blank + Auto Off previously forced 0–100
     * and flattened any series outside that range into a straight line).
     */
    function sparkBounds(minIn, maxIn, values, sparkAuto) {
        var lo2 = parseFloat(minIn, 10);
        var hi2 = parseFloat(maxIn, 10);
        var hasManual = isFinite(lo2) || isFinite(hi2);
        if (truthy(sparkAuto) || !hasManual) {
            return dataSparkBounds(values);
        }
        if (!isFinite(lo2)) {
            lo2 = 0;
        }
        if (!isFinite(hi2)) {
            hi2 = 100;
        }
        if (lo2 > hi2) {
            var t = lo2;
            lo2 = hi2;
            hi2 = t;
        }
        if (hi2 <= lo2) {
            hi2 = lo2 + 1;
        }
        return { min: lo2, max: hi2 };
    }

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

    function trendBackground(delta, upColor, downColor, invertTrend) {
        var downIsGood = truthy(invertTrend);
        if (!isFinite(delta)) {
            return upColor;
        }
        if (delta < 0) {
            return downIsGood ? upColor : downColor;
        }
        return downIsGood ? downColor : upColor;
    }

    function applyTrendHostStyle(el, bg, textColor) {
        if (!el) {
            return;
        }
        el.style.position = 'relative';
        el.style.backgroundColor = bg;
        el.style.setProperty('background', bg, 'important');
        el.style.color = textColor;
        el.style.overflow = 'hidden';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.minHeight = '100%';
        el.style.boxSizing = 'border-box';
        el.style.pointerEvents = 'auto';
    }

    function resolveSubheaderStyle(config, viz) {
        var styleFound = findConfigValue(config, 'subheaderStyle', viz);
        if (styleFound.found && String(styleFound.value).trim()) {
            return String(styleFound.value).trim().toLowerCase();
        }
        return truthy(optOrFromConfig(config, viz, 'subheaderMatchTile', 'true')) ? 'matchtile' : 'overlay';
    }

    function optOrFromConfig(config, viz, prop, builtInDefault) {
        var found = findConfigValue(config, prop, viz);
        if (!found.found) {
            return builtInDefault;
        }
        var raw = found.value;
        if (typeof raw === 'string' && raw.trim() === '') {
            return builtInDefault;
        }
        return raw;
    }

    function applySubheaderStyle(head, subheaderStyle, bg, goodColor, textColor) {
        if (!head) {
            return;
        }
        var style = String(subheaderStyle || 'matchtile').toLowerCase();
        var bgColor = 'rgba(0,0,0,0.52)';
        if (style === 'matchtile') {
            bgColor = bg;
            head.className += ' bgdhamp-sparkline-value-viz__header--matchTile';
        } else if (style === 'darkblue') {
            bgColor = goodColor;
            head.className += ' bgdhamp-sparkline-value-viz__header--darkBlue';
        } else {
            head.className += ' bgdhamp-sparkline-value-viz__header--overlay';
        }
        head.style.setProperty('background', bgColor, 'important');
        head.style.setProperty('color', textColor, 'important');
        head.style.flex = '0 0 ' + SUBHEADER_HEIGHT_PX + 'px';
        head.style.height = SUBHEADER_HEIGHT_PX + 'px';
        head.style.minHeight = SUBHEADER_HEIGHT_PX + 'px';
        head.style.maxHeight = SUBHEADER_HEIGHT_PX + 'px';
        head.style.boxSizing = 'border-box';
        head.style.display = 'flex';
        head.style.alignItems = 'center';
        head.style.overflow = 'hidden';
    }

    function measureSparkWrap(sparkWrap) {
        var rect = sparkWrap.getBoundingClientRect();
        return {
            w: Math.max(1, Math.round(rect.width) || sparkWrap.clientWidth || 360),
            h: Math.max(1, Math.round(rect.height) || sparkWrap.clientHeight || SPARK_STRIP_HEIGHT_PX),
        };
    }

    function sizeSparkSvg(svg, w, h) {
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('width', String(w));
        svg.setAttribute('height', String(h));
        svg.style.width = w + 'px';
        svg.style.height = h + 'px';
        svg.style.overflow = 'visible';
        svg.style.display = 'block';
    }

    function normalizeName(name) {
        return String(name == null ? '' : name)
            .trim()
            .toLowerCase();
    }

    function findFieldIndex(fields, requested) {
        var wanted = normalizeName(requested);
        var i;
        if (!wanted) {
            return -1;
        }
        for (i = 0; i < fields.length; i += 1) {
            if (normalizeName(fieldName(fields, i)) === wanted) {
                return i;
            }
        }
        return -1;
    }

    function columnHasNumber(rawData, columnIndex) {
        var col = (rawData && rawData.columns && rawData.columns[columnIndex]) || [];
        var r;
        for (r = 0; r < col.length; r += 1) {
            if (isFinite(parseNum(col[r]))) {
                return true;
            }
        }
        return false;
    }

    function isSkippedValueField(name) {
        var n = normalizeName(name);
        return !n || !!SKIP_VALUE_FIELDS[n] || n.charAt(0) === '_';
    }

    function pickNumericColumnIndex(rawData) {
        var fields = fieldsList(rawData);
        if (!rawData || !rawData.columns || !fields.length) {
            return -1;
        }
        var h;
        var c;
        var best = -1;
        for (h = 0; h < VALUE_FIELD_HINTS.length; h += 1) {
            var hinted = findFieldIndex(fields, VALUE_FIELD_HINTS[h]);
            if (
                hinted >= 0 &&
                !isSkippedValueField(fieldName(fields, hinted)) &&
                columnHasNumber(rawData, hinted)
            ) {
                return hinted;
            }
        }
        for (c = 0; c < rawData.columns.length; c += 1) {
            if (isSkippedValueField(fieldName(fields, c))) {
                continue;
            }
            if (columnHasNumber(rawData, c)) {
                best = c;
            }
        }
        return best;
    }

    function resolveValueColumnIndex(rawData, valueField) {
        var fields = fieldsList(rawData);
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

    /**
     * Build KPI series from column-major results.
     * Soft-fails (empty values) when no usable metric — Single Value–compatible.
     */
    function buildSeriesFromRaw(rawData, valueField) {
        if (!rawData || !rawData.columns || rawData.columns.length === 0) {
            return { values: [], times: [], fieldName: '', stringFields: {} };
        }
        var fields = fieldsList(rawData);
        var idx = resolveValueColumnIndex(rawData, valueField);
        if (idx < 0) {
            return { values: [], times: [], fieldName: '', stringFields: {} };
        }
        var series = reorderSeriesByTime(rawData, idx);
        return {
            values: series.values || [],
            times: series.times || [],
            fieldName: fieldName(fields, idx),
            stringFields: reorderAllStringFieldsByTime(rawData, idx),
        };
    }

    function getTimeSortedValuePairs(rawData, valueIdx) {
        var col = rawData.columns[valueIdx] || [];
        if (!col.length) {
            return [];
        }
        var n = col.length;
        var tIdx = findTimeColumnIndex(rawData);
        var pairs = [];
        var r;
        if (tIdx < 0 || !rawData.columns[tIdx] || rawData.columns[tIdx].length !== n) {
            for (r = 0; r < n; r += 1) {
                var v0 = parseNum(col[r]);
                if (isFinite(v0)) {
                    pairs.push({ v: v0, timeRaw: null, rowIdx: r });
                }
            }
            return pairs;
        }
        var timeCol = rawData.columns[tIdx];
        for (r = 0; r < n; r += 1) {
            var v = parseNum(col[r]);
            if (!isFinite(v)) {
                continue;
            }
            pairs.push({
                t: timeSortKey(rawData, tIdx, r),
                v: v,
                timeRaw: cellValue(timeCol[r]),
                rowIdx: r,
            });
        }
        pairs.sort(function (a, b) {
            if (a.t !== b.t) {
                return a.t - b.t;
            }
            return a.rowIdx - b.rowIdx;
        });
        return pairs;
    }

    function reorderSeriesByTime(rawData, valueIdx) {
        var pairs = getTimeSortedValuePairs(rawData, valueIdx);
        var values = [];
        var times = [];
        var r;
        for (r = 0; r < pairs.length; r += 1) {
            values.push(pairs[r].v);
            times.push(pairs[r].timeRaw);
        }
        return { values: values, times: times };
    }

    function pickColumnIndexByName(rawData, name) {
        var fields = fieldsList(rawData);
        var i;
        for (i = 0; i < fields.length; i += 1) {
            if (fieldName(fields, i) === name) {
                return i;
            }
        }
        return -1;
    }

    function reorderStringColumnByTime(rawData, strIdx, valueIdx) {
        var pairs = getTimeSortedValuePairs(rawData, valueIdx);
        var strCol = rawData.columns[strIdx] || [];
        var out = [];
        var r;
        for (r = 0; r < pairs.length; r += 1) {
            var cell = strCol[pairs[r].rowIdx];
            var raw = cellValue(cell);
            out.push(raw == null ? '' : String(raw).trim());
        }
        return out;
    }

    function reorderAllStringFieldsByTime(rawData, valueIdx) {
        var fields = fieldsList(rawData);
        var out = {};
        var c;
        if (!rawData || !rawData.columns) {
            return out;
        }
        for (c = 0; c < rawData.columns.length; c += 1) {
            var fn = fieldName(fields, c);
            if (!fn || fn === '_time' || c === valueIdx) {
                continue;
            }
            out[fn] = reorderStringColumnByTime(rawData, c, valueIdx);
        }
        return out;
    }

    function drawSparkLabelAtIndex(
        svg,
        values,
        pi,
        labelText,
        w,
        h,
        padL,
        padR,
        padT,
        padB,
        vmin,
        vmax,
        sparkStroke
    ) {
        var xy = sparkXY(values, pi, w, h, padL, padR, padT, padB, vmin, vmax);
        var mark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mark.setAttribute('cx', xy.x.toFixed(1));
        mark.setAttribute('cy', xy.y.toFixed(1));
        mark.setAttribute('r', '3');
        mark.setAttribute('fill', sparkStroke);
        svg.appendChild(mark);
        var lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', xy.x.toFixed(1));
        lbl.setAttribute('y', String(Math.max(10, xy.y - 7)));
        lbl.setAttribute('fill', 'rgba(255,255,255,0.9)');
        lbl.setAttribute('font-size', '9');
        lbl.setAttribute('font-weight', '700');
        if (xy.x <= padL + 2) {
            lbl.setAttribute('text-anchor', 'start');
            lbl.setAttribute('dx', '2');
        } else if (xy.x >= w - padR - 2) {
            lbl.setAttribute('text-anchor', 'end');
            lbl.setAttribute('dx', '-2');
        } else {
            lbl.setAttribute('text-anchor', 'middle');
        }
        lbl.textContent = labelText;
        svg.appendChild(lbl);
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
                if (t > 31536000000) {
                    ms.push(t);
                } else if (t > 31536000) {
                    ms.push(t * 1000);
                } else {
                    ms.push(null);
                }
                if (ms[i] != null) {
                    ok += 1;
                }
                continue;
            }
            ms.push(null);
        }
        return { ms: ms, timeLike: ok >= Math.max(2, Math.floor(len * 0.5)) };
    }

    function formatHoverTime(times, norm, idx) {
        if (norm.timeLike && norm.ms[idx] != null) {
            return new Date(norm.ms[idx]).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        if (times[idx] == null) {
            return '';
        }
        return String(times[idx]);
    }

    function parseSparkPointLabels(raw) {
        var map = {};
        var s = String(raw == null ? '' : raw).trim();
        if (!s) {
            return map;
        }
        var parts = s.split(/[,;]+/);
        var i;
        for (i = 0; i < parts.length; i += 1) {
            var p = parts[i].trim();
            if (!p) {
                continue;
            }
            var colon = p.indexOf(':');
            if (colon < 0) {
                continue;
            }
            var idx = parseInt(p.slice(0, colon), 10);
            var label = p.slice(colon + 1).trim();
            if (isFinite(idx) && idx >= 0 && label) {
                map[idx] = label;
            }
        }
        return map;
    }

    function sparkPath(values, w, h, padL, padR, padT, padB, vmin, vmax) {
        var iw = Math.max(1, w - padL - padR);
        var ih = Math.max(1, h - padT - padB);
        var len = values.length;
        if (len < 2) {
            return '';
        }
        var xStep = iw / (len - 1);
        var parts = [];
        var i;
        for (i = 0; i < len; i += 1) {
            var val = Number(values[i]);
            var ratio = (val - vmin) / (vmax - vmin);
            ratio = Math.max(0, Math.min(1, ratio));
            var x = padL + i * xStep;
            var y = padT + ih - ratio * ih;
            parts.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
        }
        return parts.join(' ');
    }

    function sparkAreaPath(values, w, h, padL, padR, padT, padB, vmin, vmax) {
        var line = sparkPath(values, w, h, padL, padR, padT, padB, vmin, vmax);
        if (!line) {
            return '';
        }
        var len = values.length;
        var iw = Math.max(1, w - padL - padR);
        var xStep = iw / (len - 1);
        var lastX = padL + (len - 1) * xStep;
        var baselineY = h - padB;
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

    /** Single Value–style area: flat wash of area color (default spark stroke white) at 20%. */
    function resolveAreaFill(areaColor) {
        return { color: areaColor || '#FFFFFF', opacity: '0.2' };
    }

    function applyVizHeight(el, heightPx) {
        if (!el || !isFinite(heightPx)) {
            return;
        }
        var h = Math.max(80, Math.min(800, Math.round(heightPx)));
        var px = h + 'px';
        var node = el;
        var hops = 0;
        while (node && hops < 14) {
            node.style.height = px;
            node.style.minHeight = px;
            var cls = String(node.className || '');
            if (cls.indexOf('dashboard-element') !== -1) {
                break;
            }
            node = node.parentElement;
            hops += 1;
        }
    }

    function appendSparkAreaFill(svg, areaD, fillColor, fillOpacity) {
        if (!areaD) {
            return;
        }
        var area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        area.setAttribute('class', 'bgdhamp-sparkline-value-viz__sparkArea');
        area.setAttribute('d', areaD);
        area.setAttribute('fill', fillColor);
        area.setAttribute('fill-opacity', String(fillOpacity));
        area.setAttribute('stroke', 'none');
        area.style.fill = fillColor;
        area.style.fillOpacity = String(fillOpacity);
        svg.appendChild(area);
    }

    function sparkXY(values, idx, w, h, padL, padR, padT, padB, vmin, vmax) {
        var len = values.length;
        var iw = Math.max(1, w - padL - padR);
        var ih = Math.max(1, h - padT - padB);
        var xStep = len > 1 ? iw / (len - 1) : 0;
        var val = Number(values[idx]);
        var ratio = (val - vmin) / (vmax - vmin);
        ratio = Math.max(0, Math.min(1, ratio));
        return {
            x: padL + idx * xStep,
            y: padT + ih - ratio * ih,
            xStep: xStep,
        };
    }

    function sparkIndexFromPointer(clientX, sparkWrap, padL, padR, w, n) {
        var rect = sparkWrap.getBoundingClientRect();
        if (rect.width <= 0 || n < 2) {
            return null;
        }
        var relX = (clientX - rect.left) / rect.width;
        var xSvg = relX * w;
        var iw = w - padL - padR;
        var idx = Math.round((xSvg - padL) / (iw / (n - 1)));
        return clamp(idx, 0, n - 1);
    }

    function yFromValue(val, h, padT, padB, vmin, vmax) {
        var ih = Math.max(1, h - padT - padB);
        var ratio = (val - vmin) / (vmax - vmin);
        ratio = Math.max(0, Math.min(1, ratio));
        return padT + ih - ratio * ih;
    }

    function formatMajor(value, precision, unit) {
        if (!isFinite(value)) {
            return '—';
        }
        var p = parseInt(precision, 10);
        if (!isFinite(p) || p < 0) {
            p = 2;
        }
        return value.toLocaleString(undefined, { maximumFractionDigits: p, minimumFractionDigits: 0 }) + unit;
    }

    function formatDelta(delta, last, mode, precision) {
        if (!isFinite(delta)) {
            return '—';
        }
        var p = parseInt(precision, 10);
        if (!isFinite(p) || p < 0) {
            p = 2;
        }
        var arrow = delta >= 0 ? '\u25b2 ' : '\u25bc ';
        if (String(mode).toLowerCase() === 'percent' && isFinite(last) && last !== 0) {
            var pct = (delta / Math.abs(last)) * 100;
            return arrow + pct.toLocaleString(undefined, { maximumFractionDigits: p }) + '%';
        }
        return arrow + delta.toLocaleString(undefined, { maximumFractionDigits: p });
    }

    function formatHoverValue(v, precision, prefix) {
        if (!isFinite(v)) {
            return '—';
        }
        var p = parseInt(precision, 10);
        if (!isFinite(p) || p < 0) {
            p = 2;
        }
        var core = v.toLocaleString(undefined, { maximumFractionDigits: p, minimumFractionDigits: 0 });
        var pre = String(prefix || '').trim();
        if (pre.toLowerCase() === 'value') {
            pre = '';
        }
        return pre ? pre + ' ' + core : core;
    }

    function clearSparkHover(sparkWrap, tooltip, hoverAnnEl) {
        if (sparkWrap) {
            var old = sparkWrap.querySelector('.bgdhamp-sparkline-value-viz__hoverOverlay');
            if (old && old.parentNode) {
                old.parentNode.removeChild(old);
            }
        }
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        if (hoverAnnEl) {
            hoverAnnEl.style.display = 'none';
            hoverAnnEl.textContent = '';
        }
    }

    function updateSparkHover(sparkWrap, tooltip, ownerDoc, opts) {
        clearSparkHover(sparkWrap, tooltip, opts.hoverAnnEl);
        var rect = sparkWrap.getBoundingClientRect();
        var drawW = Math.max(1, rect.width);
        var drawH = Math.max(1, rect.height);
        var px = (opts.hx / opts.w) * drawW;
        var py = (opts.hy / opts.h) * drawH;
        var topPx = (opts.padT / opts.h) * drawH;
        var bottomPx = drawH - (opts.padB / opts.h) * drawH;

        var overlay = ownerDoc.createElement('div');
        overlay.className = 'bgdhamp-sparkline-value-viz__hoverOverlay';
        overlay.setAttribute('aria-hidden', 'true');

        var line = ownerDoc.createElement('div');
        line.className = 'bgdhamp-sparkline-value-viz__hoverLine';
        line.style.left = px.toFixed(1) + 'px';
        line.style.top = topPx.toFixed(1) + 'px';
        line.style.height = Math.max(0, bottomPx - topPx).toFixed(1) + 'px';
        overlay.appendChild(line);

        var dot = ownerDoc.createElement('div');
        dot.className = 'bgdhamp-sparkline-value-viz__hoverDot';
        dot.style.left = (px - 4).toFixed(1) + 'px';
        dot.style.top = (py - 4).toFixed(1) + 'px';
        dot.style.background = opts.stroke;
        overlay.appendChild(dot);

        sparkWrap.appendChild(overlay);

        var valueLabel = formatHoverValue(opts.v, opts.precision, opts.tooltipPrefix);
        var timeLabel = opts.timeLabel || '';
        var annotationLabel = opts.annotationLabel || '';
        var pointLabel = opts.pointLabel || '';
        var lines = [];
        if (annotationLabel) {
            lines.push(annotationLabel);
        }
        if (pointLabel && pointLabel !== annotationLabel) {
            lines.push(pointLabel);
        }
        lines.push(valueLabel);
        if (timeLabel) {
            lines.push(timeLabel);
        }

        tooltip.textContent = '';
        var valueLineIdx = lines.indexOf(valueLabel);
        var i;
        for (i = 0; i < lines.length; i += 1) {
            var row = ownerDoc.createElement('div');
            row.className =
                i < valueLineIdx
                    ? 'bgdhamp-sparkline-value-viz__tooltipPoint'
                    : i === valueLineIdx
                      ? 'bgdhamp-sparkline-value-viz__tooltipValue'
                      : 'bgdhamp-sparkline-value-viz__tooltipTime';
            row.textContent = lines[i];
            tooltip.appendChild(row);
        }

        tooltip.style.display = 'block';
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '2147483646';
        tooltip.style.left = opts.clientX + 'px';
        tooltip.style.top = opts.clientY + 'px';
        tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
        var bodyEl = ownerDoc.body || ownerDoc.documentElement;
        if (bodyEl && tooltip.parentNode !== bodyEl) {
            bodyEl.appendChild(tooltip);
        }

        if (opts.showHoverAnnotation && opts.hoverAnnEl) {
            opts.hoverAnnEl.textContent = lines.join(' \u2014 ');
            opts.hoverAnnEl.style.display = 'block';
        }
    }

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 5000,
            };
        },

        formatData: function (rawData) {
            var safe = rawData && rawData.columns ? rawData : { columns: [], fields: [] };
            var series = buildSeriesFromRaw(safe, 'auto');
            return {
                rawData: safe,
                values: series.values,
                times: series.times,
                fieldName: series.fieldName,
                stringFields: series.stringFields,
            };
        },

        updateView: function (data, config) {
            var viz = this;
            function opt(prop, defaultVal) {
                return readConfig(config, prop, defaultVal, viz);
            }
            /** When Splunk has no key yet (cached panel), use formatter demo defaults. */
            function optOr(prop, builtInDefault) {
                var found = findConfigValue(config, prop, viz);
                if (!found.found) {
                    return builtInDefault;
                }
                var raw = found.value;
                if (typeof raw === 'string' && raw.trim() === '') {
                    return builtInDefault;
                }
                return raw;
            }
            /** Label/badge: missing key → demo default; explicit blank → hide (empty string). */
            function optLabel(prop, builtInDefault) {
                var found = findConfigValue(config, prop, viz);
                if (!found.found) {
                    return builtInDefault;
                }
                var raw = found.value;
                if (typeof raw === 'string') {
                    return raw.trim();
                }
                return String(raw).trim();
            }

            if (typeof this._docHoverCleanup === 'function') {
                this._docHoverCleanup();
                this._docHoverCleanup = null;
            }
            if (this._hoverTooltipEl && this._hoverTooltipEl.parentNode) {
                this._hoverTooltipEl.parentNode.removeChild(this._hoverTooltipEl);
                this._hoverTooltipEl = null;
            }

            this.el.innerHTML = '';
            var valueField = String(opt('valueField', 'auto') || 'auto').trim() || 'auto';
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
            var emptyText = String(opt('emptyText', 'No numeric results to display.') || '');

            if (values.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'bgdhamp-sparkline-value-viz__err';
                empty.textContent = emptyText;
                this.el.appendChild(empty);
                return;
            }

            var sparkAuto = opt('sparkAuto', 'true');
            var sparkMinRaw = opt('sparkMin', '');
            var sparkMaxRaw = opt('sparkMax', '');
            var scale = sparkBounds(sparkMinRaw, sparkMaxRaw, values, sparkAuto);
            var goodColor = sanitizeHexColor(opt('goodColor', '#01417F'), '#01417F');
            var badColor = sanitizeHexColor(opt('badColor', '#DFA611'), '#DFA611');
            var invertTrend = opt('invertTrend', 'false');
            var textColor = sanitizeHexColor(opt('textColor', '#FFFFFF'), '#FFFFFF');
            var sparkStroke = sanitizeHexColor(opt('sparkStroke', '#FFFFFF'), '#FFFFFF');
            var sparkStrokeWidth = parseFloat(opt('sparkStrokeWidth', '2'), 10);
            if (!isFinite(sparkStrokeWidth) || sparkStrokeWidth <= 0) {
                sparkStrokeWidth = 2;
            }
            var sparkAreaColor = sanitizeHexColor(optOr('sparkAreaColor', sparkStroke), sparkStroke);
            var sparkHeightPx = parseFloat(optOr('sparkHeight', String(SPARK_STRIP_HEIGHT_PX)), 10);
            if (!isFinite(sparkHeightPx) || sparkHeightPx <= 0) {
                sparkHeightPx = SPARK_STRIP_HEIGHT_PX;
            }
            sparkHeightPx = Math.max(12, Math.min(240, sparkHeightPx));
            var vizHeightPx = parseFloat(optOr('vizHeight', String(PANEL_DEFAULT_HEIGHT_PX)), 10);
            if (!isFinite(vizHeightPx) || vizHeightPx <= 0) {
                vizHeightPx = PANEL_DEFAULT_HEIGHT_PX;
            }
            vizHeightPx = Math.max(80, Math.min(800, vizHeightPx));
            var unit = String(opt('unit', '') || '');
            var subheader = String(opt('subheader', '') || '');
            var precision = opt('precision', '2');
            var showDelta = truthy(opt('showDelta', 'true')) && values.length >= 2;
            var deltaMode = String(opt('deltaMode', 'absolute') || 'absolute');
            var showSparkline = truthy(opt('showSparkline', 'true')) && values.length >= 2;
            var showSparkArea = truthy(optOr('showSparkArea', 'true'));
            var showTarget = truthy(opt('showTarget', 'false'));
            var target = parseFloat(opt('target', '50'), 10);
            var showThresholdBand = truthy(opt('showThresholdBand', 'false'));
            var thresholdMin = parseFloat(opt('thresholdMin', '20'), 10);
            var thresholdMax = parseFloat(opt('thresholdMax', '80'), 10);
            var showHover = truthy(opt('showHover', 'true'));
            var showHoverAnnotation = truthy(optOr('showHoverAnnotation', 'true'));
            var tooltipPrefix = String(optOr('tooltipPrefix', '') || '');
            var majorLabel = optLabel('majorLabel', DEMO_LABELS.majorLabel);
            var deltaLabel = optLabel('deltaLabel', DEMO_LABELS.deltaLabel);
            var badgeText = optLabel('badgeText', DEMO_LABELS.badgeText);
            var sparkPointLabels = parseSparkPointLabels(
                optLabel('sparkPointLabels', DEMO_LABELS.sparkPointLabels)
            );
            var showPointLabels = truthy(optOr('showPointLabels', 'false'));
            var headlineLayout = String(opt('headlineLayout', 'stacked') || 'stacked').toLowerCase();
            var majorFontSizePx = parseFloat(opt('majorFontSize', '26'), 10);
            if (!isFinite(majorFontSizePx) || majorFontSizePx <= 0) {
                majorFontSizePx = 26;
            }
            majorFontSizePx = Math.max(10, Math.min(96, majorFontSizePx));
            var labelPosition = String(opt('labelPosition', 'above') || 'above').toLowerCase();
            var sparkEdgeToEdge = truthy(opt('sparkEdgeToEdge', 'false'));
            var subheaderStyle = resolveSubheaderStyle(config, viz);
            var annotationField = String(opt('annotationField', 'annotation') || '').trim();
            var showAnnotationHover = truthy(optOr('showAnnotationHover', 'true'));
            var showAnnotationLabels = truthy(optOr('showAnnotationLabels', 'false'));
            var annotations = [];
            if (annotationField && series.stringFields && series.stringFields[annotationField]) {
                annotations = series.stringFields[annotationField];
            }
            while (annotations.length < values.length) {
                annotations.push('');
            }

            var delta = trendDelta(values);
            var last = values[values.length - 1];
            var bg = trendBackground(delta, goodColor, badColor, invertTrend);
            applyTrendHostStyle(this.el, bg, textColor);
            applyVizHeight(this.el, vizHeightPx);
            var areaFill = resolveAreaFill(sparkAreaColor);

            var ownerDoc = (this.el && this.el.ownerDocument) || document;
            var norm = normalizeTimes(times, values.length);

            var root = document.createElement('div');
            root.className = 'bgdhamp-sparkline-value-viz';
            root.setAttribute('data-bgdhamp-viz-build', VIZ_BUILD);
            root.setAttribute('data-bgdhamp-spark-area', showSparkArea ? 'on' : 'off');
            root.setAttribute('data-bgdhamp-frame-subheader', String(SUBHEADER_HEIGHT_PX));
            root.setAttribute('data-ss-frame-body', String(BODY_FRAME_HEIGHT_PX));
            root.setAttribute('data-ss-frame-panel', String(PANEL_DEFAULT_HEIGHT_PX));
            root.style.position = 'relative';
            root.style.backgroundColor = bg;
            root.style.color = textColor;
            root.style.width = '100%';
            root.style.height = '100%';
            root.style.minHeight = '0';
            root.style.boxSizing = 'border-box';
            root.style.display = 'flex';
            root.style.flexDirection = 'column';

            if (badgeText) {
                var badge = document.createElement('div');
                badge.className = 'bgdhamp-sparkline-value-viz__badge';
                badge.textContent = badgeText;
                badge.setAttribute('title', badgeText);
                inlineBadgeStyle(badge);
                root.appendChild(badge);
            }

            if (subheader) {
                var head = document.createElement('div');
                head.className = 'bgdhamp-sparkline-value-viz__header';
                applySubheaderStyle(head, subheaderStyle, bg, goodColor, textColor);
                head.textContent = subheader;
                root.appendChild(head);
            }

            var body = document.createElement('div');
            body.className = 'bgdhamp-sparkline-value-viz__body';
            body.style.flex = '1 1 auto';
            body.style.position = 'relative';
            body.style.display = 'flex';
            body.style.flexDirection = 'column';
            body.style.alignItems = 'center';
            body.style.justifyContent = 'center';
            // Reserve bottom strip for spark so KPI + delta fit in the 137px body frame.
            body.style.padding = showSparkline
                ? '6px 10px ' + (sparkHeightPx + 6) + 'px'
                : '6px 10px 8px';
            body.style.boxSizing = 'border-box';
            body.style.minHeight = '0';
            body.style.overflow = 'hidden';

            var headlineRow = document.createElement('div');
            headlineRow.className =
                'bgdhamp-sparkline-value-viz__headlineRow bgdhamp-sparkline-value-viz__headlineRow--' +
                (headlineLayout === 'inline' ? 'inline' : 'stacked');

            var major = document.createElement('div');
            major.className = 'bgdhamp-sparkline-value-viz__major';
            var majorVal = document.createElement('div');
            majorVal.className = 'bgdhamp-sparkline-value-viz__majorValue';
            majorVal.textContent = formatMajor(last, precision, unit);
            majorVal.style.fontSize = majorFontSizePx + 'px';
            majorVal.style.fontWeight = '600';
            majorVal.style.lineHeight = '1.05';
            majorVal.style.color = textColor;
            appendIndicatorPair(major, majorVal, majorLabel, textColor, labelPosition);
            headlineRow.appendChild(major);

            if (showDelta) {
                var trend = document.createElement('div');
                trend.className = 'bgdhamp-sparkline-value-viz__trend';
                var deltaVal = document.createElement('div');
                deltaVal.className = 'bgdhamp-sparkline-value-viz__trendValue';
                deltaVal.textContent = formatDelta(delta, last, deltaMode, precision);
                deltaVal.style.fontSize = '13px';
                deltaVal.style.fontWeight = '600';
                deltaVal.style.color = textColor;
                appendIndicatorPair(trend, deltaVal, deltaLabel, textColor, labelPosition);
                headlineRow.appendChild(trend);
            }

            body.appendChild(headlineRow);

            var hoverAnnEl = null;
            if (showHoverAnnotation) {
                hoverAnnEl = ownerDoc.createElement('div');
                hoverAnnEl.className = 'bgdhamp-sparkline-value-viz__hoverAnn';
                hoverAnnEl.setAttribute('aria-hidden', 'true');
                hoverAnnEl.style.bottom = showSparkline ? sparkHeightPx + 16 + 'px' : '8px';
                body.appendChild(hoverAnnEl);
            }

            var padL = sparkEdgeToEdge ? 0 : 28;
            var padR = sparkEdgeToEdge ? 0 : 28;
            var padT = 8;
            var padB = 4;
            var w = 360;
            var h = sparkHeightPx;
            var n = values.length;
            var sparkWrap = null;

            if (showSparkline) {
                sparkWrap = document.createElement('div');
                sparkWrap.className = 'bgdhamp-sparkline-value-viz__spark';
                if (sparkEdgeToEdge) {
                    sparkWrap.className += ' bgdhamp-sparkline-value-viz__spark--edgeToEdge';
                }
                sparkWrap.style.position = 'absolute';
                sparkWrap.style.left = sparkEdgeToEdge ? '0' : '8px';
                sparkWrap.style.right = sparkEdgeToEdge ? '0' : '8px';
                sparkWrap.style.bottom = '4px';
                sparkWrap.style.height = sparkHeightPx + 'px';
                sparkWrap.style.overflow = 'visible';
                body.appendChild(sparkWrap);
            }

            root.appendChild(body);
            this.el.appendChild(root);
            this._lastData = {
                rawData: rawData,
                values: values,
                times: times,
                fieldName: series.fieldName,
                stringFields: series.stringFields,
            };
            this._lastConfig = config;

            if (showSparkline && sparkWrap) {
                var paintSpark = function (deferred) {
                    sparkWrap.innerHTML = '';
                    var measured = measureSparkWrap(sparkWrap);
                    if (measured.w < 2 && !deferred) {
                        var rafWin = ownerDoc.defaultView || window;
                        if (rafWin && typeof rafWin.requestAnimationFrame === 'function') {
                            rafWin.requestAnimationFrame(function () {
                                paintSpark(true);
                            });
                        }
                        return;
                    }
                    w = measured.w;
                    h = measured.h;
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    sizeSparkSvg(svg, w, h);

                if (showThresholdBand && isFinite(thresholdMin) && isFinite(thresholdMax)) {
                    var y1 = yFromValue(thresholdMax, h, padT, padB, scale.min, scale.max);
                    var y2 = yFromValue(thresholdMin, h, padT, padB, scale.min, scale.max);
                    var band = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    band.setAttribute('x', String(padL));
                    band.setAttribute('y', String(Math.min(y1, y2)));
                    band.setAttribute('width', String(w - padL - padR));
                    band.setAttribute('height', String(Math.abs(y2 - y1)));
                    band.setAttribute('fill', 'rgba(0,0,0,0.18)');
                    svg.appendChild(band);
                }

                if (showTarget && isFinite(target)) {
                    var ty = yFromValue(target, h, padT, padB, scale.min, scale.max);
                    var tLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    tLine.setAttribute('x1', String(padL));
                    tLine.setAttribute('x2', String(w - padR));
                    tLine.setAttribute('y1', String(ty));
                    tLine.setAttribute('y2', String(ty));
                    tLine.setAttribute('stroke', 'rgba(255,255,255,0.55)');
                    tLine.setAttribute('stroke-width', '1');
                    tLine.setAttribute('stroke-dasharray', '4 3');
                    svg.appendChild(tLine);
                }

                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                var d = sparkPath(values, w, h, padL, padR, padT, padB, scale.min, scale.max);
                if (d && showSparkArea) {
                    appendSparkAreaFill(
                        svg,
                        sparkAreaPath(values, w, h, padL, padR, padT, padB, scale.min, scale.max),
                        areaFill.color,
                        areaFill.opacity
                    );
                }
                if (d) {
                    path.setAttribute('d', d);
                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke', sparkStroke);
                    path.setAttribute('stroke-width', String(sparkStrokeWidth));
                    path.setAttribute('vector-effect', 'non-scaling-stroke');
                    svg.appendChild(path);
                }

                if (n >= 1) {
                    var effectivePointLabels = {};
                    var pi;
                    if (showPointLabels) {
                        for (pi = 0; pi < n; pi += 1) {
                            if (Object.prototype.hasOwnProperty.call(sparkPointLabels, pi)) {
                                effectivePointLabels[pi] = sparkPointLabels[pi];
                            }
                        }
                    }
                    if (showAnnotationLabels && annotations.length) {
                        for (pi = 0; pi < annotations.length; pi += 1) {
                            if (annotations[pi]) {
                                effectivePointLabels[pi] = annotations[pi];
                            }
                        }
                    }
                    for (pi = 0; pi < n; pi += 1) {
                        if (!Object.prototype.hasOwnProperty.call(effectivePointLabels, pi)) {
                            continue;
                        }
                        drawSparkLabelAtIndex(
                            svg,
                            values,
                            pi,
                            effectivePointLabels[pi],
                            w,
                            h,
                            padL,
                            padR,
                            padT,
                            padB,
                            scale.min,
                            scale.max,
                            sparkStroke
                        );
                    }
                }

                sparkWrap.appendChild(svg);

                var tooltip = ownerDoc.createElement('div');
                tooltip.className = 'bgdhamp-sparkline-value-viz__tooltip';
                tooltip.setAttribute('role', 'status');
                tooltip.style.display = 'none';
                viz._hoverTooltipEl = tooltip;

                if (showHover && n >= 2) {
                    function hitTestSpark(px, py) {
                        var rect = sparkWrap.getBoundingClientRect();
                        return (
                            rect.width > 0 &&
                            rect.height > 0 &&
                            px >= rect.left &&
                            px <= rect.right &&
                            py >= rect.top &&
                            py <= rect.bottom
                        );
                    }

                    var teardown = [];
                    function onDocPointerMove(e) {
                        if (!hitTestSpark(e.clientX, e.clientY)) {
                            clearSparkHover(sparkWrap, tooltip, hoverAnnEl);
                            return;
                        }
                        var idx = sparkIndexFromPointer(e.clientX, sparkWrap, padL, padR, w, n);
                        if (idx == null) {
                            clearSparkHover(sparkWrap, tooltip, hoverAnnEl);
                            return;
                        }
                        var xy = sparkXY(values, idx, w, h, padL, padR, padT, padB, scale.min, scale.max);
                        var hoverAnnotation =
                            showAnnotationHover && annotations[idx] ? annotations[idx] : '';
                        updateSparkHover(sparkWrap, tooltip, ownerDoc, {
                            hx: xy.x,
                            hy: xy.y,
                            w: w,
                            h: h,
                            padT: padT,
                            padB: padB,
                            stroke: sparkStroke,
                            v: values[idx],
                            precision: precision,
                            unit: unit,
                            tooltipPrefix: tooltipPrefix,
                            timeLabel: formatHoverTime(times, norm, idx),
                            annotationLabel: hoverAnnotation,
                            pointLabel: sparkPointLabels[idx] || '',
                            clientX: e.clientX,
                            clientY: e.clientY,
                            showHoverAnnotation: showHoverAnnotation,
                            hoverAnnEl: hoverAnnEl,
                        });
                    }
                    teardown.push(function () {
                        ownerDoc.removeEventListener('pointermove', onDocPointerMove, true);
                        ownerDoc.removeEventListener('mousemove', onDocPointerMove, true);
                        if (ownerDoc.defaultView) {
                            ownerDoc.defaultView.removeEventListener('mousemove', onDocPointerMove, true);
                        }
                    });
                    ownerDoc.addEventListener('pointermove', onDocPointerMove, true);
                    ownerDoc.addEventListener('mousemove', onDocPointerMove, true);
                    if (ownerDoc.defaultView) {
                        ownerDoc.defaultView.addEventListener('mousemove', onDocPointerMove, true);
                    }
                    viz._docHoverCleanup = function () {
                        var ti;
                        for (ti = 0; ti < teardown.length; ti += 1) {
                            teardown[ti]();
                        }
                        clearSparkHover(sparkWrap, tooltip, hoverAnnEl);
                    };
                }
                };
                paintSpark(false);
            }
        },

        reflow: function () {
            if (this._lastData && this._lastConfig) {
                this.updateView(this._lastData, this._lastConfig);
            }
        },

        remove: function () {
            if (typeof this._docHoverCleanup === 'function') {
                this._docHoverCleanup();
                this._docHoverCleanup = null;
            }
            if (this._hoverTooltipEl && this._hoverTooltipEl.parentNode) {
                this._hoverTooltipEl.parentNode.removeChild(this._hoverTooltipEl);
                this._hoverTooltipEl = null;
            }
            this.el.innerHTML = '';
        },
    });
});
