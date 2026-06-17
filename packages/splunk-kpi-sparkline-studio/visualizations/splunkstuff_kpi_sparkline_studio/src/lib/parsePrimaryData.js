/**
 * @file parsePrimaryData.js
 * @description Converts Dashboard Studio primary search results (column-major Splunk
 *   data tables) into time-sorted value/time series and parallel string-field maps
 *   used for per-point annotations. All string columns are reordered to match the
 *   numeric series sort key so annotation[i] aligns with value[i].
 *
 * Data contract:
 *   - Required: _time column + at least one numeric column (e.g. value)
 *   - Optional: string columns (e.g. annotation) — exposed via stringFieldsByName
 *   - Trellis: optional split field groups rows into per-category mini-series
 *
 * @see resolveOptions.js — majorValueFieldName, trellisSplitByField, splitByLayout
 * @see renderTile.js — consumes primary and trellisGroups for rendering
 */

// --- Splunk column-major helpers ---

/**
 * Reads the fields metadata array from Studio search data (top-level or meta.fields).
 *
 * @param {object} searchData - Raw primary data source payload
 * @returns {Array<string|object>} Field descriptors
 */
function readFieldsList(searchData) {
    if (searchData && searchData.fields && searchData.fields.length) {
        return searchData.fields;
    }
    if (searchData && searchData.meta && searchData.meta.fields && searchData.meta.fields.length) {
        return searchData.meta.fields;
    }
    return [];
}

/**
 * Unwraps Splunk table cells that may be plain values or { value: ... } objects.
 *
 * @param {*} cell - Single table cell
 * @returns {*} Scalar cell value
 */
function readCellValue(cell) {
    if (cell == null) {
        return cell;
    }
    if (typeof cell === 'object' && cell.value != null) {
        return cell.value;
    }
    return cell;
}

/**
 * Parses a table cell as a float; returns NaN when not numeric.
 *
 * @param {*} cell - Table cell
 * @returns {number} Parsed number or NaN
 */
