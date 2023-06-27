/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { kill_jlab } from "./jlab_start";

async function globalTeardown() {
    console.log("Reached globalTeardown.js");
    await kill_jlab();
}

export default globalTeardown;
