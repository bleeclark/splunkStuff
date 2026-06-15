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
    if (typeof cell === 'object' && cell.value != null) {
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

function findTimeColumnIndex(searchData) {
    const fields = readFieldsList(searchData);
    for (let columnIndex = 0; columnIndex < fields.length; columnIndex += 1) {
        if (readFieldName(fields, columnIndex) === '_time') {
            return columnIndex;
        }
    }
    return -1;
}

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

function buildSeriesFromPairs(sortedPairs) {
    const valueSeries = [];
    const timeSeries = [];
    for (let pairIndex = 0; pairIndex < sortedPairs.length; pairIndex += 1) {
        valueSeries.push(sortedPairs[pairIndex].numericValue);
        timeSeries.push(sortedPairs[pairIndex].timeRaw);
    }
    return { valueSeries, timeSeries };
}

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
