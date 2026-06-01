/* eslint-disable */
/**
 * Splunk 9.4 radial meter arc geometry (AMD).
 * Keep in sync with src/main/webapp/lib/radialMeterArc.mjs
 */
define(function () {
    var ARC_START = -Math.PI * 0.75;
    var ARC_END = Math.PI * 0.75;
    var INNER_R = 70;
    var OUTER_R = 85;
    var WIDTH = 220;
    var HEIGHT = 220;

    function pointAt(angle, radius) {
        return {
            x: Math.sin(angle) * radius,
            y: -Math.cos(angle) * radius,
        };
    }

    function valueToAngle(value, maxValue) {
        var max = parseFloat(maxValue, 10);
        if (!isFinite(max) || max <= 0) {
            max = 100;
        }
        var t = Math.max(0, Math.min(1, value / max));
        return ARC_START + t * (ARC_END - ARC_START);
    }

    function describeArc(cx, cy, innerR, outerR, startAngle, endAngle) {
        if (endAngle <= startAngle + 1e-6) {
            return '';
        }
        var p1o = pointAt(startAngle, outerR);
        var p2o = pointAt(endAngle, outerR);
        var p1i = pointAt(endAngle, innerR);
        var p2i = pointAt(startAngle, innerR);
        var large = endAngle - startAngle > Math.PI ? 1 : 0;
        return (
            'M' +
            (cx + p1o.x).toFixed(2) +
            ' ' +
            (cy + p1o.y).toFixed(2) +
            ' A' +
            outerR +
            ' ' +
            outerR +
            ' 0 ' +
            large +
            ' 1 ' +
            (cx + p2o.x).toFixed(2) +
            ' ' +
            (cy + p2o.y).toFixed(2) +
            ' L' +
            (cx + p1i.x).toFixed(2) +
            ' ' +
            (cy + p1i.y).toFixed(2) +
            ' A' +
            innerR +
            ' ' +
            innerR +
            ' 0 ' +
            large +
            ' 0 ' +
            (cx + p2i.x).toFixed(2) +
            ' ' +
            (cy + p2i.y).toFixed(2) +
            ' Z'
        );
    }

    function buildRadialMeterPaths(value, maxValue) {
        var max = parseFloat(maxValue, 10);
        if (!isFinite(max) || max <= 0) {
            max = 100;
        }
        var v = Math.max(0, Math.min(parseFloat(value, 10), max));
        var trackStart = valueToAngle(0, max);
        var trackEnd = valueToAngle(max, max);
        var valueEnd = valueToAngle(v, max);
        return {
            track: describeArc(0, 0, INNER_R, OUTER_R, trackStart, trackEnd),
            fill: describeArc(0, 0, INNER_R, OUTER_R, trackStart, valueEnd),
            displayValue: v,
            trackStart: trackStart,
            trackEnd: trackEnd,
            valueEnd: valueEnd,
        };
    }

    return {
        ARC_START: ARC_START,
        ARC_END: ARC_END,
        INNER_R: INNER_R,
        OUTER_R: OUTER_R,
        WIDTH: WIDTH,
        HEIGHT: HEIGHT,
        pointAt: pointAt,
        valueToAngle: valueToAngle,
        describeArc: describeArc,
        buildRadialMeterPaths: buildRadialMeterPaths,
    };
});
