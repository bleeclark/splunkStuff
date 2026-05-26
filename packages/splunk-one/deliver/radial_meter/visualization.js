/* eslint-disable */
/**
 * Splunk radial meter — based on Splunk Enterprise 9.4 custom viz tutorial
 * (D3 replaced with native SVG; same UX: partial arc dial + center value).
 * https://help.splunk.com/en/splunk-enterprise/developing-views-and-apps-for-splunk-web/9.4/custom-visualizations/build-a-custom-visualization
 */
define(['api/SplunkVisualizationBase', './radialMeterArc'], function (
    SplunkVisualizationBase,
    arc
) {
    var NS = 'display.visualizations.custom.so_BUI_pickulationts.radial_meter.';
    var WIDTH = arc.WIDTH;
    var HEIGHT = arc.HEIGHT;

    function readConfig(config, prop, fallback, viz) {
        if (config == null || typeof config !== 'object') {
            return fallback;
        }
        var ns = NS;
        if (viz && typeof viz.getPropertyNamespaceInfo === 'function') {
            try {
                var info = viz.getPropertyNamespaceInfo();
                if (info && info.propertyNamespace) {
                    ns = info.propertyNamespace;
                }
            } catch (ignoreErr) {
                /* ignore */
            }
        }
        var candidates = [ns + prop, NS + prop, prop];
        var ci;
        for (ci = 0; ci < candidates.length; ci += 1) {
            var v = config[candidates[ci]];
            if (v !== undefined && v !== null && v !== '') {
                return v;
            }
        }
        return fallback;
    }

    function safeColor(raw, fallback) {
        var s = String(raw == null ? '' : raw).trim();
        return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
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

    function parseDatum(raw) {
        if (raw == null || raw === '') {
            return NaN;
        }
        if (typeof raw === 'number' && isFinite(raw)) {
            return raw;
        }
        var n = parseFloat(String(raw).replace(/,/g, ''), 10);
        return isFinite(n) ? n : NaN;
    }

    function appendArcPath(svg, d, fill) {
        if (!d) {
            return;
        }
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', fill);
        svg.appendChild(path);
    }

    function pickNumericDatum(rawData) {
        if (!rawData) {
            return NaN;
        }
        if (rawData.rows && rawData.rows.length > 0 && rawData.rows[0] && rawData.rows[0].length > 0) {
            return parseDatum(rawData.rows[0][0]);
        }
        if (!rawData.columns || !rawData.columns.length) {
            return NaN;
        }
        var c;
        var r;
        for (c = 0; c < rawData.columns.length; c += 1) {
            var col = rawData.columns[c] || [];
            for (r = 0; r < col.length; r += 1) {
                var n = parseDatum(cellValue(col[r]));
                if (isFinite(n)) {
                    return n;
                }
            }
        }
        return NaN;
    }

    return SplunkVisualizationBase.extend({
        initialize: function () {
            this.$el = this.el;
            if (this.el && this.el.classList) {
                this.el.classList.add('splunk-radial-meter');
            }
        },

        getInitialDataParams: function () {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000,
            };
        },

        formatData: function (rawData) {
            if (!rawData) {
                return false;
            }
            var datum = pickNumericDatum(rawData);
            if (!isFinite(datum)) {
                throw new SplunkVisualizationBase.VisualizationError(
                    'This meter only supports numbers (e.g. | stats count).'
                );
            }
            return datum;
        },

        updateView: function (data, config) {
            if (data === false || data == null || !isFinite(data)) {
                return;
            }
            var viz = this;
            var datum = data;
            var mainColor = safeColor(readConfig(config, 'mainColor', '#f7bc38', viz), '#f7bc38');
            var maxValue = parseFloat(readConfig(config, 'maxValue', '100', viz), 10);
            if (!isFinite(maxValue) || maxValue <= 0) {
                maxValue = 100;
            }
            var background = safeColor(readConfig(config, 'backgroundColor', '#ffffff', viz), '#ffffff');
            var paths = arc.buildRadialMeterPaths(datum, maxValue);

            this.el.innerHTML = '';
            this.el.className = 'splunk-radial-meter';

            var wrap = document.createElement('div');
            wrap.className = 'splunk-radial-meter__frame';
            wrap.style.background = background;

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 ' + WIDTH + ' ' + HEIGHT);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', 'Radial meter');
            svg.style.background = background;

            var gInner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gInner.setAttribute('transform', 'translate(' + WIDTH / 2 + ',' + HEIGHT / 2 + ')');

            appendArcPath(gInner, paths.track, '#d3d3d3');
            appendArcPath(gInner, paths.fill, mainColor);

            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'meter-center-text');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', mainColor);
            text.setAttribute('x', '0');
            text.setAttribute('y', '20');
            text.textContent = String(paths.displayValue);
            gInner.appendChild(text);

            svg.appendChild(gInner);
            wrap.appendChild(svg);
            this.el.appendChild(wrap);
        },

        reflow: function () {},

        remove: function () {
            this.el.innerHTML = '';
        },
    });
});
