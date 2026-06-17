// ../../node_modules/@splunk/dashboard-studio-extension/dist/chunk-CfYAbeIz.mjs
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
  let target = {};
  for (var name in all) __defProp(target, name, {
    get: all[name],
    enumerable: true
  });
  if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
  return target;
};

// ../../node_modules/@splunk/dashboard-studio-extension/dist/visualization.mjs
var visualization_exports = /* @__PURE__ */ __exportAll({
  addDataSourcesListener: () => addDataSourcesListener,
  addDimensionsListener: () => addDimensionsListener,
  addDrilldownListener: () => addDrilldownListener,
  addErrorListener: () => addErrorListener,
  addModeListener: () => addModeListener,
  addOptionsListener: () => addOptionsListener,
  addThemeListener: () => addThemeListener,
  addTokensListener: () => addTokensListener,
  clearError: () => clearError,
  getDataSources: () => getDataSources,
  getDimensions: () => getDimensions,
  getError: () => getError,
  getMode: () => getMode,
  getOptions: () => getOptions,
  getTheme: () => getTheme,
  getTokens: () => getTokens,
  setError: () => setError,
  setOptions: () => setOptions,
  triggerDrilldown: () => triggerDrilldown
});
var FallbackProxy = new Proxy({}, { get() {
  throw new Error("DashboardExtensionAPI is not available. Make sure to run this code inside a Splunk Dashboard Extension iframe.");
} });
var API = globalThis.DashboardExtensionAPI ?? FallbackProxy;
var addDataSourcesListener = API.addDataSourcesListener;
var getDataSources = API.getDataSources;
var addOptionsListener = API.addOptionsListener;
var getOptions = API.getOptions;
var setOptions = API.setOptions;
var addDimensionsListener = API.addDimensionsListener;
var getDimensions = API.getDimensions;
var addModeListener = API.addModeListener;
var getMode = API.getMode;
var addThemeListener = API.addThemeListener;
var getTheme = API.getTheme;
var addTokensListener = API.addTokensListener;
var getTokens = API.getTokens;
var addDrilldownListener = API.addDrilldownListener;
var triggerDrilldown = API.triggerDrilldown;
var addErrorListener = API.addErrorListener;
var getError = API.getError;
var setError = API.setError;
var clearError = API.clearError;

// visualizations/splunkstuff_kpi_sparkline_studio/src/lib/parsePrimaryData.js
function readFieldsList(searchData) {
  if (searchData && searchData.fields && searchData.fields.length) {
    return searchData.fields;
  }
  if (searchData && searchData.meta && searchData.meta.fields && searchData.meta.fields.length) {
    return searchData.meta.fields;
  }
  return [];
}
function readCellValue(cell) {
  if (cell == null) {
    return cell;
  }
  if (typeof cell === "object" && cell.value != null) {
    return cell.value;
  }
  return cell;
}
function parseNumericCell(cell) {
  const parsed = parseFloat(readCellValue(cell), 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
function readFieldName(fields, columnIndex) {
  if (!fields || columnIndex < 0 || columnIndex >= fields.length) {
    return "";
  }
  const field = fields[columnIndex];
  if (typeof field === "string") {
    return field;
  }
  if (field != null && field.name != null) {
    return String(field.name);
  }
  return "";
}
function findTimeColumnIndex(searchData) {
  const fields = readFieldsList(searchData);
  for (let columnIndex = 0; columnIndex < fields.length; columnIndex += 1) {
    if (readFieldName(fields, columnIndex) === "_time") {
      return columnIndex;
    }
  }
  return -1;
}
function readTimeSortKey(searchData, timeColumnIndex, rowIndex) {
  const cell = readCellValue(searchData.columns[timeColumnIndex][rowIndex]);
  if (cell == null || cell === "") {
    return 0;
  }
  if (typeof cell === "number" && Number.isFinite(cell)) {
    return cell;
  }
  const text = String(cell).trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const numeric = parseFloat(text, 10);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  const parsedMilliseconds = Date.parse(text);
  if (Number.isFinite(parsedMilliseconds)) {
    return parsedMilliseconds / 1e3;
  }
  const fallback = parseFloat(text, 10);
  return Number.isFinite(fallback) ? fallback : 0;
}
function pickNumericColumnIndex(searchData, preferredFieldName) {
  const fields = readFieldsList(searchData);
  if (!searchData || !searchData.columns || !fields.length) {
    return -1;
  }
  if (preferredFieldName) {
    for (let columnIndex = 0; columnIndex < fields.length; columnIndex += 1) {
      if (readFieldName(fields, columnIndex) === preferredFieldName) {
        return columnIndex;
      }
    }
  }
  let bestColumnIndex = -1;
  for (let columnIndex = 0; columnIndex < searchData.columns.length; columnIndex += 1) {
    if (readFieldName(fields, columnIndex) === "_time") {
      continue;
    }
    const column = searchData.columns[columnIndex] || [];
    for (let rowIndex = 0; rowIndex < column.length; rowIndex += 1) {
      if (Number.isFinite(parseNumericCell(column[rowIndex]))) {
        bestColumnIndex = columnIndex;
        break;
      }
    }
  }
  return bestColumnIndex;
}
function buildTimeSortedValuePairs(searchData, valueColumnIndex) {
  const valueColumn = searchData.columns[valueColumnIndex] || [];
  if (!valueColumn.length) {
    return [];
  }
  const rowCount = valueColumn.length;
  const timeColumnIndex = findTimeColumnIndex(searchData);
  const sortedPairs = [];
  if (timeColumnIndex < 0 || !searchData.columns[timeColumnIndex] || searchData.columns[timeColumnIndex].length !== rowCount) {
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const numericValue = parseNumericCell(valueColumn[rowIndex]);
      if (Number.isFinite(numericValue)) {
        sortedPairs.push({ numericValue, timeRaw: null, rowIndex });
      }
    }
    return sortedPairs;
  }
  const timeColumn = searchData.columns[timeColumnIndex];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const numericValue = parseNumericCell(valueColumn[rowIndex]);
    if (!Number.isFinite(numericValue)) {
      continue;
    }
    sortedPairs.push({
      sortKey: readTimeSortKey(searchData, timeColumnIndex, rowIndex),
      numericValue,
      timeRaw: readCellValue(timeColumn[rowIndex]),
      rowIndex
    });
  }
  sortedPairs.sort((left, right) => {
    if (left.sortKey !== right.sortKey) {
      return left.sortKey - right.sortKey;
    }
    return left.rowIndex - right.rowIndex;
  });
  return sortedPairs;
}
function reorderStringColumnByTime(searchData, stringColumnIndex, valueColumnIndex) {
  const sortedPairs = buildTimeSortedValuePairs(searchData, valueColumnIndex);
  const stringColumn = searchData.columns[stringColumnIndex] || [];
  const orderedStrings = [];
  for (let pairIndex = 0; pairIndex < sortedPairs.length; pairIndex += 1) {
    const cell = stringColumn[sortedPairs[pairIndex].rowIndex];
    const raw = readCellValue(cell);
    orderedStrings.push(raw == null ? "" : String(raw).trim());
  }
  return orderedStrings;
}
function buildStringFieldsByTime(searchData, valueColumnIndex) {
  const fields = readFieldsList(searchData);
  const stringFieldsByName = {};
  if (!searchData || !searchData.columns) {
    return stringFieldsByName;
  }
  for (let columnIndex = 0; columnIndex < searchData.columns.length; columnIndex += 1) {
    const fieldName = readFieldName(fields, columnIndex);
    if (!fieldName || fieldName === "_time" || columnIndex === valueColumnIndex) {
      continue;
    }
    stringFieldsByName[fieldName] = reorderStringColumnByTime(searchData, columnIndex, valueColumnIndex);
  }
  return stringFieldsByName;
}
function buildSeriesFromPairs(sortedPairs) {
  const valueSeries = [];
  const timeSeries = [];
  for (let pairIndex = 0; pairIndex < sortedPairs.length; pairIndex += 1) {
    valueSeries.push(sortedPairs[pairIndex].numericValue);
    timeSeries.push(sortedPairs[pairIndex].timeRaw);
  }
  return { valueSeries, timeSeries };
}
function parsePrimarySearchData(searchData, resolvedOptions) {
  if (!searchData || !searchData.columns || searchData.columns.length === 0) {
    return {
      primary: { valueSeries: [], timeSeries: [], valueFieldName: "", stringFieldsByName: {} },
      trellisGroups: []
    };
  }
  const fields = readFieldsList(searchData);
  const valueColumnIndex = pickNumericColumnIndex(searchData, resolvedOptions.majorValueFieldName);
  if (valueColumnIndex < 0) {
    throw new Error("KPI sparkline needs a numeric column (e.g. value) beside _time.");
  }
  const sortedPairs = buildTimeSortedValuePairs(searchData, valueColumnIndex);
  const primarySeries = buildSeriesFromPairs(sortedPairs);
  if (!primarySeries.valueSeries.length) {
    throw new Error("KPI sparkline found a value column but no parseable numbers in results.");
  }
  const primary = {
    valueSeries: primarySeries.valueSeries,
    timeSeries: primarySeries.timeSeries,
    valueFieldName: readFieldName(fields, valueColumnIndex),
    stringFieldsByName: buildStringFieldsByTime(searchData, valueColumnIndex)
  };
  let trellisGroups = [];
  if (resolvedOptions.splitByLayout === "trellis" && resolvedOptions.trellisSplitByField) {
    trellisGroups = buildTrellisGroups(searchData, valueColumnIndex, resolvedOptions.trellisSplitByField);
  }
  return { primary, trellisGroups };
}
function buildTrellisGroups(searchData, valueColumnIndex, splitByFieldName) {
  const fields = readFieldsList(searchData);
  let categoryColumnIndex = -1;
  for (let columnIndex = 0; columnIndex < fields.length; columnIndex += 1) {
    if (readFieldName(fields, columnIndex) === splitByFieldName) {
      categoryColumnIndex = columnIndex;
      break;
    }
  }
  if (categoryColumnIndex < 0 || categoryColumnIndex === valueColumnIndex) {
    return [];
  }
  const rowCount = (searchData.columns[valueColumnIndex] || []).length;
  const groupsByCategory = /* @__PURE__ */ new Map();
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const categoryLabel = String(readCellValue(searchData.columns[categoryColumnIndex][rowIndex]) || "").trim();
    if (!categoryLabel) {
      continue;
    }
    if (!groupsByCategory.has(categoryLabel)) {
      groupsByCategory.set(categoryLabel, {
        categoryLabel,
        rowIndexes: []
      });
    }
    groupsByCategory.get(categoryLabel).rowIndexes.push(rowIndex);
  }
  const trellisGroups = [];
  groupsByCategory.forEach((group) => {
    const subsetData = {
      fields: searchData.fields,
      columns: searchData.columns.map(
        (column) => group.rowIndexes.map((rowIndex) => column[rowIndex])
      )
    };
    const sortedPairs = buildTimeSortedValuePairs(subsetData, valueColumnIndex);
    const series = buildSeriesFromPairs(sortedPairs);
    if (series.valueSeries.length) {
      trellisGroups.push({
        categoryLabel: group.categoryLabel,
        valueSeries: series.valueSeries,
        timeSeries: series.timeSeries,
        valueFieldName: readFieldName(fields, valueColumnIndex),
        stringFieldsByName: buildStringFieldsByTime(subsetData, valueColumnIndex)
      });
    }
  });
  return trellisGroups;
}

