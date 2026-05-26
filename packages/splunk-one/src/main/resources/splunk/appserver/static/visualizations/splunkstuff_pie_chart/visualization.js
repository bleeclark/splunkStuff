/* eslint-disable */
/**
 * Splunk custom visualization: categorical pie chart with Top N + Other.
 * Vanilla AMD; expects column-major results with a label field and a numeric field.
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
    ];

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

    function readConfig(config, prop, fallback) {
        var v = config && config[NS + prop];
        if (v === undefined || v === null || v === '') {
            return fallback;
        }
        return v;
    }

    function truthy(raw) {
        var s = String(raw == null ? '' : raw).trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes' || s === 'on';
    }

    function safeColor(raw, fallback) {
        var s = String(raw == null ? '' : raw).trim();
        return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
    }

    var VALUE_FIELD_HINTS = ['value', 'count', 'sum', 'total', 'amount', 'pct', 'percent', 'avg', 'mean'];
    var LABEL_FIELD_HINTS = ['category', 'label', 'name', 'series', 'slice', 'status', 'host', 'field'];
    var SKIP_FIELD_NAMES = { _time: true, _span: true, _spandays: true, punct: true };

    function normalizeFieldName(fields, idx) {
        return fieldName(fields, idx).toLowerCase();
    }

    function isSkippedFieldName(name) {
        return SKIP_FIELD_NAMES[name] === true || name.indexOf('_time') === 0;
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
        var s = String(raw).replace(/,/g, '').trim();
        var n = parseFloat(s, 10);
        return isFinite(n) ? n : NaN;
    }

    function isNumericColumn(rawData, colIdx) {
        var col = rawData.columns[colIdx] || [];
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

    function pickLabelAndValueColumns(rawData) {
        var fields = fieldsList(rawData);
        if (!rawData || !rawData.columns || !fields.length) {
            return { labelIdx: -1, valueIdx: -1 };
        }
        var valueIdx = -1;
        var labelIdx = -1;
        var c;
        var name;

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
        if (valueIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                name = normalizeFieldName(fields, c);
                if (isSkippedFieldName(name)) {
                    continue;
                }
                if (isNumericColumn(rawData, c)) {
                    valueIdx = c;
                    break;
                }
            }
        }

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
        if (labelIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                if (c === valueIdx) {
                    continue;
                }
                name = normalizeFieldName(fields, c);
                if (isSkippedFieldName(name)) {
                    continue;
                }
                if (!isNumericColumn(rawData, c)) {
                    labelIdx = c;
                    break;
                }
            }
        }

        if (valueIdx < 0) {
            return { labelIdx: -1, valueIdx: -1 };
        }
        if (labelIdx < 0) {
            for (c = 0; c < rawData.columns.length; c += 1) {
                if (c !== valueIdx && !isSkippedFieldName(normalizeFieldName(fields, c))) {
                    labelIdx = c;
                    break;
                }
            }
        }
        return { labelIdx: labelIdx, valueIdx: valueIdx };
    }

    function buildSlices(rawData, labelIdx, valueIdx) {
        var labelCol = labelIdx >= 0 ? rawData.columns[labelIdx] || [] : [];
        var valueCol = rawData.columns[valueIdx] || [];
        var n = Math.max(labelCol.length, valueCol.length);
        var byLabel = {};
        var order = [];
        var r;
        for (r = 0; r < n; r += 1) {
            var val = parseNum(valueCol[r]);
            if (!isFinite(val) || val < 0) {
                continue;
            }
            var label = labelIdx >= 0 ? String(cellValue(labelCol[r]) == null ? '' : cellValue(labelCol[r])) : 'Row ' + (r + 1);
            if (!label) {
                label = '(blank)';
            }
            if (!Object.prototype.hasOwnProperty.call(byLabel, label)) {
                byLabel[label] = 0;
                order.push(label);
            }
            byLabel[label] += val;
        }
        var slices = [];
        var i;
        for (i = 0; i < order.length; i += 1) {
            var key = order[i];
            slices.push({ label: key, value: byLabel[key] });
        }
        return slices;
    }

    function applyTopN(slices, topN, otherLabel) {
        var sorted = slices.slice().sort(function (a, b) {
            return b.value - a.value;
        });
        var limit = parseInt(topN, 10);
        if (!isFinite(limit) || limit <= 0 || sorted.length <= limit) {
            return sorted;
        }
        var keep = sorted.slice(0, limit);
        var rest = sorted.slice(limit);
        var otherSum = 0;
        var i;
        for (i = 0; i < rest.length; i += 1) {
            otherSum += rest[i].value;
        }
        if (otherSum > 0) {
            keep.push({
                label: String(otherLabel || 'Other'),
                value: otherSum,
            });
        }
        return keep;
    }

    function appendPieSlice(svg, cx, cy, r, startAngle, sweep, fill, stroke) {
        if (sweep >= Math.PI * 2 - 1e-6) {
            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', String(cx));
            circle.setAttribute('cy', String(cy));
            circle.setAttribute('r', String(r));
            circle.setAttribute('fill', fill);
            circle.setAttribute('stroke', stroke);
            circle.setAttribute('stroke-width', '1');
            svg.appendChild(circle);
            return;
        }
        var endAngle = startAngle + sweep;
        var x1 = cx + r * Math.cos(startAngle);
        var y1 = cy + r * Math.sin(startAngle);
        var x2 = cx + r * Math.cos(endAngle);
        var y2 = cy + r * Math.sin(endAngle);
        var large = sweep > Math.PI ? 1 : 0;
        var d =
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
            ' Z';
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', fill);
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', '1');
        svg.appendChild(path);
    }

    return SplunkVisualizationBase.extend({
        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 10000,
            };
        },

        formatData: function (rawData) {
            if (!rawData || !rawData.columns || rawData.columns.length === 0) {
                return { slices: [] };
            }
            var picked = pickLabelAndValueColumns(rawData);
            if (picked.valueIdx < 0) {
                var names = [];
                var fi;
                for (fi = 0; fi < fieldsList(rawData).length; fi += 1) {
                    names.push(fieldName(fieldsList(rawData), fi));
                }
                throw new SplunkVisualizationBase.VisualizationError(
                    'Pie chart needs a numeric column (e.g. value or count) and a label column. Fields: ' +
                        names.join(', ')
                );
            }
            var slices = buildSlices(rawData, picked.labelIdx, picked.valueIdx);
            if (!slices.length) {
                var retryIdx = -1;
                var rc;
                var retryName;
                for (rc = 0; rc < rawData.columns.length; rc += 1) {
                    if (rc === picked.valueIdx) {
                        continue;
                    }
                    retryName = normalizeFieldName(fieldsList(rawData), rc);
                    if (isSkippedFieldName(retryName)) {
                        continue;
                    }
                    if (isNumericColumn(rawData, rc)) {
                        retryIdx = rc;
                        break;
                    }
                }
                if (retryIdx >= 0) {
                    picked.valueIdx = retryIdx;
                    slices = buildSlices(rawData, picked.labelIdx, picked.valueIdx);
                }
            }
            if (!slices.length) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'Pie chart found no rows with parseable numeric values. Check that a numeric field (e.g. value, count) is present and non-empty.'
                );
            }
            return { slices: slices };
        },

        updateView: function (data, config) {
            this.el.innerHTML = '';
            var slices = (data && data.slices) || [];
            if (!slices.length) {
                var empty = document.createElement('div');
                empty.className = 'splunkstuff-pie-chart-viz__err';
                empty.textContent = 'No data to display.';
                this.el.appendChild(empty);
                return;
            }

            var topN = readConfig(config, 'topN', '5');
            var otherLabel = readConfig(config, 'otherLabel', 'Other');
            var showPercent = truthy(readConfig(config, 'showPercent', 'true'));
            var title = String(readConfig(config, 'title', '') || '');
            var background = safeColor(readConfig(config, 'background', '#1B2A41'), '#1B2A41');
            var textColor = safeColor(readConfig(config, 'textColor', '#FFFFFF'), '#FFFFFF');

            var shaped = applyTopN(slices, topN, otherLabel);
            var total = 0;
            var i;
            for (i = 0; i < shaped.length; i += 1) {
                total += shaped[i].value;
            }
            if (total <= 0) {
                var err = document.createElement('div');
                err.className = 'splunkstuff-pie-chart-viz__err';
                err.textContent = 'Sum of values must be greater than zero.';
                this.el.appendChild(err);
                return;
            }

            this.el.style.backgroundColor = background;
            this.el.style.color = textColor;

            var root = document.createElement('div');
            root.className = 'splunkstuff-pie-chart-viz';

            if (title) {
                var head = document.createElement('div');
                head.className = 'splunkstuff-pie-chart-viz__title';
                head.textContent = title;
                root.appendChild(head);
            }

            var main = document.createElement('div');
            main.className = 'splunkstuff-pie-chart-viz__main';

            var pieBox = document.createElement('div');
            pieBox.className = 'splunkstuff-pie-chart-viz__pie';
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 200 200');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', 'Pie chart');

            var cx = 100;
            var cy = 100;
            var r = 88;
            var angle = -Math.PI / 2;
            for (i = 0; i < shaped.length; i += 1) {
                var frac = shaped[i].value / total;
                var sweep = frac * Math.PI * 2;
                if (sweep <= 0) {
                    continue;
                }
                appendPieSlice(
                    svg,
                    cx,
                    cy,
                    r,
                    angle,
                    sweep,
                    DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
                    background
                );
                angle += sweep;
            }
            pieBox.appendChild(svg);
            main.appendChild(pieBox);

            var legend = document.createElement('div');
            legend.className = 'splunkstuff-pie-chart-viz__legend';
            for (i = 0; i < shaped.length; i += 1) {
                var pct = ((shaped[i].value / total) * 100).toFixed(1);
                var row = document.createElement('div');
                row.className = 'splunkstuff-pie-chart-viz__legend-row';
                var swatch = document.createElement('span');
                swatch.className = 'splunkstuff-pie-chart-viz__swatch';
                swatch.style.backgroundColor = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
                var text = document.createElement('span');
                text.className = 'splunkstuff-pie-chart-viz__legend-text';
                text.textContent = showPercent
                    ? shaped[i].label + ' — ' + shaped[i].value.toLocaleString() + ' (' + pct + '%)'
                    : shaped[i].label + ' — ' + shaped[i].value.toLocaleString();
                row.appendChild(swatch);
                row.appendChild(text);
                legend.appendChild(row);
            }
            main.appendChild(legend);
            root.appendChild(main);
            this.el.appendChild(root);
        },

        reflow: function () {},

        remove: function () {
            this.el.innerHTML = '';
        },
    });
});