function parseNumericCell(cell) {
    const parsed = parseFloat(readCellValue(cell), 10);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * Resolves a field name from the fields array at a column index.
 *
 * @param {Array} fields - Field metadata from readFieldsList
 * @param {number} columnIndex - Column position
 * @returns {string} Field name or empty string
 */
function readFieldName(fields, columnIndex) {
    if (!fields || columnIndex < 0 || columnIndex >= fields.length) {
        return '';
    }
    const field = fields[columnIndex];
    if (typeof field === 'string') {
        return field;
    }
    if (field != null && field.name != null) {
        return String(field.name);
    }
    return '';
}

/**
 * Locates the _time column index required for chronological sorting.
 *
 * @param {object} searchData - Column-major search results
 * @returns {number} Column index or -1 when _time is absent
 */
function findTimeColumnIndex(searchData) {
    const fields = readFieldsList(searchData);
    for (let columnIndex = 0; columnIndex < fields.length; columnIndex += 1) {
        if (readFieldName(fields, columnIndex) === '_time') {
            return columnIndex;
        }
    }
    return -1;
}

/**
 * Produces a numeric sort key for a row's _time cell (seconds since epoch preferred).
 * Supports epoch numbers, ISO strings, and numeric string timestamps.
 *
 * @param {object} searchData - Full search payload
 * @param {number} timeColumnIndex - Index of _time column
 * @param {number} rowIndex - Row to read
 * @returns {number} Sort key (0 when unparseable)
 */
function readTimeSortKey(searchData, timeColumnIndex, rowIndex) {
    const cell = readCellValue(searchData.columns[timeColumnIndex][rowIndex]);
    if (cell == null || cell === '') {
        return 0;
    }
    if (typeof cell === 'number' && Number.isFinite(cell)) {
        return cell;
    }
    const text = String(cell).trim();
    if (/^-?\d+(\.\d+)?$/.test(text)) {
        const numeric = parseFloat(text, 10);
        return Number.isFinite(numeric) ? numeric : 0;
    }
    const parsedMilliseconds = Date.parse(text);
    if (Number.isFinite(parsedMilliseconds)) {
        return parsedMilliseconds / 1000;
    }
    const fallback = parseFloat(text, 10);
    return Number.isFinite(fallback) ? fallback : 0;
}

// --- Column selection ---

/**
 * Picks the numeric value column: prefers majorValueFieldName when set, otherwise
 * the first non-_time column containing at least one parseable number.
 *
 * @param {object} searchData - Column-major search results
 * @param {string} preferredFieldName - majorValueField from resolved options
 * @returns {number} Column index or -1 when no numeric column exists
 */
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
        if (readFieldName(fields, columnIndex) === '_time') {
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

// --- Time sorting and string-field alignment ---

/**
 * Builds time-sorted { numericValue, timeRaw, rowIndex } pairs from the value column.
 * When _time is missing or length-mismatched, returns pairs in row order without sorting.
 * Rows with non-numeric values are skipped.
 *
 * @param {object} searchData - Column-major search results
 * @param {number} valueColumnIndex - Index of the metric column
 * @returns {Array<{ sortKey?: number, numericValue: number, timeRaw: *, rowIndex: number }>}
 */
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
            rowIndex,
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

/**
 * Reorders a string column to align with the time-sorted value series.
 * Critical for annotation index parity: annotation[i] must match value[i].
 *
 * @param {object} searchData - Full search payload
 * @param {number} stringColumnIndex - String field column index
 * @param {number} valueColumnIndex - Metric column used for sort order
 * @returns {string[]} Trimmed strings parallel to sorted value series
 */
function reorderStringColumnByTime(searchData, stringColumnIndex, valueColumnIndex) {
    const sortedPairs = buildTimeSortedValuePairs(searchData, valueColumnIndex);
    const stringColumn = searchData.columns[stringColumnIndex] || [];
    const orderedStrings = [];
    for (let pairIndex = 0; pairIndex < sortedPairs.length; pairIndex += 1) {
        const cell = stringColumn[sortedPairs[pairIndex].rowIndex];
        const raw = readCellValue(cell);
        orderedStrings.push(raw == null ? '' : String(raw).trim());
    }
    return orderedStrings;
}

/**
 * Builds stringFieldsByName: every non-_time, non-value string column reordered by time.
 * annotationFieldName in resolveOptions selects which key renderTile reads for annotations.
 *
 * @param {object} searchData - Column-major search results
 * @param {number} valueColumnIndex - Metric column index
 * @returns {Object.<string, string[]>} Field name → aligned string array
 */
function buildStringFieldsByTime(searchData, valueColumnIndex) {
    const fields = readFieldsList(searchData);
    const stringFieldsByName = {};
    if (!searchData || !searchData.columns) {
        return stringFieldsByName;
    }
    for (let columnIndex = 0; columnIndex < searchData.columns.length; columnIndex += 1) {
        const fieldName = readFieldName(fields, columnIndex);
        if (!fieldName || fieldName === '_time' || columnIndex === valueColumnIndex) {
            continue;
        }
        stringFieldsByName[fieldName] = reorderStringColumnByTime(searchData, columnIndex, valueColumnIndex);
    }
    return stringFieldsByName;
}

/**
 * Splits sorted pairs into parallel value and time arrays for rendering.
 *
 * @param {Array} sortedPairs - Output of buildTimeSortedValuePairs
 * @returns {{ valueSeries: number[], timeSeries: Array<*> }}
 */
function buildSeriesFromPairs(sortedPairs) {
    const valueSeries = [];
    const timeSeries = [];
    for (let pairIndex = 0; pairIndex < sortedPairs.length; pairIndex += 1) {
        valueSeries.push(sortedPairs[pairIndex].numericValue);
        timeSeries.push(sortedPairs[pairIndex].timeRaw);
    }
    return { valueSeries, timeSeries };
}

// --- Public API ---

/**
 * Main entry: parses primary Studio search data into render-ready structures.
 *
 * @param {object} searchData - dataSources.primary.data from VisualizationAPI
 * @param {object} resolvedOptions - Output of resolveOptions
 * @returns {{
 *   primary: { valueSeries: number[], timeSeries: Array<*>, valueFieldName: string, stringFieldsByName: object },
 *   trellisGroups: Array
 * }}
 * @throws {Error} When no numeric column or no parseable numbers exist
 */
export function parsePrimarySearchData(searchData, resolvedOptions) {
    if (!searchData || !searchData.columns || searchData.columns.length === 0) {
        return {
            primary: { valueSeries: [], timeSeries: [], valueFieldName: '', stringFieldsByName: {} },
            trellisGroups: [],
        };
    }

    const fields = readFieldsList(searchData);
    const valueColumnIndex = pickNumericColumnIndex(searchData, resolvedOptions.majorValueFieldName);
    if (valueColumnIndex < 0) {
        throw new Error('KPI sparkline needs a numeric column (e.g. value) beside _time.');
    }

    const sortedPairs = buildTimeSortedValuePairs(searchData, valueColumnIndex);
    const primarySeries = buildSeriesFromPairs(sortedPairs);
    if (!primarySeries.valueSeries.length) {
        throw new Error('KPI sparkline found a value column but no parseable numbers in results.');
    }

    const primary = {
        valueSeries: primarySeries.valueSeries,
        timeSeries: primarySeries.timeSeries,
        valueFieldName: readFieldName(fields, valueColumnIndex),
        stringFieldsByName: buildStringFieldsByTime(searchData, valueColumnIndex),
    };

    let trellisGroups = [];
    if (resolvedOptions.splitByLayout === 'trellis' && resolvedOptions.trellisSplitByField) {
        trellisGroups = buildTrellisGroups(searchData, valueColumnIndex, resolvedOptions.trellisSplitByField);
    }

    return { primary, trellisGroups };
}

// --- Trellis grouping ---

/**
 * Splits search rows by a category field and parses each subset as an independent
 * mini-series (same time-sort and string-field alignment rules as primary).
 *
 * @param {object} searchData - Full primary search payload
 * @param {number} valueColumnIndex - Metric column index
 * @param {string} splitByFieldName - trellisSplitBy field name
 * @returns {Array<{ categoryLabel: string, valueSeries: number[], timeSeries: Array<*>, valueFieldName: string, stringFieldsByName: object }>}
 */
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
    const groupsByCategory = new Map();

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        const categoryLabel = String(readCellValue(searchData.columns[categoryColumnIndex][rowIndex]) || '').trim();
        if (!categoryLabel) {
            continue;
        }
        if (!groupsByCategory.has(categoryLabel)) {
            groupsByCategory.set(categoryLabel, {
                categoryLabel,
                rowIndexes: [],
            });
        }
        groupsByCategory.get(categoryLabel).rowIndexes.push(rowIndex);
    }

    const trellisGroups = [];
    groupsByCategory.forEach((group) => {
        const subsetData = {
            fields: searchData.fields,
            columns: searchData.columns.map((column) =>
                group.rowIndexes.map((rowIndex) => column[rowIndex])
            ),
        };
        const sortedPairs = buildTimeSortedValuePairs(subsetData, valueColumnIndex);
        const series = buildSeriesFromPairs(sortedPairs);
        if (series.valueSeries.length) {
            trellisGroups.push({
                categoryLabel: group.categoryLabel,
                valueSeries: series.valueSeries,
                timeSeries: series.timeSeries,
                valueFieldName: readFieldName(fields, valueColumnIndex),
                stringFieldsByName: buildStringFieldsByTime(subsetData, valueColumnIndex),
            });
        }
    });

    return trellisGroups;
}