// visualizations/splunkstuff_kpi_sparkline_studio/src/lib/booleanParsing.js
function parseTruthyOption(raw) {
  const normalized = String(raw == null ? "" : raw).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
function sanitizeHexColor(raw, fallbackColor) {
  const candidate = String(raw == null ? "" : raw).trim();
  return /^#[0-9A-Fa-f]{6}$/.test(candidate) ? candidate : fallbackColor;
}
function clampNumber(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

// visualizations/splunkstuff_kpi_sparkline_studio/src/lib/resolveOptions.js
function readOptionString(rawOptions, ...keys) {
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const key = keys[keyIndex];
    if (rawOptions[key] !== void 0 && rawOptions[key] !== null && String(rawOptions[key]).trim() !== "") {
      return String(rawOptions[key]).trim();
    }
  }
  return "";
}
function readOptionNumber(rawOptions, keys, fallbackNumber) {
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const key = keys[keyIndex];
    if (rawOptions[key] !== void 0 && rawOptions[key] !== null && String(rawOptions[key]).trim() !== "") {
      const parsed = parseFloat(rawOptions[key], 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallbackNumber;
}
function readOptionBoolean(rawOptions, keys, fallbackBoolean) {
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const key = keys[keyIndex];
    if (rawOptions[key] !== void 0 && rawOptions[key] !== null) {
      return parseTruthyOption(rawOptions[key]);
    }
  }
  return fallbackBoolean;
}
function resolveTrendDisplayMode(rawOptions) {
  const trendDisplay = readOptionString(rawOptions, "trendDisplay").toLowerCase();
  if (trendDisplay === "off") {
    return { showTrendDelta: false, trendDisplayMode: "absolute" };
  }
  if (trendDisplay === "percent") {
    return { showTrendDelta: true, trendDisplayMode: "percent" };
  }
  if (trendDisplay === "absolute") {
    return { showTrendDelta: true, trendDisplayMode: "absolute" };
  }
  const legacyShowDelta = readOptionBoolean(rawOptions, ["showDelta"], true);
  const legacyDeltaMode = readOptionString(rawOptions, "deltaMode", "absolute").toLowerCase();
  return {
    showTrendDelta: legacyShowDelta,
    trendDisplayMode: legacyDeltaMode === "percent" ? "percent" : "absolute"
  };
}
function resolveSubheaderStyle(rawOptions) {
  const explicitStyle = readOptionString(rawOptions, "subheaderStyle").toLowerCase();
  if (explicitStyle) {
    return explicitStyle;
  }
  return readOptionBoolean(rawOptions, ["subheaderMatchTile"], true) ? "matchtile" : "overlay";
}
function resolveOptions(rawOptions) {
  const trendDisplay = resolveTrendDisplayMode(rawOptions || {});
  const numberPrecision = readOptionNumber(
    rawOptions || {},
    ["numberPrecision", "precision"],
    2
  );
  const sparklineStrokeColor = readOptionString(rawOptions, "sparklineStrokeColor", "sparkStroke") || "#FFFFFF";
  const sparklineAreaColor = readOptionString(rawOptions, "sparklineAreaColor") || sparklineStrokeColor;
  return {
    // --- Layout ---
    align: readOptionString(rawOptions, "align", "center").toLowerCase() || "center",
    headlineLayout: readOptionString(rawOptions, "headlineLayout", "stacked").toLowerCase() || "stacked",
    labelPosition: readOptionString(rawOptions, "labelPosition", "above").toLowerCase() || "above",
    subheaderStyle: resolveSubheaderStyle(rawOptions || {}),
    sparkEdgeToEdge: readOptionBoolean(rawOptions, ["sparkEdgeToEdge"], false),
    sparklineDisplay: readOptionString(rawOptions, "sparklineDisplay", "below").toLowerCase() || "below",
    // --- Spark scale ---
    sparkScaleMinimum: readOptionString(rawOptions, "sparkMin"),
    sparkScaleMaximum: readOptionString(rawOptions, "sparkMax"),
    autoScaleSparkline: readOptionBoolean(rawOptions, ["sparkAuto"], false),
    // --- Trend colors ---
    upTrendColor: readOptionString(rawOptions, "goodColor") || "#01417F",
    downTrendColor: readOptionString(rawOptions, "badColor") || "#DFA611",
    invertTrendDirection: readOptionBoolean(rawOptions, ["invertTrend"], false),
    defaultTextColor: readOptionString(rawOptions, "textColor") || "#FFFFFF",
    emptyStateBackgroundColor: readOptionString(rawOptions, "background") || "#0B1F3B",
    tileBackgroundColorOverride: readOptionString(rawOptions, "backgroundColor"),
    subheaderText: readOptionString(rawOptions, "subheader"),
    unitText: readOptionString(rawOptions, "unit"),
    unitPosition: readOptionString(rawOptions, "unitPosition", "after").toLowerCase() || "after",
    numberPrecision,
    showTrendDelta: trendDisplay.showTrendDelta,
    trendDisplayMode: trendDisplay.trendDisplayMode,
    // --- Sparkline appearance ---
    showSparkline: readOptionBoolean(rawOptions, ["showSparkline"], true),
    sparklineStrokeColor,
    sparklineStrokeWidth: readOptionNumber(rawOptions, ["sparkStrokeWidth"], 2),
    showSparklineAreaFill: readOptionBoolean(rawOptions, ["showSparklineAreaGraph"], false),
    sparklineAreaColor,
    sparklineNullValueDisplay: readOptionString(rawOptions, "sparklineNullValueDisplay", "gaps").toLowerCase() || "gaps",
    sparklineHighlightDotCount: readOptionNumber(rawOptions, ["sparklineHighlightDots"], 0),
    sparklineHighlightSegmentCount: readOptionNumber(rawOptions, ["sparklineHighlightSegments"], 0),
    // --- Search-driven annotations (see parsePrimaryData stringFieldsByName) ---
    annotationFieldName: readOptionString(rawOptions, "annotationField", "annotation"),
    showAnnotationOnHover: readOptionBoolean(rawOptions, ["showAnnotationHover"], true),
    showAnnotationOnSpark: readOptionBoolean(rawOptions, ["showAnnotationLabels"], false),
    // --- Targets and thresholds ---
    showTargetLine: readOptionBoolean(rawOptions, ["showTarget"], false),
    targetValue: readOptionNumber(rawOptions, ["target"], 50),
    showThresholdBand: readOptionBoolean(rawOptions, ["showThresholdBand"], false),
    thresholdMinimum: readOptionNumber(rawOptions, ["thresholdMin"], 20),
    thresholdMaximum: readOptionNumber(rawOptions, ["thresholdMax"], 80),
    // --- Hover / interaction ---
    showSparklineTooltip: readOptionBoolean(
      rawOptions,
      ["showSparklineTooltip", "showHover"],
      true
    ),
    showInChartHoverAnnotation: readOptionBoolean(rawOptions, ["showHoverAnnotation"], true),
    tooltipPrefix: readOptionString(rawOptions, "tooltipPrefix"),
    // --- Static labels ---
    majorLabelText: readOptionString(rawOptions, "majorLabel"),
    deltaLabelText: readOptionString(rawOptions, "deltaLabel"),
    badgeStatusText: readOptionString(rawOptions, "badgeText"),
    underLabelText: readOptionString(rawOptions, "underLabel"),
    sparkPointLabelsRaw: readOptionString(rawOptions, "sparkPointLabels"),
    showSparkPointLabels: readOptionBoolean(rawOptions, ["showPointLabels"], false),
    emptyStateMessage: readOptionString(
      rawOptions,
      "emptyText",
      "No numeric results to display."
    ),
    // --- Single Value typography overrides ---
    majorColor: readOptionString(rawOptions, "majorColor"),
    majorFontSize: readOptionNumber(rawOptions, ["majorFontSize"], 0),
    majorValueOverride: rawOptions?.majorValue,
    majorValueDisplayOverride: rawOptions?.majorValueDisplay,
    majorValueFieldName: readOptionString(rawOptions, "majorValueField"),
    shouldAbbreviateMajorValue: readOptionBoolean(rawOptions, ["shouldAbbreviateMajorValue"], false),
    shouldAbbreviateTrendValue: readOptionBoolean(rawOptions, ["shouldAbbreviateTrendValue"], false),
    shouldUseThousandSeparators: readOptionBoolean(rawOptions, ["shouldUseThousandSeparators"], true),
    trendColor: readOptionString(rawOptions, "trendColor"),
    trendFontSize: readOptionNumber(rawOptions, ["trendFontSize"], 0),
    trendValueOverride: rawOptions?.trendValue,
    underLabelColor: readOptionString(rawOptions, "underLabelColor"),
    underLabelFontSize: readOptionNumber(rawOptions, ["underLabelFontSize"], 12),
    sparklineValuesOverride: rawOptions?.sparklineValues,
    // --- Trellis ---
    splitByLayout: readOptionString(rawOptions, "splitByLayout", "off").toLowerCase() || "off",
    trellisSplitByField: readOptionString(rawOptions, "trellisSplitBy"),
    trellisBackgroundColor: readOptionString(rawOptions, "trellisBackgroundColor"),
    trellisColumnCount: readOptionNumber(rawOptions, ["trellisColumns"], 0),
    trellisMinimumColumnWidth: readOptionNumber(rawOptions, ["trellisMinColumnWidth"], 100),
    trellisPageSize: readOptionNumber(rawOptions, ["trellisPageCount"], 20),
    trellisRowHeight: readOptionNumber(rawOptions, ["trellisRowHeight"], 70),
    trellisSortBy: readOptionString(rawOptions, "trellisSortBy", "result").toLowerCase() || "result",
    trellisSortOrder: readOptionString(rawOptions, "trellisSortOrder", "ascending").toLowerCase() || "ascending"
  };
}

// visualizations/splunkstuff_kpi_sparkline_studio/src/lib/trendColors.js
function calculateTrendDelta(valueSeries) {
  if (!valueSeries || !valueSeries.length) {
    return Number.NaN;
  }
  const pointCount = valueSeries.length;
  const lastValue = Number(valueSeries[pointCount - 1]);
  const previousValue = pointCount > 1 ? Number(valueSeries[pointCount - 2]) : lastValue;
  if (!Number.isFinite(lastValue) || !Number.isFinite(previousValue)) {
    return Number.NaN;
  }
  return lastValue - previousValue;
}
function resolveTrendTileColor(trendDeltaValue, upTrendColor, downTrendColor, invertTrendDirection) {
  const downTrendIsPositive = parseTruthyOption(invertTrendDirection);
  if (!Number.isFinite(trendDeltaValue)) {
    return upTrendColor;
  }
  if (trendDeltaValue < 0) {
    return downTrendIsPositive ? upTrendColor : downTrendColor;
  }
  return downTrendIsPositive ? downTrendColor : upTrendColor;
}

// visualizations/splunkstuff_kpi_sparkline_studio/src/lib/formatters.js
function deriveSparkScale(valueSeries, sparkScaleMinimum, sparkScaleMaximum, autoScaleSparkline) {
  if (parseTruthyOption(autoScaleSparkline)) {
    let dataMinimum = Infinity;
    let dataMaximum = -Infinity;
    for (let pointIndex = 0; pointIndex < valueSeries.length; pointIndex += 1) {
      const numericValue = Number(valueSeries[pointIndex]);
      if (!Number.isFinite(numericValue)) {
        continue;
      }
      if (numericValue < dataMinimum) {
        dataMinimum = numericValue;
      }
      if (numericValue > dataMaximum) {
        dataMaximum = numericValue;
      }
    }
    if (!Number.isFinite(dataMinimum) || !Number.isFinite(dataMaximum)) {
      return { scaleMinimum: 0, scaleMaximum: 100 };
    }
    if (dataMinimum === dataMaximum) {
      dataMaximum = dataMinimum + 1;
    }
    return { scaleMinimum: dataMinimum, scaleMaximum: dataMaximum };
  }
  let scaleMinimum = parseFloat(sparkScaleMinimum, 10);
  let scaleMaximum = parseFloat(sparkScaleMaximum, 10);
  if (!Number.isFinite(scaleMinimum)) {
    scaleMinimum = 0;
  }
  if (!Number.isFinite(scaleMaximum)) {
    scaleMaximum = 100;
  }
  if (scaleMinimum > scaleMaximum) {
    const swapped = scaleMinimum;
    scaleMinimum = scaleMaximum;
    scaleMaximum = swapped;
  }
  if (scaleMaximum <= scaleMinimum) {
    scaleMaximum = scaleMinimum + 1;
  }
  return { scaleMinimum, scaleMaximum };
}
function normalizeTimeColumn(rawTimeSeries, pointCount) {
  const timeSeries = Array.isArray(rawTimeSeries) ? rawTimeSeries.slice(0, pointCount) : [];
  const epochMilliseconds = [];
  let parseableTimeCount = 0;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const timeValue = timeSeries[pointIndex];
    if (typeof timeValue === "string") {
      const parsedMilliseconds = Date.parse(timeValue);
      if (Number.isFinite(parsedMilliseconds)) {
        epochMilliseconds.push(parsedMilliseconds);
        parseableTimeCount += 1;
        continue;
      }
    }
    if (typeof timeValue === "number" && Number.isFinite(timeValue)) {
      if (timeValue > 31536e6) {
        epochMilliseconds.push(timeValue);
      } else if (timeValue > 31536e3) {
        epochMilliseconds.push(timeValue * 1e3);
      } else {
        epochMilliseconds.push(null);
      }
      if (epochMilliseconds[pointIndex] != null) {
        parseableTimeCount += 1;
      }
      continue;
    }
    epochMilliseconds.push(null);
  }
  return {
    epochMilliseconds,
    hasReliableTimes: parseableTimeCount >= Math.max(2, Math.floor(pointCount * 0.5))
  };
}
function formatHoverTimeLabel(timeSeries, normalizedTimes, pointIndex) {
  if (normalizedTimes.hasReliableTimes && normalizedTimes.epochMilliseconds[pointIndex] != null) {
    return new Date(normalizedTimes.epochMilliseconds[pointIndex]).toLocaleString(void 0, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  if (timeSeries[pointIndex] == null) {
    return "";
  }
  return String(timeSeries[pointIndex]);
}
function abbreviateMagnitude(numericValue, precision) {
  const absolute = Math.abs(numericValue);
  if (absolute >= 1e9) {
    return `${(numericValue / 1e9).toFixed(precision)}B`;
  }
  if (absolute >= 1e6) {
    return `${(numericValue / 1e6).toFixed(precision)}M`;
  }
  if (absolute >= 1e3) {
    return `${(numericValue / 1e3).toFixed(precision)}K`;
  }
  return numericValue.toFixed(precision);
}
function formatNumericCore(numericValue, precision, useThousandSeparators, abbreviate) {
  if (!Number.isFinite(numericValue)) {
    return "\u2014";
  }
  const decimalPlaces = Number.isFinite(precision) && precision >= 0 ? precision : 2;
  if (abbreviate) {
    return abbreviateMagnitude(numericValue, Math.min(2, decimalPlaces));
  }
  if (useThousandSeparators) {
    return numericValue.toLocaleString(void 0, {
      maximumFractionDigits: decimalPlaces,
      minimumFractionDigits: 0
    });
  }
  return numericValue.toFixed(decimalPlaces);
}
function formatMajorValue(numericValue, resolvedOptions, unitTextOverride) {
  const unitText = unitTextOverride != null ? unitTextOverride : resolvedOptions.unitText;
  const formattedCore = formatNumericCore(
    numericValue,
    resolvedOptions.numberPrecision,
    resolvedOptions.shouldUseThousandSeparators,
    resolvedOptions.shouldAbbreviateMajorValue
  );
  if (!unitText) {
    return formattedCore;
  }
  if (resolvedOptions.unitPosition === "before") {
    return `${unitText}${formattedCore}`;
  }
  return `${formattedCore}${unitText}`;
}
function formatTrendDeltaValue(trendDeltaValue, lastValue, resolvedOptions) {
  if (!Number.isFinite(trendDeltaValue)) {
    return "\u2014";
  }
  const decimalPlaces = resolvedOptions.numberPrecision;
  const trendArrow = trendDeltaValue >= 0 ? "\u25B2 " : "\u25BC ";
  if (resolvedOptions.trendDisplayMode === "percent" && Number.isFinite(lastValue) && lastValue !== 0) {
    const percentChange = trendDeltaValue / Math.abs(lastValue) * 100;
    const formattedPercent = resolvedOptions.shouldAbbreviateTrendValue ? abbreviateMagnitude(percentChange, Math.min(2, decimalPlaces)) : formatNumericCore(
      percentChange,
      decimalPlaces,
      resolvedOptions.shouldUseThousandSeparators,
      false
    );
    return `${trendArrow}${formattedPercent}%`;
  }
  const formattedDelta = formatNumericCore(
    trendDeltaValue,
    decimalPlaces,
    resolvedOptions.shouldUseThousandSeparators,
    resolvedOptions.shouldAbbreviateTrendValue
  );
  return `${trendArrow}${formattedDelta}`;
}
function formatHoverTooltipValue(numericValue, precision, tooltipPrefix) {
  const formattedCore = formatNumericCore(numericValue, precision, true, false);
  const prefixText = String(tooltipPrefix || "").trim();
  if (prefixText.toLowerCase() === "value") {
    return formattedCore;
  }
  return prefixText ? `${prefixText} ${formattedCore}` : formattedCore;
}
function parseSparkPointLabelMap(rawLabelPairs) {
  const labelByPointIndex = {};
  const labelText = String(rawLabelPairs == null ? "" : rawLabelPairs).trim();
  if (!labelText) {
    return labelByPointIndex;
  }
  const pairSegments = labelText.split(/[,;]+/);
  for (let segmentIndex = 0; segmentIndex < pairSegments.length; segmentIndex += 1) {
    const segment = pairSegments[segmentIndex].trim();
    if (!segment) {
      continue;
    }
    const colonIndex = segment.indexOf(":");
    if (colonIndex < 0) {
      continue;
    }
    const pointIndex = parseInt(segment.slice(0, colonIndex), 10);
    const label = segment.slice(colonIndex + 1).trim();
    if (Number.isFinite(pointIndex) && pointIndex >= 0 && label) {
      labelByPointIndex[pointIndex] = label;
    }
  }
  return labelByPointIndex;
}

// visualizations/splunkstuff_kpi_sparkline_studio/src/lib/sparkMath.js
function sparkPointCoordinates(valueSeries, pointIndex, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, scaleMinimum, scaleMaximum) {
  const pointCount = valueSeries.length;
  const innerWidth = Math.max(1, width - paddingLeft - paddingRight);
  const innerHeight = Math.max(1, height - paddingTop - paddingBottom);
  const horizontalStep = pointCount > 1 ? innerWidth / (pointCount - 1) : 0;
  const numericValue = Number(valueSeries[pointIndex]);
  const valueRatio = (numericValue - scaleMinimum) / (scaleMaximum - scaleMinimum);
  const clampedRatio = Math.max(0, Math.min(1, valueRatio));
  return {
    x: paddingLeft + pointIndex * horizontalStep,
    y: paddingTop + innerHeight - clampedRatio * innerHeight,
    horizontalStep
  };
}
function valueToVerticalPosition(value, height, paddingTop, paddingBottom, scaleMinimum, scaleMaximum) {
  const innerHeight = Math.max(1, height - paddingTop - paddingBottom);
  const valueRatio = (value - scaleMinimum) / (scaleMaximum - scaleMinimum);
  const clampedRatio = Math.max(0, Math.min(1, valueRatio));
  return paddingTop + innerHeight - clampedRatio * innerHeight;
}
function prepareRenderableValues(valueSeries, nullValueDisplay) {
  const renderableValues = [];
  for (let pointIndex = 0; pointIndex < valueSeries.length; pointIndex += 1) {
    const numericValue = Number(valueSeries[pointIndex]);
    if (Number.isFinite(numericValue)) {
      renderableValues.push({ pointIndex, numericValue });
      continue;
    }
    if (nullValueDisplay === "zero") {
      renderableValues.push({ pointIndex, numericValue: 0 });
    }
  }
  return renderableValues;
}
function buildSparklineStrokePath(valueSeries, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, scaleMinimum, scaleMaximum, nullValueDisplay) {
  const renderableValues = prepareRenderableValues(valueSeries, nullValueDisplay);
  if (renderableValues.length < 2) {
    return "";
  }
  const innerWidth = Math.max(1, width - paddingLeft - paddingRight);
  const innerHeight = Math.max(1, height - paddingTop - paddingBottom);
  const pointCount = valueSeries.length;
  const horizontalStep = innerWidth / (pointCount - 1);
  const pathSegments = [];
  let startedPath = false;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const numericValue = Number(valueSeries[pointIndex]);
    const hasValue = Number.isFinite(numericValue) || nullValueDisplay === "zero" && valueSeries[pointIndex] == null;
    if (!hasValue) {
      if (nullValueDisplay !== "connect") {
        startedPath = false;
      }
      continue;
    }
    const plotValue = Number.isFinite(numericValue) ? numericValue : 0;
    const valueRatio = (plotValue - scaleMinimum) / (scaleMaximum - scaleMinimum);
    const clampedRatio = Math.max(0, Math.min(1, valueRatio));
    const x = paddingLeft + pointIndex * horizontalStep;
    const y = paddingTop + innerHeight - clampedRatio * innerHeight;
    pathSegments.push(`${startedPath ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    startedPath = true;
  }
  return pathSegments.join(" ");
}
function buildSparklineAreaPath(valueSeries, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, scaleMinimum, scaleMaximum, nullValueDisplay) {
  const strokePath = buildSparklineStrokePath(
    valueSeries,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    scaleMinimum,
    scaleMaximum,
    nullValueDisplay
  );
  if (!strokePath) {
    return "";
  }
  const baselineY = height - paddingBottom;
  const firstPoint = strokePath.match(/M([\d.]+)\s+([\d.]+)/);
  const lastPointMatches = strokePath.match(/L([\d.]+)\s+([\d.]+)/g);
  if (!firstPoint || !lastPointMatches || !lastPointMatches.length) {
    return "";
  }
  const lastMatch = lastPointMatches[lastPointMatches.length - 1];
  const lastCoords = lastMatch.match(/L([\d.]+)\s+([\d.]+)/);
  const lastX = lastCoords[1];
  return `${strokePath} L${lastX} ${baselineY.toFixed(1)} L${firstPoint[1]} ${baselineY.toFixed(1)} Z`;
}
function sparkPointIndexFromPointer(clientX, sparkContainer, paddingLeft, paddingRight, svgWidth, pointCount) {
  const containerRect = sparkContainer.getBoundingClientRect();
  if (containerRect.width <= 0 || pointCount < 2) {
    return null;
  }
  const relativeX = (clientX - containerRect.left) / containerRect.width;
  const svgX = relativeX * svgWidth;
  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const pointIndex = Math.round((svgX - paddingLeft) / (innerWidth / (pointCount - 1)));
  return clampNumber(pointIndex, 0, pointCount - 1);
}
function measureSparkContainerSize(sparkContainer) {
  const containerRect = sparkContainer.getBoundingClientRect();
  return {
    width: Math.max(1, Math.round(containerRect.width) || sparkContainer.clientWidth || 360),
    height: Math.max(1, Math.round(containerRect.height) || sparkContainer.clientHeight || 46)
  };
}
function sizeSparkSvgElement(svgElement, width, height) {
  svgElement.setAttribute("preserveAspectRatio", "none");
  svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svgElement.setAttribute("width", String(width));
  svgElement.setAttribute("height", String(height));
  svgElement.style.width = `${width}px`;
  svgElement.style.height = `${height}px`;
  svgElement.style.overflow = "visible";
  svgElement.style.display = "block";
}

// visualizations/splunkstuff_kpi_sparkline_studio/src/lib/renderTile.js
var VIZ_BUILD = "20260602-kpi-sparkline-studio-comments";
function applyIndicatorLabelStyles(labelElement, textColor) {
  labelElement.style.display = "block";
  labelElement.style.fontSize = "13px";
  labelElement.style.fontWeight = "700";
  labelElement.style.lineHeight = "1.2";
  labelElement.style.color = textColor;
  labelElement.style.textShadow = "0 1px 2px rgba(0,0,0,0.35)";
  labelElement.style.padding = "2px 8px";
  labelElement.style.borderRadius = "3px";
  labelElement.style.background = "rgba(0,0,0,0.28)";
  labelElement.style.marginBottom = "2px";
  labelElement.style.textAlign = "center";
}
function appendLabelValuePair(containerElement, valueElement, labelText, textColor, labelPosition) {
  const position = labelPosition === "right" ? "right" : "above";
  const pairElement = document.createElement("div");
  pairElement.className = `splunkstuff-sparkline-value-viz__indicatorPair splunkstuff-sparkline-value-viz__indicatorPair--${position}`;
  function createLabelElement() {
    const labelElement = document.createElement("div");
    labelElement.className = "splunkstuff-sparkline-value-viz__indicatorLabel";
    labelElement.textContent = labelText;
    applyIndicatorLabelStyles(labelElement, textColor);
    if (position === "right") {
      labelElement.style.marginBottom = "0";
    }
    return labelElement;
  }
  if (position === "right") {
    pairElement.appendChild(valueElement);
    if (labelText) {
      pairElement.appendChild(createLabelElement());
    }
  } else {
    if (labelText) {
      pairElement.appendChild(createLabelElement());
    }
    pairElement.appendChild(valueElement);
  }
  containerElement.appendChild(pairElement);
}
function applySubheaderBarStyles(headerElement, subheaderStyle, tileBackgroundColor, upTrendColor, textColor) {
  const styleName = String(subheaderStyle || "matchtile").toLowerCase();
  let headerBackgroundColor = "rgba(0,0,0,0.52)";
  if (styleName === "matchtile") {
    headerBackgroundColor = tileBackgroundColor;
    headerElement.className += " splunkstuff-sparkline-value-viz__header--matchTile";
  } else if (styleName === "darkblue") {
    headerBackgroundColor = upTrendColor;
    headerElement.className += " splunkstuff-sparkline-value-viz__header--darkBlue";
  } else {
    headerElement.className += " splunkstuff-sparkline-value-viz__header--overlay";
  }
  headerElement.style.setProperty("background", headerBackgroundColor, "important");
  headerElement.style.setProperty("color", textColor, "important");
}
function clearSparkHoverState(sparkContainer, tooltipElement, hoverAnnotationElement) {
  if (sparkContainer) {
    const existingOverlay = sparkContainer.querySelector(".splunkstuff-sparkline-value-viz__hoverOverlay");
    if (existingOverlay && existingOverlay.parentNode) {
      existingOverlay.parentNode.removeChild(existingOverlay);
    }
  }
  if (tooltipElement) {
    tooltipElement.style.display = "none";
  }
  if (hoverAnnotationElement) {
    hoverAnnotationElement.style.display = "none";
    hoverAnnotationElement.textContent = "";
  }
}
function updateSparkHoverState(sparkContainer, tooltipElement, ownerDocument, hoverState) {
  clearSparkHoverState(sparkContainer, tooltipElement, hoverState.hoverAnnotationElement);
  const containerRect = sparkContainer.getBoundingClientRect();
  const drawWidth = Math.max(1, containerRect.width);
  const drawHeight = Math.max(1, containerRect.height);
  const pixelX = hoverState.hoverPointX / hoverState.svgWidth * drawWidth;
  const pixelY = hoverState.hoverPointY / hoverState.svgHeight * drawHeight;
  const topPixel = hoverState.paddingTop / hoverState.svgHeight * drawHeight;
  const bottomPixel = drawHeight - hoverState.paddingBottom / hoverState.svgHeight * drawHeight;
  const overlayElement = ownerDocument.createElement("div");
  overlayElement.className = "splunkstuff-sparkline-value-viz__hoverOverlay";
  overlayElement.setAttribute("aria-hidden", "true");
  const lineElement = ownerDocument.createElement("div");
  lineElement.className = "splunkstuff-sparkline-value-viz__hoverLine";
  lineElement.style.left = `${pixelX.toFixed(1)}px`;
  lineElement.style.top = `${topPixel.toFixed(1)}px`;
  lineElement.style.height = `${Math.max(0, bottomPixel - topPixel).toFixed(1)}px`;
  overlayElement.appendChild(lineElement);
  const dotElement = ownerDocument.createElement("div");
  dotElement.className = "splunkstuff-sparkline-value-viz__hoverDot";
  dotElement.style.left = `${(pixelX - 4).toFixed(1)}px`;
  dotElement.style.top = `${(pixelY - 4).toFixed(1)}px`;
  dotElement.style.background = hoverState.sparklineStrokeColor;
  overlayElement.appendChild(dotElement);
  sparkContainer.appendChild(overlayElement);
  const valueLabel = formatHoverTooltipValue(
    hoverState.pointValue,
    hoverState.numberPrecision,
    hoverState.tooltipPrefix
  );
  const tooltipLines = [];
  if (hoverState.annotationLabel) {
    tooltipLines.push(hoverState.annotationLabel);
  }
  if (hoverState.pointLabel && hoverState.pointLabel !== hoverState.annotationLabel) {
    tooltipLines.push(hoverState.pointLabel);
  }
  tooltipLines.push(valueLabel);
  if (hoverState.timeLabel) {
    tooltipLines.push(hoverState.timeLabel);
  }
  tooltipElement.textContent = "";
  const valueLineIndex = tooltipLines.indexOf(valueLabel);
  for (let lineIndex = 0; lineIndex < tooltipLines.length; lineIndex += 1) {
    const rowElement = ownerDocument.createElement("div");
    rowElement.className = lineIndex < valueLineIndex ? "splunkstuff-sparkline-value-viz__tooltipPoint" : lineIndex === valueLineIndex ? "splunkstuff-sparkline-value-viz__tooltipValue" : "splunkstuff-sparkline-value-viz__tooltipTime";
    rowElement.textContent = tooltipLines[lineIndex];
    tooltipElement.appendChild(rowElement);
  }
  tooltipElement.style.display = "block";
  tooltipElement.style.position = "fixed";
  tooltipElement.style.zIndex = "2147483646";
  tooltipElement.style.left = `${hoverState.clientX}px`;
  tooltipElement.style.top = `${hoverState.clientY}px`;
  tooltipElement.style.transform = "translate(-50%, calc(-100% - 8px))";
  const bodyElement = ownerDocument.body || ownerDocument.documentElement;
  if (bodyElement && tooltipElement.parentNode !== bodyElement) {
    bodyElement.appendChild(tooltipElement);
  }
  if (hoverState.showInChartHoverAnnotation && hoverState.hoverAnnotationElement) {
    hoverState.hoverAnnotationElement.textContent = tooltipLines.join(" \u2014 ");
    hoverState.hoverAnnotationElement.style.display = "block";
  }
}
function drawSparkPointLabel(svgElement, valueSeries, pointIndex, labelText, svgWidth, svgHeight, paddingLeft, paddingRight, paddingTop, paddingBottom, scaleMinimum, scaleMaximum, sparklineStrokeColor) {
  const coordinates = sparkPointCoordinates(
    valueSeries,
    pointIndex,
    svgWidth,
    svgHeight,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    scaleMinimum,
    scaleMaximum
  );
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", coordinates.x.toFixed(1));
  marker.setAttribute("cy", coordinates.y.toFixed(1));
  marker.setAttribute("r", "3");
  marker.setAttribute("fill", sparklineStrokeColor);
  svgElement.appendChild(marker);
  const labelElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
  labelElement.setAttribute("x", coordinates.x.toFixed(1));
  labelElement.setAttribute("y", String(Math.max(10, coordinates.y - 7)));
  labelElement.setAttribute("fill", "rgba(255,255,255,0.9)");
  labelElement.setAttribute("font-size", "9");
  labelElement.setAttribute("font-weight", "700");
  if (coordinates.x <= paddingLeft + 2) {
    labelElement.setAttribute("text-anchor", "start");
    labelElement.setAttribute("dx", "2");
  } else if (coordinates.x >= svgWidth - paddingRight - 2) {
    labelElement.setAttribute("text-anchor", "end");
    labelElement.setAttribute("dx", "-2");
  } else {
    labelElement.setAttribute("text-anchor", "middle");
  }
  labelElement.textContent = labelText;
  svgElement.appendChild(labelElement);
}
function paintSparkline(sparkContainer, seriesData, resolvedOptions, sparklineStrokeColor, scale, ownerDocument, hoverAnnotationElement, sharedHover) {
  sparkContainer.innerHTML = "";
  const valueSeries = seriesData.valueSeries;
  const pointCount = valueSeries.length;
  function renderSparkSvg(deferredPass) {
    const measuredSize = measureSparkContainerSize(sparkContainer);
    if (measuredSize.width < 2 && !deferredPass) {
      const animationWindow = ownerDocument.defaultView || window;
      if (animationWindow && typeof animationWindow.requestAnimationFrame === "function") {
        animationWindow.requestAnimationFrame(() => renderSparkSvg(true));
      }
      return;
    }
    const paddingLeft = resolvedOptions.sparkEdgeToEdge ? 0 : 34;
    const paddingRight = resolvedOptions.sparkEdgeToEdge ? 0 : 34;
    const paddingTop = 14;
    const paddingBottom = 6;
    const svgWidth = measuredSize.width;
    const svgHeight = measuredSize.height;
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sizeSparkSvgElement(svgElement, svgWidth, svgHeight);
    if (resolvedOptions.showThresholdBand) {
      const bandTop = valueToVerticalPosition(
        resolvedOptions.thresholdMaximum,
        svgHeight,
        paddingTop,
        paddingBottom,
        scale.scaleMinimum,
        scale.scaleMaximum
      );
      const bandBottom = valueToVerticalPosition(
        resolvedOptions.thresholdMinimum,
        svgHeight,
        paddingTop,
        paddingBottom,
        scale.scaleMinimum,
        scale.scaleMaximum
      );
      const thresholdBand = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      thresholdBand.setAttribute("x", String(paddingLeft));
      thresholdBand.setAttribute("y", String(Math.min(bandTop, bandBottom)));
      thresholdBand.setAttribute("width", String(svgWidth - paddingLeft - paddingRight));
      thresholdBand.setAttribute("height", String(Math.abs(bandBottom - bandTop)));
      thresholdBand.setAttribute("fill", "rgba(0,0,0,0.18)");
      svgElement.appendChild(thresholdBand);
    }
    if (resolvedOptions.showTargetLine && Number.isFinite(resolvedOptions.targetValue)) {
      const targetY = valueToVerticalPosition(
        resolvedOptions.targetValue,
        svgHeight,
        paddingTop,
        paddingBottom,
        scale.scaleMinimum,
        scale.scaleMaximum
      );
      const targetLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      targetLine.setAttribute("x1", String(paddingLeft));
      targetLine.setAttribute("x2", String(svgWidth - paddingRight));
      targetLine.setAttribute("y1", String(targetY));
      targetLine.setAttribute("y2", String(targetY));
      targetLine.setAttribute("stroke", "rgba(255,255,255,0.55)");
      targetLine.setAttribute("stroke-width", "1");
      targetLine.setAttribute("stroke-dasharray", "4 3");
      svgElement.appendChild(targetLine);
    }
    if (resolvedOptions.showSparklineAreaFill) {
      const areaPathData = buildSparklineAreaPath(
        valueSeries,
        svgWidth,
        svgHeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        scale.scaleMinimum,
        scale.scaleMaximum,
        resolvedOptions.sparklineNullValueDisplay
      );
      if (areaPathData) {
        const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        areaPath.setAttribute("d", areaPathData);
        areaPath.setAttribute("fill", resolvedOptions.sparklineAreaColor);
        areaPath.setAttribute("fill-opacity", "0.2");
        areaPath.setAttribute("stroke", "none");
        svgElement.appendChild(areaPath);
      }
    }
    const strokePathData = buildSparklineStrokePath(
      valueSeries,
      svgWidth,
      svgHeight,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      scale.scaleMinimum,
      scale.scaleMaximum,
      resolvedOptions.sparklineNullValueDisplay
    );
    if (strokePathData) {
      const strokePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      strokePath.setAttribute("d", strokePathData);
      strokePath.setAttribute("fill", "none");
      strokePath.setAttribute("stroke", sparklineStrokeColor);
      strokePath.setAttribute("stroke-width", String(resolvedOptions.sparklineStrokeWidth));
      strokePath.setAttribute("vector-effect", "non-scaling-stroke");
      svgElement.appendChild(strokePath);
    }
    const pointLabelsByIndex = parseSparkPointLabelMap(resolvedOptions.sparkPointLabelsRaw);
    const annotationSeries = resolvedOptions.annotationFieldName && seriesData.stringFieldsByName[resolvedOptions.annotationFieldName] ? seriesData.stringFieldsByName[resolvedOptions.annotationFieldName] : [];
    const effectivePointLabels = {};
    if (resolvedOptions.showSparkPointLabels) {
      Object.assign(effectivePointLabels, pointLabelsByIndex);
    }
    if (resolvedOptions.showAnnotationOnSpark && annotationSeries.length) {
      for (let pointIndex = 0; pointIndex < annotationSeries.length; pointIndex += 1) {
        if (annotationSeries[pointIndex]) {
          effectivePointLabels[pointIndex] = annotationSeries[pointIndex];
        }
      }
    }
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
      if (!Object.prototype.hasOwnProperty.call(effectivePointLabels, pointIndex)) {
        continue;
      }
      drawSparkPointLabel(
        svgElement,
        valueSeries,
        pointIndex,
        effectivePointLabels[pointIndex],
        svgWidth,
        svgHeight,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        scale.scaleMinimum,
        scale.scaleMaximum,
        sparklineStrokeColor
      );
    }
    sparkContainer.appendChild(svgElement);
    if (!sharedHover.tooltipElement) {
      sharedHover.tooltipElement = ownerDocument.createElement("div");
      sharedHover.tooltipElement.className = "splunkstuff-sparkline-value-viz__tooltip";
      sharedHover.tooltipElement.setAttribute("role", "status");
      sharedHover.tooltipElement.style.display = "none";
    }
    if (resolvedOptions.showSparklineTooltip && pointCount >= 2) {
      let pointerIsOverSpark = function(clientX, clientY) {
        const containerRect = sparkContainer.getBoundingClientRect();
        return containerRect.width > 0 && containerRect.height > 0 && clientX >= containerRect.left && clientX <= containerRect.right && clientY >= containerRect.top && clientY <= containerRect.bottom;
      }, onDocumentPointerMove = function(event) {
        if (!pointerIsOverSpark(event.clientX, event.clientY)) {
          clearSparkHoverState(sparkContainer, sharedHover.tooltipElement, hoverAnnotationElement);
          return;
        }
        const hoveredPointIndex = sparkPointIndexFromPointer(
          event.clientX,
          sparkContainer,
          paddingLeft,
          paddingRight,
          svgWidth,
          pointCount
        );
        if (hoveredPointIndex == null) {
          clearSparkHoverState(sparkContainer, sharedHover.tooltipElement, hoverAnnotationElement);
          return;
        }
        const coordinates = sparkPointCoordinates(
          valueSeries,
          hoveredPointIndex,
          svgWidth,
          svgHeight,
          paddingLeft,
          paddingRight,
          paddingTop,
          paddingBottom,
          scale.scaleMinimum,
          scale.scaleMaximum
        );
        const hoverAnnotation = resolvedOptions.showAnnotationOnHover && annotationAtPoint[hoveredPointIndex] ? annotationAtPoint[hoveredPointIndex] : "";
        updateSparkHoverState(sparkContainer, sharedHover.tooltipElement, ownerDocument, {
          hoverPointX: coordinates.x,
          hoverPointY: coordinates.y,
          svgWidth,
          svgHeight,
          paddingTop,
          paddingBottom,
          sparklineStrokeColor,
          pointValue: valueSeries[hoveredPointIndex],
          numberPrecision: resolvedOptions.numberPrecision,
          tooltipPrefix: resolvedOptions.tooltipPrefix,
          timeLabel: formatHoverTimeLabel(
            seriesData.timeSeries,
            normalizedTimes,
            hoveredPointIndex
          ),
          annotationLabel: hoverAnnotation,
          pointLabel: pointLabelsByIndex[hoveredPointIndex] || "",
          clientX: event.clientX,
          clientY: event.clientY,
          showInChartHoverAnnotation: resolvedOptions.showInChartHoverAnnotation,
          hoverAnnotationElement
        });
      };
      const normalizedTimes = normalizeTimeColumn(seriesData.timeSeries, pointCount);
      const annotationAtPoint = resolvedOptions.annotationFieldName && seriesData.stringFieldsByName[resolvedOptions.annotationFieldName] ? seriesData.stringFieldsByName[resolvedOptions.annotationFieldName] : [];
      if (!sharedHover.cleanupHandlers) {
        sharedHover.cleanupHandlers = [];
      }
      const cleanup = () => {
        ownerDocument.removeEventListener("pointermove", onDocumentPointerMove, true);
        ownerDocument.removeEventListener("mousemove", onDocumentPointerMove, true);
        if (ownerDocument.defaultView) {
          ownerDocument.defaultView.removeEventListener("mousemove", onDocumentPointerMove, true);
        }
        clearSparkHoverState(sparkContainer, sharedHover.tooltipElement, hoverAnnotationElement);
      };
      sharedHover.cleanupHandlers.push(cleanup);
      ownerDocument.addEventListener("pointermove", onDocumentPointerMove, true);
      ownerDocument.addEventListener("mousemove", onDocumentPointerMove, true);
      if (ownerDocument.defaultView) {
        ownerDocument.defaultView.addEventListener("mousemove", onDocumentPointerMove, true);
      }
    }
  }
  renderSparkSvg(false);
}
function renderKpiSparklineTile(mountElement2, seriesData, resolvedOptions, ownerDocument, sharedHover) {
  const valueSeries = Array.isArray(resolvedOptions.sparklineValuesOverride) && resolvedOptions.sparklineValuesOverride.length ? resolvedOptions.sparklineValuesOverride.map((value) => Number(value)) : seriesData.valueSeries;
  if (!valueSeries.length) {
    const emptyElement = document.createElement("div");
    emptyElement.className = "splunkstuff-sparkline-value-viz__err";
    emptyElement.textContent = resolvedOptions.emptyStateMessage;
    mountElement2.appendChild(emptyElement);
    return;
  }
  const trendDeltaValue = resolvedOptions.trendValueOverride != null && Number.isFinite(Number(resolvedOptions.trendValueOverride)) ? Number(resolvedOptions.trendValueOverride) : calculateTrendDelta(valueSeries);
  const lastValue = valueSeries[valueSeries.length - 1];
  const upTrendColor = sanitizeHexColor(resolvedOptions.upTrendColor, "#01417F");
  const downTrendColor = sanitizeHexColor(resolvedOptions.downTrendColor, "#DFA611");
  const defaultTextColor = sanitizeHexColor(resolvedOptions.defaultTextColor, "#FFFFFF");
  const sparklineStrokeColor = sanitizeHexColor(resolvedOptions.sparklineStrokeColor, "#FFFFFF");
  const tileBackgroundColor = resolvedOptions.tileBackgroundColorOverride ? resolvedOptions.tileBackgroundColorOverride : resolveTrendTileColor(
    trendDeltaValue,
    upTrendColor,
    downTrendColor,
    resolvedOptions.invertTrendDirection
  );
  const majorTextColor = resolvedOptions.majorColor || defaultTextColor;
  const trendTextColor = resolvedOptions.trendColor || defaultTextColor;
  const scale = deriveSparkScale(
    valueSeries,
    resolvedOptions.sparkScaleMinimum,
    resolvedOptions.sparkScaleMaximum,
    resolvedOptions.autoScaleSparkline
  );
  const rootElement = document.createElement("div");
  rootElement.className = "splunkstuff-sparkline-value-viz";
  rootElement.setAttribute("data-ss-viz-build", VIZ_BUILD);
  rootElement.style.position = "relative";
  rootElement.style.backgroundColor = tileBackgroundColor;
  rootElement.style.color = defaultTextColor;
  rootElement.style.width = "100%";
  rootElement.style.height = "100%";
  rootElement.style.minHeight = "200px";
  rootElement.style.boxSizing = "border-box";
  rootElement.style.display = "flex";
  rootElement.style.flexDirection = "column";
  if (resolvedOptions.badgeStatusText) {
    const badgeElement = document.createElement("div");
    badgeElement.className = "splunkstuff-sparkline-value-viz__badge";
    badgeElement.textContent = resolvedOptions.badgeStatusText;
    badgeElement.setAttribute("title", resolvedOptions.badgeStatusText);
    rootElement.appendChild(badgeElement);
  }
  if (resolvedOptions.subheaderText) {
    const headerElement = document.createElement("div");
    headerElement.className = "splunkstuff-sparkline-value-viz__header";
    applySubheaderBarStyles(
      headerElement,
      resolvedOptions.subheaderStyle,
      tileBackgroundColor,
      upTrendColor,
      defaultTextColor
    );
    headerElement.textContent = resolvedOptions.subheaderText;
    rootElement.appendChild(headerElement);
  }
  const bodyElement = document.createElement("div");
  bodyElement.className = "splunkstuff-sparkline-value-viz__body";
  bodyElement.style.flex = "1 1 auto";
  bodyElement.style.position = "relative";
  bodyElement.style.display = "flex";
  bodyElement.style.flexDirection = "column";
  bodyElement.style.alignItems = "center";
  bodyElement.style.justifyContent = "center";
  bodyElement.style.padding = "12px 12px 76px";
  bodyElement.style.boxSizing = "border-box";
  const alignClass = resolvedOptions.align === "left" ? "splunkstuff-sparkline-value-viz__headlineRow--alignLeft" : resolvedOptions.align === "right" ? "splunkstuff-sparkline-value-viz__headlineRow--alignRight" : "";
  const headlineRowElement = document.createElement("div");
  headlineRowElement.className = `splunkstuff-sparkline-value-viz__headlineRow splunkstuff-sparkline-value-viz__headlineRow--${resolvedOptions.headlineLayout === "inline" ? "inline" : "stacked"} ${alignClass}`.trim();
  const majorValueNumeric = resolvedOptions.majorValueOverride != null && Number.isFinite(Number(resolvedOptions.majorValueOverride)) ? Number(resolvedOptions.majorValueOverride) : lastValue;
  const majorDisplayText = resolvedOptions.majorValueDisplayOverride != null && String(resolvedOptions.majorValueDisplayOverride).trim() !== "" ? String(resolvedOptions.majorValueDisplayOverride) : formatMajorValue(majorValueNumeric, resolvedOptions);
  const majorBlock = document.createElement("div");
  majorBlock.className = "splunkstuff-sparkline-value-viz__major";
  const majorValueElement = document.createElement("div");
  majorValueElement.className = "splunkstuff-sparkline-value-viz__majorValue";
  majorValueElement.textContent = majorDisplayText;
  majorValueElement.style.fontSize = resolvedOptions.majorFontSize ? `${resolvedOptions.majorFontSize}px` : "32px";
  majorValueElement.style.fontWeight = "600";
  majorValueElement.style.lineHeight = "1.05";
  majorValueElement.style.color = majorTextColor;
  const majorLabelText = resolvedOptions.majorLabelText || resolvedOptions.underLabelText;
  appendLabelValuePair(
    majorBlock,
    majorValueElement,
    majorLabelText,
    majorTextColor,
    resolvedOptions.labelPosition
  );
  headlineRowElement.appendChild(majorBlock);
  if (resolvedOptions.showTrendDelta) {
    const trendBlock = document.createElement("div");
    trendBlock.className = "splunkstuff-sparkline-value-viz__trend";
    const trendValueElement = document.createElement("div");
    trendValueElement.className = "splunkstuff-sparkline-value-viz__trendValue";
    trendValueElement.textContent = formatTrendDeltaValue(trendDeltaValue, lastValue, resolvedOptions);
    trendValueElement.style.fontSize = resolvedOptions.trendFontSize ? `${resolvedOptions.trendFontSize}px` : "16px";
    trendValueElement.style.fontWeight = "600";
    trendValueElement.style.color = trendTextColor;
    appendLabelValuePair(
      trendBlock,
      trendValueElement,
      resolvedOptions.deltaLabelText,
      trendTextColor,
      resolvedOptions.labelPosition
    );
    headlineRowElement.appendChild(trendBlock);
  }
  bodyElement.appendChild(headlineRowElement);
  let hoverAnnotationElement = null;
  if (resolvedOptions.showInChartHoverAnnotation) {
    hoverAnnotationElement = ownerDocument.createElement("div");
    hoverAnnotationElement.className = "splunkstuff-sparkline-value-viz__hoverAnn";
    hoverAnnotationElement.setAttribute("aria-hidden", "true");
    bodyElement.appendChild(hoverAnnotationElement);
  }
  const showSparkSection = resolvedOptions.showSparkline && resolvedOptions.sparklineDisplay !== "off";
  let sparkContainer = null;
  if (showSparkSection) {
    sparkContainer = document.createElement("div");
    sparkContainer.className = "splunkstuff-sparkline-value-viz__spark";
    if (resolvedOptions.sparkEdgeToEdge) {
      sparkContainer.className += " splunkstuff-sparkline-value-viz__spark--edgeToEdge";
    }
    sparkContainer.style.position = "absolute";
    sparkContainer.style.left = resolvedOptions.sparkEdgeToEdge ? "0" : "10px";
    sparkContainer.style.right = resolvedOptions.sparkEdgeToEdge ? "0" : "10px";
    sparkContainer.style.bottom = "8px";
    sparkContainer.style.overflow = "visible";
    bodyElement.appendChild(sparkContainer);
  }
  rootElement.appendChild(bodyElement);
  mountElement2.appendChild(rootElement);
  if (showSparkSection && sparkContainer) {
    paintSparkline(
      sparkContainer,
      { ...seriesData, valueSeries },
      resolvedOptions,
      sparklineStrokeColor,
      scale,
      ownerDocument,
      hoverAnnotationElement,
      sharedHover
    );
  }
}
function sortTrellisGroups(trellisGroups, resolvedOptions) {
  const sortedGroups = trellisGroups.slice();
  const sortDescending = resolvedOptions.trellisSortOrder === "descending";
  sortedGroups.sort((left, right) => {
    let comparison = 0;
    if (resolvedOptions.trellisSortBy === "name") {
      comparison = left.categoryLabel.localeCompare(right.categoryLabel);
    } else if (resolvedOptions.trellisSortBy === "value") {
      comparison = (left.valueSeries[left.valueSeries.length - 1] || 0) - (right.valueSeries[right.valueSeries.length - 1] || 0);
    } else if (resolvedOptions.trellisSortBy === "trend") {
      comparison = calculateTrendDelta(left.valueSeries) - calculateTrendDelta(right.valueSeries);
    }
    return sortDescending ? -comparison : comparison;
  });
  return sortedGroups;
}
function renderTrellisGrid(mountElement2, trellisGroups, resolvedOptions, ownerDocument, sharedHover) {
  const sortedGroups = sortTrellisGroups(trellisGroups, resolvedOptions);
  const pageSize = Math.max(1, resolvedOptions.trellisPageSize || 20);
  const visibleGroups = sortedGroups.slice(0, pageSize);
  const gridElement = document.createElement("div");
  gridElement.className = "splunkstuff-sparkline-value-viz__trellisGrid";
  if (resolvedOptions.trellisBackgroundColor) {
    gridElement.style.background = resolvedOptions.trellisBackgroundColor;
  }
  if (resolvedOptions.trellisColumnCount > 0) {
    gridElement.style.gridTemplateColumns = `repeat(${resolvedOptions.trellisColumnCount}, minmax(${resolvedOptions.trellisMinimumColumnWidth}px, 1fr))`;
  } else {
    gridElement.style.gridTemplateColumns = `repeat(auto-fill, minmax(${resolvedOptions.trellisMinimumColumnWidth}px, 1fr))`;
  }
  for (let groupIndex = 0; groupIndex < visibleGroups.length; groupIndex += 1) {
    const group = visibleGroups[groupIndex];
    const cellElement = document.createElement("div");
    cellElement.className = "splunkstuff-sparkline-value-viz__trellisCell";
    cellElement.style.minHeight = `${resolvedOptions.trellisRowHeight}px`;
    const titleElement = document.createElement("div");
    titleElement.className = "splunkstuff-sparkline-value-viz__trellisTitle";
    titleElement.textContent = group.categoryLabel;
    cellElement.appendChild(titleElement);
    const tileMount = document.createElement("div");
    tileMount.className = "splunkstuff-sparkline-value-viz__trellisTileMount";
    cellElement.appendChild(tileMount);
    gridElement.appendChild(cellElement);
    renderKpiSparklineTile(tileMount, group, resolvedOptions, ownerDocument, sharedHover);
  }
  mountElement2.appendChild(gridElement);
}
function cleanupSharedHover(sharedHover) {
  if (sharedHover.cleanupHandlers) {
    for (let handlerIndex = 0; handlerIndex < sharedHover.cleanupHandlers.length; handlerIndex += 1) {
      sharedHover.cleanupHandlers[handlerIndex]();
    }
    sharedHover.cleanupHandlers = [];
  }
  if (sharedHover.tooltipElement && sharedHover.tooltipElement.parentNode) {
    sharedHover.tooltipElement.parentNode.removeChild(sharedHover.tooltipElement);
    sharedHover.tooltipElement = null;
  }
}

// visualizations/splunkstuff_kpi_sparkline_studio/src/visualization.js
var mountElement = document.getElementById("root");
var visualizationState = {
  searchData: null,
  loading: false,
  rawOptions: {},
  sharedHover: { cleanupHandlers: [], tooltipElement: null }
};
function renderVisualization() {
  if (!mountElement) {
    return;
  }
  cleanupSharedHover(visualizationState.sharedHover);
  mountElement.innerHTML = "";
  if (visualizationState.loading) {
    mountElement.textContent = "Loading...";
    return;
  }
  const resolvedOptions = resolveOptions(visualizationState.rawOptions);
  try {
    const parsedData = parsePrimarySearchData(visualizationState.searchData, resolvedOptions);
    if (resolvedOptions.splitByLayout === "trellis" && parsedData.trellisGroups.length) {
      renderTrellisGrid(
        mountElement,
        parsedData.trellisGroups,
        resolvedOptions,
        document,
        visualizationState.sharedHover
      );
    } else if (parsedData.primary.valueSeries.length) {
      renderKpiSparklineTile(
        mountElement,
        parsedData.primary,
        resolvedOptions,
        document,
        visualizationState.sharedHover
      );
    } else {
      mountElement.textContent = resolvedOptions.emptyStateMessage;
    }
    visualization_exports.clearError();
  } catch (error) {
    mountElement.textContent = error && error.message ? error.message : String(error);
    visualization_exports.setError(error && error.message ? error.message : String(error));
  }
}
visualization_exports.addDataSourcesListener(
  ({ dataSources, loading }) => {
    visualizationState.loading = loading;
    visualizationState.searchData = dataSources?.primary?.data ?? null;
    renderVisualization();
  },
  { invokeImmediately: true }
);
visualization_exports.addOptionsListener(({ options }) => {
  visualizationState.rawOptions = options || {};
  renderVisualization();
});
