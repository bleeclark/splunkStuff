/* eslint-disable */
/**
 * Splunk custom visualization: data-team pie / donut inspector.
 * Vanilla AMD for Splunk 9.x custom visualizations.
 */
define(['api/SplunkVisualizationBase'], function (SplunkVisualizationBase) {
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.splunkstuff_pie_chart.';

    var DEFAULT_PALETTE = [
        '#01417F',
        '#DFA611',
        '#5CC05C',
        '#F47A22',
        '#9B6BFF',
        '#00A9D4',
        '#E85B79',
        '#8B9BB4',
        '#2E8B57',
        '#C44E52',
        '#8172B2',
        '#64B5CD',
    ];

    var PALETTE_PRESETS = {
        splunk: DEFAULT_PALETTE,
        calm: ['#005F73', '#0A9396', '#94D2BD', '#E9D8A6', '#EE9B00', '#CA6702', '#BB3E03', '#AE2012'],
        bright: ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9', '#F0E442', '#7A5195'],
        accessible: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00', '#56B4E9', '#999999', '#000000'],
        risk: ['#2F80ED', '#27AE60', '#F2C94C', '#F2994A', '#EB5757', '#9B51E0', '#2D9CDB', '#6FCF97'],
    };

    var VALUE_FIELD_HINTS = ['value', 'count', 'sum', 'total', 'amount', 'pct', 'percent', 'avg', 'mean'];
    var LABEL_FIELD_HINTS = ['category', 'label', 'name', 'series', 'slice', 'status', 'host', 'field'];
    var COMPARE_FIELD_HINTS = ['previous', 'prior', 'baseline', 'compare', 'target', 'last', 'prev'];
    var COLOR_FIELD_HINTS = ['color', 'colour', 'hex', 'fill'];
    var SKIP_FIELD_NAMES = { _time: true, _span: true, _spandays: true, punct: true };

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

    function fieldName(fields, idx) {
        var f = fields && fields[idx];
        if (typeof f === 'string') {
            return f;
        }
        if (f && f.name != null) {
            return String(f.name);
        }
        return '';
    }

    function normalizeName(name) {
        return String(name == null ? '' : name)
            .trim()
            .toLowerCase();
    }

    function normalizeFieldName(fields, idx) {
        return normalizeName(fieldName(fields, idx));
    }

    function isSkippedFieldName(name) {
        return SKIP_FIELD_NAMES[name] === true || name.indexOf('_time') === 0;
    }

    function readConfig(config, prop, fallback) {
        var v = config && config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return fallback;
        }
        return v;
    }

    function readString(config, prop, fallback) {
        return String(readConfig(config, prop, fallback) || '').trim();
    }

    function readFieldChoice(config, prop, fallback) {
        var choice = readString(config, prop, fallback);
        var normalized = normalizeName(choice);
        return normalized === 'auto' || normalized === 'none' ? '' : choice;
    }

    function readBool(config, prop, fallback) {
        var raw = readConfig(config, prop, fallback ? 'true' : 'false');
        var s = String(raw == null ? '' : raw).trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 'yes' || s === 'on') {
            return true;
        }
        if (s === '0' || s === 'false' || s === 'no' || s === 'off') {
            return false;
        }
        return !!fallback;
    }

    function readNumber(config, prop, fallback, min, max) {
        var raw = readConfig(config, prop, fallback);
        var n = parseFloat(String(raw == null ? '' : raw).replace(/,/g, '').trim(), 10);
        if (!isFinite(n)) {
            n = fallback;
        }
        if (isFinite(min) && n < min) {
            n = min;
        }
        if (isFinite(max) && n > max) {
            n = max;
        }
        return n;
    }

    function safeColor(raw, fallback) {
        var s = String(raw == null ? '' : raw).trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(s)) {
            return s;
        }
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
        return fallback;
    }

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
        var s = String(raw).replace(/,/g, '').replace(/%$/, '').trim();
        var n = parseFloat(s, 10);
        return isFinite(n) ? n : NaN;
    }

    function isNumericColumn(rawData, colIdx) {
        var col = (rawData.columns && rawData.columns[colIdx]) || [];
        var r;
        for (r = 0; r < col.length; r += 1) {
            if (isFinite(parseNum(col[r]))) {
                return true;
            }
        }
        return false;
    }

    function fieldHintScore(name, hints) {
        var i;
        for (i = 0; i < hints.length; i += 1) {
            if (name === hints[i] || name.indexOf(hints[i]) >= 0) {
                return true;
            }
        }
        return false;
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

    function paletteForPreset(raw) {
        var key = normalizeName(raw || 'splunk');
        return (PALETTE_PRESETS[key] || DEFAULT_PALETTE).slice();
    }

    function parsePalette(raw, preset) {
        var source = String(raw || '').trim();
        var colors = [];
        var parts;
        var i;
        if (!source) {
            return paletteForPreset(preset);
        }
        parts = source.split(/[,\s]+/);
        for (i = 0; i < parts.length; i += 1) {
            var c = safeColor(parts[i], '');
            if (c) {
                colors.push(c);
            }
        }
        return colors.length ? colors : paletteForPreset(preset);
    }

    function parseColorMap(raw) {
        var source = String(raw || '').trim();
        var out = {};
        var parsed;
        var pairs;
        var i;
        if (!source) {
            return out;
        }
        if (source.charAt(0) === '{') {
            try {
                parsed = JSON.parse(source);
                Object.keys(parsed || {}).forEach(function (key) {
                    var color = safeColor(parsed[key], '');
                    if (color) {
                        out[String(key)] = color;
                    }
                });
                return out;
            } catch (ignore) {
                return out;
            }
        }
        pairs = source.split(/[,\n]+/);
        for (i = 0; i < pairs.length; i += 1) {
            var pair = pairs[i].split('=');
            if (pair.length >= 2) {
                var label = pair.shift().trim();
                var mappedColor = safeColor(pair.join('=').trim(), '');
                if (label && mappedColor) {
                    out[label] = mappedColor;
                }
            }
        }
        return out;
    }

    function readOptions(config) {
        var palettePreset = readString(config, 'palettePreset', 'splunk') || 'splunk';
        return {
            labelField: readFieldChoice(config, 'labelField', ''),
            valueField: readFieldChoice(config, 'valueField', ''),
            compareField: readFieldChoice(config, 'compareField', ''),
            colorField: readFieldChoice(config, 'colorField', ''),
            topN: Math.floor(readNumber(config, 'topN', 5, 0, 1000)),
            otherEnabled: readBool(config, 'otherEnabled', true),
            otherLabel: readString(config, 'otherLabel', 'Other') || 'Other',
            minSlicePercent: readNumber(config, 'minSlicePercent', 0, 0, 100),
            minSliceValue: readNumber(config, 'minSliceValue', 0, 0, Number.POSITIVE_INFINITY),
            sortMode: readString(config, 'sortMode', 'value-desc') || 'value-desc',
            showPercent: readBool(config, 'showPercent', true),
            showValue: readBool(config, 'showValue', true),
            showRowCount: readBool(config, 'showRowCount', true),
            showCompare: readBool(config, 'showCompare', true),
            showDataQuality: readBool(config, 'showDataQuality', true),
            showTooltip: readBool(config, 'showTooltip', true),
            showInspector: readBool(config, 'showInspector', true),
            showOtherBreakdown: readBool(config, 'showOtherBreakdown', true),
            showSliceLabels: readBool(config, 'showSliceLabels', false),
            sliceLabelMinPercent: readNumber(config, 'sliceLabelMinPercent', 0, 0, 100),
            title: String(readConfig(config, 'title', '') || ''),
            emptyMessage: readString(config, 'emptyMessage', 'No data to display.') || 'No data to display.',
            background: safeColor(readConfig(config, 'background', '#1B2A41'), '#1B2A41'),
            textColor: safeColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF'),
            palettePreset: palettePreset,
            palette: parsePalette(readConfig(config, 'palette', ''), palettePreset),
            colorMap: parseColorMap(readConfig(config, 'colorMap', '')),
            otherColor: safeColor(readConfig(config, 'otherColor', '#8B9BB4'), '#8B9BB4'),
            innerRadius: readNumber(config, 'innerRadius', 0, 0, 82),
            legendPosition: readString(config, 'legendPosition', 'right') || 'right',
            drilldown: readBool(config, 'drilldown', false),
            drilldownAction: readString(config, 'drilldownAction', 'tokens') || 'tokens',
            drilldownQuery:
                readString(
                    config,
                    'drilldownQuery',
                    'search $pie_filter_clause$ | stats count by $pie_label_field$'
                ) || 'search $pie_filter_clause$ | stats count',
            tokenPrefix: readString(config, 'tokenPrefix', 'pie') || 'pie',
        };
    }

    function pickColumns(rawData, opts, quality) {
        var fields = fieldsList(rawData);
        var valueIdx = findFieldIndex(fields, opts.valueField);
        var labelIdx = findFieldIndex(fields, opts.labelField);
        var compareIdx = findFieldIndex(fields, opts.compareField);
        var colorIdx = findFieldIndex(fields, opts.colorField);
        var c;
        var name;

        if (opts.valueField && valueIdx < 0) {
            quality.missingFields.push('valueField=' + opts.valueField);
        }
        if (opts.labelField && labelIdx < 0) {
            quality.missingFields.push('labelField=' + opts.labelField);
        }
        if (opts.compareField && compareIdx < 0) {
            quality.missingFields.push('compareField=' + opts.compareField);
        }
        if (opts.colorField && colorIdx < 0) {
            quality.missingFields.push('colorField=' + opts.colorField);
        }

        if (valueIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                name = normalizeFieldName(fields, c);
                if (isSkippedFieldName(name)) {
                    continue;
                }
                if (fieldHintScore(name, VALUE_FIELD_HINTS) && isNumericColumn(rawData, c)) {
                    valueIdx = c;
                    break;
                }
            }
        }
        if (valueIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                name = normalizeFieldName(fields, c);
                if (!isSkippedFieldName(name) && isNumericColumn(rawData, c)) {
                    valueIdx = c;
                    break;
                }
            }
        }

        if (labelIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                if (c === valueIdx) {
                    continue;
                }
                name = normalizeFieldName(fields, c);
                if (isSkippedFieldName(name)) {
                    continue;
                }
                if (fieldHintScore(name, LABEL_FIELD_HINTS) && !isNumericColumn(rawData, c)) {
                    labelIdx = c;
                    break;
                }
            }
        }
        if (labelIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                if (c === valueIdx) {
                    continue;
                }
                name = normalizeFieldName(fields, c);
                if (!isSkippedFieldName(name) && !isNumericColumn(rawData, c)) {
                    labelIdx = c;
                    break;
                }
            }
        }

        if (!opts.compareField && compareIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                if (c === valueIdx || c === labelIdx) {
                    continue;
                }
                name = normalizeFieldName(fields, c);
                if (fieldHintScore(name, COMPARE_FIELD_HINTS) && isNumericColumn(rawData, c)) {
                    compareIdx = c;
                    break;
                }
            }
        }
        if (!opts.colorField && colorIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                if (c === valueIdx || c === labelIdx || c === compareIdx) {
                    continue;
                }
                name = normalizeFieldName(fields, c);
                if (fieldHintScore(name, COLOR_FIELD_HINTS)) {
                    colorIdx = c;
                    break;
                }
            }
        }

        return {
            labelIdx: labelIdx,
            valueIdx: valueIdx,
            compareIdx: compareIdx,
            colorIdx: colorIdx,
            labelFieldName: labelIdx >= 0 ? fieldName(fields, labelIdx) : '',
            valueFieldName: valueIdx >= 0 ? fieldName(fields, valueIdx) : '',
            compareFieldName: compareIdx >= 0 ? fieldName(fields, compareIdx) : '',
            colorFieldName: colorIdx >= 0 ? fieldName(fields, colorIdx) : '',
        };
    }

    function blankQuality() {
        return {
            rowCount: 0,
            usedRows: 0,
            droppedNonNumeric: 0,
            droppedNegative: 0,
            zeroRows: 0,
            blankLabels: 0,
            compareMissing: 0,
            colorInvalid: 0,
            missingFields: [],
            groupedSlices: 0,
            groupedRows: 0,
        };
    }

    function buildSlices(rawData, opts) {
        var quality = blankQuality();
        var fields = fieldsList(rawData);
        var picked = pickColumns(rawData, opts, quality);
        var byLabel = {};
        var order = [];
        var labelCol;
        var valueCol;
        var compareCol;
        var colorCol;
        var rowCount;
        var r;

        if (!rawData || !rawData.columns || rawData.columns.length === 0 || picked.valueIdx < 0) {
            return {
                slices: [],
                fields: fields,
                picked: picked,
                quality: quality,
                error: 'Pie chart needs a numeric value column. Use valueField to choose one explicitly.',
            };
        }

        labelCol = picked.labelIdx >= 0 ? rawData.columns[picked.labelIdx] || [] : [];
        valueCol = rawData.columns[picked.valueIdx] || [];
        compareCol = picked.compareIdx >= 0 ? rawData.columns[picked.compareIdx] || [] : [];
        colorCol = picked.colorIdx >= 0 ? rawData.columns[picked.colorIdx] || [] : [];
        rowCount = valueCol.length;
        if (picked.labelIdx >= 0) {
            rowCount = Math.max(rowCount, labelCol.length);
        }
        quality.rowCount = rowCount;

        for (r = 0; r < rowCount; r += 1) {
            var val = parseNum(valueCol[r]);
            var rawLabel;
            var label;
            var compareVal;
            var color;
            if (!isFinite(val)) {
                quality.droppedNonNumeric += 1;
                continue;
            }
            if (val < 0) {
                quality.droppedNegative += 1;
                continue;
            }
            if (val === 0) {
                quality.zeroRows += 1;
            }
            rawLabel = picked.labelIdx >= 0 ? cellValue(labelCol[r]) : null;
            label = picked.labelIdx >= 0 ? String(rawLabel == null ? '' : rawLabel) : 'Row ' + (r + 1);
            if (!label) {
                label = '(blank)';
                quality.blankLabels += 1;
            }
            if (!Object.prototype.hasOwnProperty.call(byLabel, label)) {
                byLabel[label] = {
                    label: label,
                    value: 0,
                    compareValue: null,
                    rowCount: 0,
                    inputOrder: order.length,
                    color: '',
                };
                order.push(label);
            }
            byLabel[label].value += val;
            byLabel[label].rowCount += 1;
            quality.usedRows += 1;

            if (picked.compareIdx >= 0) {
                compareVal = parseNum(compareCol[r]);
                if (isFinite(compareVal)) {
                    if (byLabel[label].compareValue === null) {
                        byLabel[label].compareValue = 0;
                    }
                    byLabel[label].compareValue += compareVal;
                } else {
                    quality.compareMissing += 1;
                }
            }

            if (picked.colorIdx >= 0 && !byLabel[label].color) {
                color = safeColor(cellValue(colorCol[r]), '');
                if (color) {
                    byLabel[label].color = color;
                } else if (cellValue(colorCol[r])) {
                    quality.colorInvalid += 1;
                }
            }
        }

        return {
            slices: order.map(function (key) {
                return byLabel[key];
            }),
            fields: fields,
            picked: picked,
            quality: quality,
            error: '',
        };
    }

    function sortSlices(slices, sortMode) {
        var mode = String(sortMode || 'value-desc').toLowerCase();
        return slices.slice().sort(function (a, b) {
            if (mode === 'label-asc') {
                return String(a.label).localeCompare(String(b.label));
            }
            if (mode === 'label-desc') {
                return String(b.label).localeCompare(String(a.label));
            }
            if (mode === 'value-asc') {
                return a.value - b.value || a.inputOrder - b.inputOrder;
            }
            if (mode === 'input') {
                return a.inputOrder - b.inputOrder;
            }
            return b.value - a.value || a.inputOrder - b.inputOrder;
        });
    }

    function sumMembers(members, prop) {
        var total = 0;
        var i;
        for (i = 0; i < members.length; i += 1) {
            total += members[i][prop] || 0;
        }
        return total;
    }

    function shapeSlices(slices, opts, quality) {
        var positive = slices.filter(function (s) {
            return s.value > 0;
        });
        var ranked = sortSlices(positive, 'value-desc');
        var total = sumMembers(positive, 'value');
        var rankMap = {};
        var sorted = sortSlices(positive, opts.sortMode);
        var keep = [];
        var grouped = [];
        var i;

        for (i = 0; i < ranked.length; i += 1) {
            rankMap[ranked[i].label] = i + 1;
        }

        for (i = 0; i < sorted.length; i += 1) {
            var s = sorted[i];
            var percent = total > 0 ? (s.value / total) * 100 : 0;
            var shouldGroup =
                opts.otherEnabled &&
                ((opts.topN > 0 && keep.length >= opts.topN) ||
                    (opts.minSliceValue > 0 && s.value < opts.minSliceValue) ||
                    (opts.minSlicePercent > 0 && percent < opts.minSlicePercent));
            if (shouldGroup) {
                grouped.push(s);
            } else {
                keep.push(s);
            }
        }

        if (opts.otherEnabled && grouped.length) {
            keep.push({
                label: opts.otherLabel,
                value: sumMembers(grouped, 'value'),
                compareValue: grouped.some(function (s) { return s.compareValue !== null; })
                    ? sumMembers(grouped, 'compareValue')
                    : null,
                rowCount: sumMembers(grouped, 'rowCount'),
                inputOrder: Number.MAX_SAFE_INTEGER || 9007199254740991,
                color: opts.otherColor,
                isOther: true,
                members: sortSlices(grouped, 'value-desc'),
            });
            quality.groupedSlices = grouped.length;
            quality.groupedRows = sumMembers(grouped, 'rowCount');
        }

        for (i = 0; i < keep.length; i += 1) {
            keep[i].rank = keep[i].isOther ? null : rankMap[keep[i].label];
            keep[i].percent = total > 0 ? (keep[i].value / total) * 100 : 0;
            keep[i].color = chooseColor(keep[i], i, opts);
        }

        return {
            slices: keep,
            total: total,
            originalSliceCount: positive.length,
        };
    }

    function chooseColor(slice, idx, opts) {
        if (slice.isOther) {
            return opts.otherColor;
        }
        if (slice.color) {
            return slice.color;
        }
        if (opts.colorMap && opts.colorMap[slice.label]) {
            return opts.colorMap[slice.label];
        }
        return opts.palette[idx % opts.palette.length];
    }

    function pctText(value, precision) {
        return (isFinite(value) ? value : 0).toFixed(precision == null ? 1 : precision) + '%';
    }

    function valueText(value) {
        return Number(value || 0).toLocaleString();
    }

    function compareText(slice) {
        if (slice.compareValue === null || !isFinite(slice.compareValue)) {
            return '';
        }
        var delta = slice.value - slice.compareValue;
        var pct = slice.compareValue === 0 ? null : (delta / Math.abs(slice.compareValue)) * 100;
        var sign = delta > 0 ? '+' : '';
        return sign + valueText(delta) + (pct === null ? '' : ' (' + sign + pctText(pct, 1) + ')');
    }

    function qualityMessages(model) {
        var q = model.quality;
        var msgs = [];
        if (q.missingFields.length) {
            msgs.push('Missing configured fields: ' + q.missingFields.join(', '));
        }
        if (q.droppedNonNumeric) {
            msgs.push(q.droppedNonNumeric + ' rows ignored with non-numeric values');
        }
        if (q.droppedNegative) {
            msgs.push(q.droppedNegative + ' negative rows ignored');
        }
        if (q.blankLabels) {
            msgs.push(q.blankLabels + ' blank labels grouped as (blank)');
        }
        if (q.zeroRows) {
            msgs.push(q.zeroRows + ' zero-value rows kept out of the visible area');
        }
        if (q.compareMissing) {
            msgs.push(q.compareMissing + ' rows missing compare values');
        }
        if (q.colorInvalid) {
            msgs.push(q.colorInvalid + ' invalid color values ignored');
        }
        if (q.groupedSlices) {
            msgs.push(q.groupedSlices + ' slices / ' + q.groupedRows + ' rows grouped into Other');
        }
        if (!msgs.length && q.rowCount) {
            msgs.push('Using ' + q.usedRows + ' of ' + q.rowCount + ' rows');
        }
        return msgs;
    }

    function appendText(parent, text) {
        parent.appendChild(document.createTextNode(text));
    }

    function createSvgEl(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    function piePath(cx, cy, r, startAngle, sweep) {
        var endAngle = startAngle + sweep;
        var x1 = cx + r * Math.cos(startAngle);
        var y1 = cy + r * Math.sin(startAngle);
        var x2 = cx + r * Math.cos(endAngle);
        var y2 = cy + r * Math.sin(endAngle);
        var large = sweep > Math.PI ? 1 : 0;
        return (
            'M' +
            cx +
            ' ' +
            cy +
            ' L' +
            x1.toFixed(2) +
            ' ' +
            y1.toFixed(2) +
            ' A' +
            r +
            ' ' +
            r +
            ' 0 ' +
            large +
            ' 1 ' +
            x2.toFixed(2) +
            ' ' +
            y2.toFixed(2) +
            ' Z'
        );
    }

    function donutPath(cx, cy, outerR, innerR, startAngle, sweep) {
        var endAngle = startAngle + sweep;
        var large = sweep > Math.PI ? 1 : 0;
        var ox1 = cx + outerR * Math.cos(startAngle);
        var oy1 = cy + outerR * Math.sin(startAngle);
        var ox2 = cx + outerR * Math.cos(endAngle);
        var oy2 = cy + outerR * Math.sin(endAngle);
        var ix1 = cx + innerR * Math.cos(startAngle);
        var iy1 = cy + innerR * Math.sin(startAngle);
        var ix2 = cx + innerR * Math.cos(endAngle);
        var iy2 = cy + innerR * Math.sin(endAngle);
        return (
            'M' +
            ox1.toFixed(2) +
            ' ' +
            oy1.toFixed(2) +
            ' A' +
            outerR +
            ' ' +
            outerR +
            ' 0 ' +
            large +
            ' 1 ' +
            ox2.toFixed(2) +
            ' ' +
            oy2.toFixed(2) +
            ' L' +
            ix2.toFixed(2) +
            ' ' +
            iy2.toFixed(2) +
            ' A' +
            innerR +
            ' ' +
            innerR +
            ' 0 ' +
            large +
            ' 0 ' +
            ix1.toFixed(2) +
            ' ' +
            iy1.toFixed(2) +
            ' Z'
        );
    }

    function appendPieSlice(svg, cx, cy, outerR, innerR, startAngle, sweep, fill, stroke) {
        var path;
        var hole;
        if (sweep >= Math.PI * 2 - 1e-6) {
            path = createSvgEl('circle');
            path.setAttribute('cx', String(cx));
            path.setAttribute('cy', String(cy));
            path.setAttribute('r', String(outerR));
            if (innerR > 0) {
                hole = createSvgEl('circle');
                hole.setAttribute('cx', String(cx));
                hole.setAttribute('cy', String(cy));
                hole.setAttribute('r', String(innerR));
                hole.setAttribute('fill', stroke);
            }
        } else {
            path = createSvgEl('path');
            path.setAttribute('d', innerR > 0 ? donutPath(cx, cy, outerR, innerR, startAngle, sweep) : piePath(cx, cy, outerR, startAngle, sweep));
        }
        path.setAttribute('fill', fill);
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('class', 'splunkstuff-pie-chart-viz__slice');
        svg.appendChild(path);
        if (hole) {
            svg.appendChild(hole);
        }
        return path;
    }

    function clampNumber(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function truncateText(value, maxLength) {
        var text = String(value == null ? '' : value);
        var limit = maxLength || 30;
        if (text.length <= limit) {
            return text;
        }
        return text.slice(0, Math.max(0, limit - 3)) + '...';
    }

    function calloutLabelText(slice, opts) {
        var label = truncateText(slice.label, 30);
        if (opts.showPercent) {
            return label + ', ' + pctText(slice.percent, 1);
        }
        if (opts.showValue) {
            return label + ', ' + valueText(slice.value);
        }
        return label;
    }

    function distributeCalloutYs(items, minY, maxY, gap) {
        var i;
        var overflow;
        items.sort(function (a, b) {
            return a.targetY - b.targetY;
        });
        for (i = 0; i < items.length; i += 1) {
            items[i].y = clampNumber(items[i].targetY, minY, maxY);
            if (i > 0 && items[i].y < items[i - 1].y + gap) {
                items[i].y = items[i - 1].y + gap;
            }
        }
        if (items.length) {
            overflow = items[items.length - 1].y - maxY;
            if (overflow > 0) {
                for (i = 0; i < items.length; i += 1) {
                    items[i].y -= overflow;
                }
            }
            for (i = 0; i < items.length; i += 1) {
                if (i === 0 && items[i].y < minY) {
                    items[i].y = minY;
                } else if (i > 0 && items[i].y < items[i - 1].y + gap) {
                    items[i].y = items[i - 1].y + gap;
                }
            }
        }
        return items;
    }

    function appendSliceCallouts(svg, slices, angles, geometry, opts) {
        var left = [];
        var right = [];
        var callouts = [];
        var minY = 20;
        var maxY = geometry.height - 20;
        var gap = 15;
        var i;

        for (i = 0; i < slices.length; i += 1) {
            var angle = angles[i];
            var side;
            var item;
            if (!isFinite(angle) || slices[i].percent < opts.sliceLabelMinPercent) {
                callouts[i] = null;
                continue;
            }
            side = Math.cos(angle) >= 0 ? 'right' : 'left';
            item = {
                idx: i,
                angle: angle,
                side: side,
                targetY: geometry.cy + Math.sin(angle) * (geometry.outerR + 28),
            };
            if (side === 'right') {
                right.push(item);
            } else {
                left.push(item);
            }
        }

        distributeCalloutYs(left, minY, maxY, gap)
            .concat(distributeCalloutYs(right, minY, maxY, gap))
            .forEach(function (item) {
                var cos = Math.cos(item.angle);
                var sin = Math.sin(item.angle);
                var edgeX = geometry.cx + cos * (geometry.outerR + 2);
                var edgeY = geometry.cy + sin * (geometry.outerR + 2);
                var isRight = item.side === 'right';
                var labelX = isRight ? geometry.width - 160 : 160;
                var elbowX = isRight ? labelX - 14 : labelX + 14;
                var anchorX = isRight ? labelX - 4 : labelX + 4;
                var group = createSvgEl('g');
                var line = createSvgEl('polyline');
                var text = createSvgEl('text');

                group.setAttribute('class', 'splunkstuff-pie-chart-viz__callout');
                group.setAttribute('tabindex', '0');
                group.setAttribute('data-slice-index', String(item.idx));

                line.setAttribute('class', 'splunkstuff-pie-chart-viz__callout-line');
                line.setAttribute(
                    'points',
                    edgeX.toFixed(2) +
                        ',' +
                        edgeY.toFixed(2) +
                        ' ' +
                        elbowX.toFixed(2) +
                        ',' +
                        item.y.toFixed(2) +
                        ' ' +
                        anchorX.toFixed(2) +
                        ',' +
                        item.y.toFixed(2)
                );

                text.setAttribute('class', 'splunkstuff-pie-chart-viz__callout-text');
                text.setAttribute('x', String(labelX));
                text.setAttribute('y', String(item.y));
                text.setAttribute('text-anchor', isRight ? 'start' : 'end');
                text.setAttribute('fill', opts.textColor);
                text.setAttribute('stroke', opts.background);
                text.textContent = calloutLabelText(slices[item.idx], opts);

                group.appendChild(line);
                group.appendChild(text);
                svg.appendChild(group);
                callouts[item.idx] = group;
            });

        return callouts;
    }

    function eventPoint(root, e, fallbackEl) {
        var rootRect = root.getBoundingClientRect();
        var fallbackRect;
        if (e && isFinite(e.clientX) && isFinite(e.clientY)) {
            return {
                x: e.clientX - rootRect.left,
                y: e.clientY - rootRect.top,
            };
        }
        if (fallbackEl && typeof fallbackEl.getBoundingClientRect === 'function') {
            fallbackRect = fallbackEl.getBoundingClientRect();
            return {
                x: fallbackRect.left + fallbackRect.width / 2 - rootRect.left,
                y: fallbackRect.top + fallbackRect.height / 2 - rootRect.top,
            };
        }
        return {
            x: root.clientWidth / 2,
            y: root.clientHeight / 2,
        };
    }

    function clampTooltip(tooltip, root, x, y) {
        var width = tooltip.offsetWidth || 190;
        var height = tooltip.offsetHeight || 110;
        var maxX = Math.max(8, root.clientWidth - width - 8);
        var maxY = Math.max(8, root.clientHeight - height - 8);
        tooltip.style.left = Math.max(8, Math.min(x + 14, maxX)) + 'px';
        tooltip.style.top = Math.max(8, Math.min(y + 14, maxY)) + 'px';
    }

    function setTooltip(tooltip, slice, model, opts, root, e, fallbackEl) {
        if (!tooltip || !slice || !opts.showTooltip) {
            return;
        }
        var point = eventPoint(root, e, fallbackEl);
        tooltip.innerHTML = '';
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'hidden';

        var title = document.createElement('div');
        title.className = 'splunkstuff-pie-chart-viz__tooltip-title';
        title.textContent = slice.label;
        tooltip.appendChild(title);
        addMetric(tooltip, 'Value', valueText(slice.value));
        addMetric(tooltip, 'Percent', pctText(slice.percent, 1));
        if (slice.rank !== null) {
            addMetric(tooltip, 'Rank', '#' + slice.rank);
        }
        addMetric(tooltip, 'Rows', valueText(slice.rowCount));
        if (opts.showCompare && slice.compareValue !== null) {
            addMetric(tooltip, 'Compare', valueText(slice.compareValue));
            addMetric(tooltip, 'Delta', compareText(slice));
        }
        if (slice.isOther && opts.showOtherBreakdown && slice.members && slice.members.length) {
            addBreakdown(tooltip, slice.members, model.total);
        }
        clampTooltip(tooltip, root, point.x, point.y);
        tooltip.style.visibility = 'visible';
    }

    function addMetric(parent, label, value) {
        var row = document.createElement('div');
        row.className = 'splunkstuff-pie-chart-viz__metric';
        var key = document.createElement('span');
        key.textContent = label;
        var val = document.createElement('strong');
        val.textContent = value;
        row.appendChild(key);
        row.appendChild(val);
        parent.appendChild(row);
    }

    function addBreakdown(parent, members, total) {
        var wrap = document.createElement('div');
        var title = document.createElement('div');
        var i;
        wrap.className = 'splunkstuff-pie-chart-viz__breakdown';
        title.className = 'splunkstuff-pie-chart-viz__breakdown-title';
        title.textContent = 'Other breakdown';
        wrap.appendChild(title);
        for (i = 0; i < Math.min(6, members.length); i += 1) {
            var row = document.createElement('div');
            row.className = 'splunkstuff-pie-chart-viz__breakdown-row';
            row.textContent =
                members[i].label +
                ': ' +
                valueText(members[i].value) +
                ' (' +
                pctText(total > 0 ? (members[i].value / total) * 100 : 0, 1) +
                ')';
            wrap.appendChild(row);
        }
        if (members.length > 6) {
            var more = document.createElement('div');
            more.className = 'splunkstuff-pie-chart-viz__breakdown-row';
            more.textContent = '+' + (members.length - 6) + ' more';
            wrap.appendChild(more);
        }
        parent.appendChild(wrap);
    }

    function updateInspector(inspector, slice, opts, model) {
        if (!inspector || !opts.showInspector) {
            return;
        }
        inspector.innerHTML = '';
        var label = document.createElement('div');
        label.className = 'splunkstuff-pie-chart-viz__inspector-label';
        label.textContent = slice ? slice.label : 'Slice inspector';
        inspector.appendChild(label);
        if (!slice) {
            var hint = document.createElement('div');
            hint.className = 'splunkstuff-pie-chart-viz__inspector-hint';
            hint.textContent = 'Hover or select a slice to inspect contribution, rank, row count, and compare delta.';
            inspector.appendChild(hint);
            return;
        }
        addMetric(inspector, 'Value', valueText(slice.value));
        addMetric(inspector, 'Percent', pctText(slice.percent, 1));
        addMetric(inspector, 'Rows', valueText(slice.rowCount));
        if (slice.rank !== null) {
            addMetric(inspector, 'Rank', '#' + slice.rank + ' of ' + model.originalSliceCount);
        }
        if (opts.showCompare && slice.compareValue !== null) {
            addMetric(inspector, 'Prior', valueText(slice.compareValue));
            addMetric(inspector, 'Delta', compareText(slice));
        }
        if (slice.isOther && opts.showOtherBreakdown && slice.members && slice.members.length) {
            addBreakdown(inspector, slice.members, model.total);
        }
    }

    function makeFilterClause(fieldNameValue, label) {
        var labelText = String(label == null ? '' : label);
        var field = String(fieldNameValue || '').trim();
        var escaped = labelText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        if (!field) {
            return 'search "' + escaped + '"';
        }
        return field + '="' + escaped + '"';
    }

    function tokenMap(detail, prefix) {
        var p = prefix || 'pie';
        var map = {};
        map[p + '_label'] = detail.label;
        map[p + '_value'] = String(detail.value);
        map[p + '_percent'] = String(detail.percent);
        map[p + '_rank'] = detail.rank == null ? '' : String(detail.rank);
        map[p + '_rows'] = String(detail.rowCount);
        map[p + '_label_field'] = detail.labelField;
        map[p + '_value_field'] = detail.valueField;
        map[p + '_filter_clause'] = detail.filterClause;
        map[p + '_compare_value'] = detail.compareValue == null ? '' : String(detail.compareValue);
        map[p + '_compare_delta'] = detail.compareDelta == null ? '' : String(detail.compareDelta);
        return map;
    }

    function setSplunkTokens(ownerDoc, prefix, detail) {
        var win = (ownerDoc && ownerDoc.defaultView) || window;
        var req = win && win.require;
        var values = tokenMap(detail, prefix);
        if (typeof req !== 'function') {
            return;
        }
        try {
            req(['splunkjs/mvc'], function (mvc) {
                ['default', 'submitted'].forEach(function (modelName) {
                    var model = mvc && mvc.Components && mvc.Components.get(modelName);
                    if (!model || typeof model.set !== 'function') {
                        return;
                    }
                    Object.keys(values).forEach(function (key) {
                        model.set(key, values[key]);
                    });
                });
            });
        } catch (ignore) {}
    }

    function substituteTokens(template, values) {
        var out = String(template || '');
        Object.keys(values).forEach(function (key) {
            out = out.split('$' + key + '$').join(values[key]);
        });
        return out;
    }

    function maybeNavigateSearch(ownerDoc, opts, detail) {
        var action = String(opts.drilldownAction || 'tokens').toLowerCase();
        var win = (ownerDoc && ownerDoc.defaultView) || window;
        var query;
        var params;
        if (action !== 'search' && action !== 'both') {
            return;
        }
        query = substituteTokens(opts.drilldownQuery, tokenMap(detail, opts.tokenPrefix));
        params = new URLSearchParams();
        params.set('q', query || detail.filterClause || '*');
        win.location.href = '/app/search/search?' + params.toString();
    }

    function sliceDetail(slice, model) {
        var compareDelta = slice.compareValue === null ? null : slice.value - slice.compareValue;
        return {
            label: slice.label,
            value: slice.value,
            percent: slice.percent,
            rank: slice.rank,
            rowCount: slice.rowCount,
            compareValue: slice.compareValue,
            compareDelta: compareDelta,
            labelField: model.picked.labelFieldName,
            valueField: model.picked.valueFieldName,
            filterClause: makeFilterClause(model.picked.labelFieldName, slice.label),
            isOther: !!slice.isOther,
            members: slice.members || [],
        };
    }

    function buildModel(rawData, opts) {
        var base = buildSlices(rawData, opts);
        var shaped = shapeSlices(base.slices, opts, base.quality);
        return {
            slices: shaped.slices,
            total: shaped.total,
            originalSliceCount: shaped.originalSliceCount,
            fields: base.fields,
            picked: base.picked,
            quality: base.quality,
            error: base.error,
        };
    }

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 10000,
            };
        },

        formatData: function (rawData) {
            return { rawData: rawData || { columns: [], fields: [] } };
        },

        updateView: function (data, config) {
            if (this._pieCleanup) {
                this._pieCleanup();
                this._pieCleanup = null;
            }
            this.el.innerHTML = '';

            var opts = readOptions(config);
            var model = buildModel((data && data.rawData) || {}, opts);
            var slices = model.slices;
            var total = model.total;
            var i;
            var cleanup = [];

            this.el.style.backgroundColor = opts.background;
            this.el.style.color = opts.textColor;
            this.el.setAttribute('data-pie-token-prefix', opts.tokenPrefix);

            if (model.error || !slices.length || total <= 0) {
                var empty = document.createElement('div');
                empty.className = 'splunkstuff-pie-chart-viz__err';
                empty.textContent = model.error || opts.emptyMessage;
                this.el.appendChild(empty);
                return;
            }

            var root = document.createElement('div');
            root.className =
                'splunkstuff-pie-chart-viz splunkstuff-pie-chart-viz--legend-' +
                String(opts.legendPosition || 'right').toLowerCase();
            if (opts.showSliceLabels) {
                root.className += ' splunkstuff-pie-chart-viz--slice-labels';
            }

            if (opts.title) {
                var head = document.createElement('div');
                head.className = 'splunkstuff-pie-chart-viz__title';
                head.textContent = opts.title;
                root.appendChild(head);
            }

            if (opts.showDataQuality) {
                var qMessages = qualityMessages(model);
                if (qMessages.length) {
                    var banner = document.createElement('div');
                    banner.className = 'splunkstuff-pie-chart-viz__quality';
                    banner.textContent = qMessages.join('; ');
                    root.appendChild(banner);
                }
            }

            var main = document.createElement('div');
            main.className = 'splunkstuff-pie-chart-viz__main';

            var pieBox = document.createElement('div');
            pieBox.className = 'splunkstuff-pie-chart-viz__pie';
            if (opts.showSliceLabels) {
                pieBox.className += ' splunkstuff-pie-chart-viz__pie--slice-labels';
            }
            var svg = createSvgEl('svg');
            var geometry = opts.showSliceLabels
                ? { width: 520, height: 280, cx: 260, cy: 140, outerR: 76 }
                : { width: 200, height: 200, cx: 100, cy: 100, outerR: 88 };
            svg.setAttribute('viewBox', '0 0 ' + geometry.width + ' ' + geometry.height);
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', 'Pie chart: ' + valueText(total) + ' total');
            svg.style.color = opts.textColor;

            var tooltip = document.createElement('div');
            tooltip.className = 'splunkstuff-pie-chart-viz__tooltip';
            tooltip.style.display = 'none';

            var side = document.createElement('div');
            side.className = 'splunkstuff-pie-chart-viz__side';

            var inspector = null;
            if (opts.showInspector) {
                inspector = document.createElement('div');
                inspector.className = 'splunkstuff-pie-chart-viz__inspector';
                updateInspector(inspector, slices[0], opts, model);
                side.appendChild(inspector);
            }

            var legend = document.createElement('div');
            legend.className = 'splunkstuff-pie-chart-viz__legend';

            var cx = geometry.cx;
            var cy = geometry.cy;
            var outerR = geometry.outerR;
            var innerR = Math.min(opts.innerRadius, Math.max(0, outerR - 8));
            var angle = -Math.PI / 2;
            var paths = [];
            var rows = [];
            var callouts = [];
            var sliceAngles = [];

            function clearActive() {
                paths.forEach(function (p) {
                    p.classList.remove('splunkstuff-pie-chart-viz__slice--active');
                    p.classList.remove('splunkstuff-pie-chart-viz__slice--dim');
                });
                callouts.forEach(function (callout) {
                    if (!callout) {
                        return;
                    }
                    callout.classList.remove('splunkstuff-pie-chart-viz__callout--active');
                    callout.classList.remove('splunkstuff-pie-chart-viz__callout--dim');
                });
                rows.forEach(function (row) {
                    row.classList.remove('splunkstuff-pie-chart-viz__legend-row--active');
                    row.classList.remove('splunkstuff-pie-chart-viz__legend-row--dim');
                });
            }

            function setActive(idx, e) {
                clearActive();
                paths.forEach(function (p, pi) {
                    p.classList.toggle('splunkstuff-pie-chart-viz__slice--dim', pi !== idx);
                });
                callouts.forEach(function (callout, ci) {
                    if (callout) {
                        callout.classList.toggle('splunkstuff-pie-chart-viz__callout--dim', ci !== idx);
                    }
                });
                rows.forEach(function (row, ri) {
                    row.classList.toggle('splunkstuff-pie-chart-viz__legend-row--dim', ri !== idx);
                });
                paths[idx].classList.add('splunkstuff-pie-chart-viz__slice--active');
                if (callouts[idx]) {
                    callouts[idx].classList.add('splunkstuff-pie-chart-viz__callout--active');
                }
                rows[idx].classList.add('splunkstuff-pie-chart-viz__legend-row--active');
                updateInspector(inspector, slices[idx], opts, model);
                if (e) {
                    setTooltip(tooltip, slices[idx], model, opts, root, e, paths[idx]);
                }
            }

            function hideTooltip() {
                tooltip.style.display = 'none';
                tooltip.style.visibility = 'hidden';
            }

            function activateClick(idx) {
                var detail = sliceDetail(slices[idx], model);
                var ownerDoc = root.ownerDocument || document;
                root.setAttribute('data-pie-label', detail.label);
                root.setAttribute('data-pie-value', String(detail.value));
                root.setAttribute('data-pie-percent', String(detail.percent));
                root.setAttribute('data-pie-filter-clause', detail.filterClause);
                if (opts.drilldown) {
                    setSplunkTokens(ownerDoc, opts.tokenPrefix, detail);
                    maybeNavigateSearch(ownerDoc, opts, detail);
                }
                try {
                    root.dispatchEvent(
                        new CustomEvent('splunkstuff:pie-slice-click', {
                            bubbles: true,
                            detail: detail,
                        })
                    );
                } catch (ignore) {}
            }

            for (i = 0; i < slices.length; i += 1) {
                var frac = slices[i].value / total;
                var sweep = frac * Math.PI * 2;
                if (sweep <= 0) {
                    continue;
                }
                sliceAngles[i] = angle + sweep / 2;
                var path = appendPieSlice(
                    svg,
                    cx,
                    cy,
                    outerR,
                    innerR,
                    angle,
                    sweep,
                    slices[i].color,
                    opts.background
                );
                path.setAttribute('tabindex', '0');
                path.setAttribute(
                    'aria-label',
                    slices[i].label +
                        ', ' +
                        valueText(slices[i].value) +
                        ', ' +
                        pctText(slices[i].percent, 1)
                );
                path.setAttribute('data-slice-index', String(i));
                paths.push(path);
                angle += sweep;
            }

            if (opts.showSliceLabels) {
                callouts = appendSliceCallouts(svg, slices, sliceAngles, geometry, opts);
            }

            paths.forEach(function (path, idx) {
                var enter = function (e) {
                    setActive(idx, e);
                };
                var move = function (e) {
                    setTooltip(tooltip, slices[idx], model, opts, root, e, path);
                };
                var leave = function () {
                    hideTooltip();
                };
                var focus = function (e) {
                    setActive(idx);
                    setTooltip(tooltip, slices[idx], model, opts, root, e, path);
                };
                var click = function () {
                    activateClick(idx);
                };
                var keydown = function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        activateClick(idx);
                    }
                };
                path.addEventListener('pointerenter', enter);
                path.addEventListener('pointermove', move);
                path.addEventListener('pointerleave', leave);
                path.addEventListener('mouseenter', enter);
                path.addEventListener('mousemove', move);
                path.addEventListener('mouseleave', leave);
                path.addEventListener('focus', focus);
                path.addEventListener('blur', leave);
                path.addEventListener('click', click);
                path.addEventListener('keydown', keydown);
                cleanup.push(function () {
                    path.removeEventListener('pointerenter', enter);
                    path.removeEventListener('pointermove', move);
                    path.removeEventListener('pointerleave', leave);
                    path.removeEventListener('mouseenter', enter);
                    path.removeEventListener('mousemove', move);
                    path.removeEventListener('mouseleave', leave);
                    path.removeEventListener('focus', focus);
                    path.removeEventListener('blur', leave);
                    path.removeEventListener('click', click);
                    path.removeEventListener('keydown', keydown);
                });
            });

            callouts.forEach(function (callout, idx) {
                if (!callout) {
                    return;
                }
                var enter = function (e) {
                    setActive(idx, e);
                };
                var move = function (e) {
                    setTooltip(tooltip, slices[idx], model, opts, root, e, callout);
                };
                var leave = function () {
                    hideTooltip();
                };
                var focus = function (e) {
                    setActive(idx);
                    setTooltip(tooltip, slices[idx], model, opts, root, e, callout);
                };
                var click = function () {
                    activateClick(idx);
                };
                var keydown = function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        activateClick(idx);
                    }
                };
                callout.addEventListener('pointerenter', enter);
                callout.addEventListener('pointermove', move);
                callout.addEventListener('pointerleave', leave);
                callout.addEventListener('mouseenter', enter);
                callout.addEventListener('mousemove', move);
                callout.addEventListener('mouseleave', leave);
                callout.addEventListener('focus', focus);
                callout.addEventListener('blur', leave);
                callout.addEventListener('click', click);
                callout.addEventListener('keydown', keydown);
                cleanup.push(function () {
                    callout.removeEventListener('pointerenter', enter);
                    callout.removeEventListener('pointermove', move);
                    callout.removeEventListener('pointerleave', leave);
                    callout.removeEventListener('mouseenter', enter);
                    callout.removeEventListener('mousemove', move);
                    callout.removeEventListener('mouseleave', leave);
                    callout.removeEventListener('focus', focus);
                    callout.removeEventListener('blur', leave);
                    callout.removeEventListener('click', click);
                    callout.removeEventListener('keydown', keydown);
                });
            });

            pieBox.appendChild(svg);
            main.appendChild(pieBox);

            for (i = 0; i < slices.length; i += 1) {
                var row = document.createElement('button');
                row.type = 'button';
                row.className = 'splunkstuff-pie-chart-viz__legend-row';
                var swatch = document.createElement('span');
                swatch.className = 'splunkstuff-pie-chart-viz__swatch';
                swatch.style.backgroundColor = slices[i].color;
                var text = document.createElement('span');
                text.className = 'splunkstuff-pie-chart-viz__legend-text';
                appendText(text, slices[i].label);
                if (opts.showValue) {
                    appendText(text, ' - ' + valueText(slices[i].value));
                }
                if (opts.showPercent) {
                    appendText(text, ' (' + pctText(slices[i].percent, 1) + ')');
                }
                if (opts.showRowCount) {
                    appendText(text, ' - ' + valueText(slices[i].rowCount) + ' rows');
                }
                if (opts.showCompare && slices[i].compareValue !== null) {
                    appendText(text, ' - delta ' + compareText(slices[i]));
                }
                row.appendChild(swatch);
                row.appendChild(text);
                (function (idx, legendRow) {
                    var enter = function (e) {
                        setActive(idx, e);
                    };
                    var move = function (e) {
                        setTooltip(tooltip, slices[idx], model, opts, root, e, legendRow);
                    };
                    var leave = function () {
                        hideTooltip();
                    };
                    var focus = function (e) {
                        setActive(idx);
                        setTooltip(tooltip, slices[idx], model, opts, root, e, legendRow);
                    };
                    var click = function () {
                        activateClick(idx);
                    };
                    legendRow.addEventListener('pointerenter', enter);
                    legendRow.addEventListener('pointermove', move);
                    legendRow.addEventListener('pointerleave', leave);
                    legendRow.addEventListener('mouseenter', enter);
                    legendRow.addEventListener('mousemove', move);
                    legendRow.addEventListener('mouseleave', leave);
                    legendRow.addEventListener('focus', focus);
                    legendRow.addEventListener('blur', leave);
                    legendRow.addEventListener('click', click);
                    cleanup.push(function () {
                        legendRow.removeEventListener('pointerenter', enter);
                        legendRow.removeEventListener('pointermove', move);
                        legendRow.removeEventListener('pointerleave', leave);
                        legendRow.removeEventListener('mouseenter', enter);
                        legendRow.removeEventListener('mousemove', move);
                        legendRow.removeEventListener('mouseleave', leave);
                        legendRow.removeEventListener('focus', focus);
                        legendRow.removeEventListener('blur', leave);
                        legendRow.removeEventListener('click', click);
                    });
                })(i, row);
                rows.push(row);
                legend.appendChild(row);
            }

            side.appendChild(legend);
            main.appendChild(side);
            root.appendChild(main);
            root.appendChild(tooltip);
            this.el.appendChild(root);

            this._pieCleanup = function () {
                var ci;
                for (ci = 0; ci < cleanup.length; ci += 1) {
                    cleanup[ci]();
                }
            };
        },

        reflow: function () {},

        remove: function () {
            if (this._pieCleanup) {
                this._pieCleanup();
                this._pieCleanup = null;
            }
            this.el.innerHTML = '';
        },
    });
});
