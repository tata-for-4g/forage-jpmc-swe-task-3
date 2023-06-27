/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { labelFunction } from "../axis/axisLabel";
import { splitIntoMultiSeries } from "./splitIntoMultiSeries";

export function ohlcData(settings, data) {
    return splitIntoMultiSeries(settings, data, { excludeEmpty: true }).map(
        (data) => seriesToOHLC(settings, data)
    );
}

function seriesToOHLC(settings, data) {
    const labelfn = labelFunction(settings);
    const getNextOpen = (i) =>
        data[i < data.length - 1 ? i + 1 : i][settings.realValues[0]];
    const mappedSeries = data.map((col, i) => {
        const openValue = !!settings.realValues[0]
            ? col[settings.realValues[0]]
            : undefined;
        const closeValue = !!settings.realValues[1]
            ? col[settings.realValues[1]]
            : getNextOpen(i);
        return {
            crossValue: labelfn(col, i),
            mainValues: settings.mainValues.map((v) => col[v.name]),
            openValue: openValue,
            closeValue: closeValue,
            highValue: !!settings.realValues[2]
                ? col[settings.realValues[2]]
                : Math.max(openValue, closeValue),
            lowValue: !!settings.realValues[3]
                ? col[settings.realValues[3]]
                : Math.min(openValue, closeValue),
            key: data.key,
            row: col,
        };
    });

    mappedSeries.key = data.key;
    return mappedSeries;
}
