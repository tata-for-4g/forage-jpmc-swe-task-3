/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { clean, run_with_scope } = require("./script_utils.js");

const glob = require("glob");
const minimatch = require("minimatch");
const args = process.argv.slice(2);

async function run() {
    try {
        if (process.env.PSP_PROJECT === "python") {
            clean(
                "python/perspective/dist",
                "python/perspective/build",
                "python/perspective/docs/build",
                "python/perspective/perspective_python.egg-info",
                "python/perspective/.coverage",
                "python/perspective/.pytest_cache",
                "python/perspective/python_junit.xml",
                "python/perspective/coverage.xml",
                ...glob.sync("python/perspective/**/*.pyc"),
                ...glob.sync("python/perspective/**/__pycache__")
            );

            process.exit(0);
        }

        if (!process.env.PSP_PROJECT || args.indexOf("--deps") > -1) {
            clean(
                "cpp/perspective/dist",
                "cpp/perspective/build",
                "packages/perspective/build"
            );
        }

        if (
            !process.env.PACKAGE ||
            minimatch("perspective", process.env.PACKAGE)
        ) {
            const files = [
                "CMakeFiles",
                "build",
                "cmake_install.cmake",
                "CMakeCache.txt",
                "compile_commands.json",
                "libpsp.a",
                "Makefile",
            ];
            clean(...files.map((x) => `cpp/perspective/obj/${x}`));
        }

        await run_with_scope`clean`;
        clean("docs/build", "docs/python", "docs/obj");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
