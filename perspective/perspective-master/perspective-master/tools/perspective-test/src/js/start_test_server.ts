/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { WebSocketServer } from "@finos/perspective";
import path from "path";

const _server = new WebSocketServer({
    assets: [
        path.join(__dirname, "../../../.."),
        path.join(__dirname, "../../../..", "node_modules"),
    ],
    port: 6598,
    host_psp: undefined,
    on_start: undefined,
});
