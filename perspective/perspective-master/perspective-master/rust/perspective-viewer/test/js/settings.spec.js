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

const path = require("path");

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

test.describe("Settings", () => {
    test.describe("Toggle", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(
                "/rust/perspective-viewer/test/html/superstore.html"
            );
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

        test("opens settings when field is set to true", async ({ page }) => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.getTable();
                await viewer.restore({ settings: true });
            });

            const contents = await get_contents(page);

            await compareContentsToSnapshot(contents, [
                "opens-settings-when-field-is-set-to-true.txt",
            ]);
        });

        test("opens settings when field is set to false", async ({ page }) => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.getTable();
                await viewer.restore({ settings: false });
            });

            const contents = await get_contents(page);

            await compareContentsToSnapshot(contents, [
                "opens-settings-when-field-is-set-to-false.txt",
            ]);
        });
    });

    test.describe("Regressions", () => {
        test("load and restore with settings called at the same time does not throw", async ({
            page,
        }) => {
            const logs = [],
                errors = [];
            page.on("console", async (msg) => {
                if (msg.type() === "error") {
                    logs.push(msg.text());
                }
            });

            page.on("pageerror", async (msg) => {
                errors.push(`${msg.name}::${msg.message}`);
            });

            await page.goto("/rust/perspective-viewer/test/html/blank.html", {
                waitUntil: "networkidle",
            });

            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                viewer.load(
                    new Promise((_, reject) => reject("Intentional Load Error"))
                );
                try {
                    await viewer.restore({ settings: true, plugin: "Debug" });
                } catch (e) {
                    // We need to catch this error else the `evaluate()` fails.
                    // We need to await the call because we want it to fail
                    // before continuing the test.
                    console.error("Caught error:", e);
                }

                await new Promise((x) => setTimeout(x, 1000));
            });

            const contents = await get_contents(page);
            expect(errors).toEqual([
                "::Intentional Load Error",
                //   "RuntimeError::unreachable",
            ]);

            expect(logs).toEqual([
                "Invalid config, resetting to default {group_by: Array(0), split_by: Array(0), columns: Array(0), filter: Array(0), sort: Array(0)} `restore()` called before `load()`",
                "Caught error: `restore()` called before `load()`",
            ]);
        });
    });
});
