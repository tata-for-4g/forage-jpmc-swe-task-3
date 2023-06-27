/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";
import { flattenArray } from "./flatten";
import { extentLinear as customExtent } from "../d3fc/extent/extentLinear";
import valueformatter from "./valueFormatter";
import { getChartContainer } from "../plugin/root";

export const scale = () => d3.scaleLinear();

export const domain = () => {
    const base = customExtent().pad([0, 0.1]).padUnit("percent");

    let valueNames = ["crossValue"];

    const _domain = (data) => {
        base.accessors(valueNames.map((v) => (d) => parseFloat(d[v])));

        return getDataExtent(flattenArray(data));
    };

    fc.rebindAll(_domain, base);

    const getMinimumGap = (data) => {
        const gaps = valueNames.map((valueName) =>
            data
                .map((d) => d[valueName])
                .sort((a, b) => a - b)
                .filter((d, i, a) => i === 0 || d !== a[i - 1])
                .reduce((acc, d, i, src) =>
                    i === 0 || acc <= d - src[i - 1]
                        ? acc
                        : Math.abs(d - src[i - 1])
                )
        );

        return Math.min(...gaps);
    };

    const getDataExtent = (data) => {
        if (base.padUnit() == "domain") {
            const dataWidth = getMinimumGap(data);
            return base.pad([dataWidth / 2, dataWidth / 2])(data);
        } else {
            return base(data);
        }
    };

    _domain.valueName = (...args) => {
        if (!args.length) {
            return valueNames[0];
        }
        valueNames = [args[0]];
        return _domain;
    };
    _domain.valueNames = (...args) => {
        if (!args.length) {
            return valueNames;
        }
        valueNames = args[0];
        return _domain;
    };

    return _domain;
};

export const labelFunction = (valueName) => (d) => d[valueName][0];

export const tickFormatFunction = valueformatter;

export const component = (settings) => {
    let domain = null;
    let orient = "horizontal";
    let settingName = null;

    const getAxis = (s, data) => {
        try {
            const container = getChartContainer(s.node());
            const chart = container.querySelector(".cartesian-chart");
            const axis = chart.querySelector(`.${data}-axis`);
            return axis;
        } catch (e) {
            return null;
        }
    };

    // shrinks a given tick label
    const shrinkTickLabel = (node) => {
        const text = d3.select(node).select("text").node();
        text.style.fontSize = "80%";
    };

    // resizes ticks if they overflow the axis box
    const shrinkTicks = (axis, s) => {
        const axisBox = axis.getBoundingClientRect();
        s.each((d, i, nodes) => {
            const tickBox = d3.select(nodes[i]).node().getBoundingClientRect();

            // if the tick is bigger than the axis, resize it
            if (orient == "vertical" && axisBox.width < tickBox.width) {
                shrinkTickLabel(nodes[i]);
            } else if (
                orient == "horizontal" &&
                axisBox.height < tickBox.height
            ) {
                shrinkTickLabel(nodes[i]);
            }
        });
    };

    const decorate = (s, data, index) => {
        const axis = getAxis(s, data);
        if (axis) {
            shrinkTicks(axis, s);
        }
    };

    const getComponent = () => {
        const components = {
            bottom: fc.axisBottom,
            left: fc.axisLeft,
            top: fc.axisTop,
            right: fc.axisRight,
            // size: "100px", // works, but can't measure here
            decorate,
        };
        return components;
    };

    getComponent.domain = (...args) => {
        if (!args.length) {
            return domain;
        }
        domain = args[0];
        return getComponent;
    };

    getComponent.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return getComponent;
    };

    getComponent.settingName = (...args) => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return getComponent;
    };

    return getComponent;
};
