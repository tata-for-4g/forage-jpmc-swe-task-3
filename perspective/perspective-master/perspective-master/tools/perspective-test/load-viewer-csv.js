/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "/perspective.js";

async function load() {
    let resp = await fetch("/@finos/perspective-test/assets/superstore.csv");
    let csv = await resp.text();
    const viewer = document.querySelector("perspective-viewer");
    const worker = perspective.worker();
    const table = worker.table(csv);
    await viewer.load(table);
}

await load();
window.__TEST_PERSPECTIVE_READY__ = true;
