/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import { compareContentsToSnapshot } from "@finos/perspective-test";

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

    await page.evaluate(async () => {
        await document.querySelector("perspective-viewer").restore({
            plugin: "Debug",
        });
    });
});

test.describe("Save/Restore", async () => {
    test("save returns the current config", async ({ page }) => {
        const config = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.getTable();
            await viewer.restore({
                settings: true,
                group_by: ["State"],
                columns: ["Profit", "Sales"],
            });
            return await viewer.save();
        });

        expect(config).toEqual({
            aggregates: {},
            split_by: [],
            columns: ["Profit", "Sales"],
            expressions: [],
            filter: [],
            plugin: "Debug",
            plugin_config: {},
            group_by: ["State"],
            settings: true,
            sort: [],
            theme: "Pro Light",
            title: null,
        });

        const contents = await get_contents(page);

        await compareContentsToSnapshot(contents, [
            "save-returns-current-config.txt",
        ]);
    });

    test("restore restores a config from save", async ({ page }) => {
        const config = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.getTable();
            await viewer.restore({
                settings: true,
                group_by: ["State"],
                columns: ["Profit", "Sales"],
            });
            return await viewer.save();
        });

        expect(config).toEqual({
            aggregates: {},
            split_by: [],
            columns: ["Profit", "Sales"],
            expressions: [],
            filter: [],
            plugin: "Debug",
            plugin_config: {},
            group_by: ["State"],
            settings: true,
            sort: [],
            theme: "Pro Light",
            title: null,
        });

        const config2 = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.reset();
            return await viewer.save();
        });

        expect(config2).toEqual({
            aggregates: {},
            split_by: [],
            columns: [
                "Row ID",
                "Order ID",
                "Order Date",
                "Ship Date",
                "Ship Mode",
                "Customer ID",
                "Segment",
                "Country",
                "City",
                "State",
                "Postal Code",
                "Region",
                "Product ID",
                "Category",
                "Sub-Category",
                "Sales",
                "Quantity",
                "Discount",
                "Profit",
            ],
            expressions: [],
            filter: [],
            plugin: "Debug",
            plugin_config: {},
            group_by: [],
            settings: true,
            sort: [],
            theme: "Pro Light",
            title: null,
        });

        const config3 = await page.evaluate(async (config) => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.restore(config);
            return await viewer.save();
        }, config);

        expect(config3).toEqual({
            aggregates: {},
            split_by: [],
            columns: ["Profit", "Sales"],
            expressions: [],
            filter: [],
            plugin: "Debug",
            plugin_config: {},
            group_by: ["State"],
            settings: true,
            sort: [],
            theme: "Pro Light",
            title: null,
        });

        const contents = await get_contents(page);

        await compareContentsToSnapshot(contents, [
            "restore-restores-config-from-save.txt",
        ]);
    });
});
