/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { execute, execute_return } = require("./script_utils.js");
const fs = require("fs");
const glob = require("glob");
const { Octokit } = require("octokit");
const { parseReleases } = require("auto-changelog/src/releases");
const { fetchTags } = require("auto-changelog/src/tags");
const { fetchRemote } = require("auto-changelog/src/remote");

if (!process.env.GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN");
}

// if (!NEW_VERSION) {
//     throw new Error("Missing PUBLISH_VERSION");
// }

const { version: NEW_VERSION } = require("../package.json");

/**
 * A Github data fetching cache designed to run in parallel with changelog formatting.
 * When a SHA is requested, it is looked up in a local cache, and if it isn't there,
 * the next Github API page is awaited.  Requests are always triggered in advance.
 */
class GithubPRCache {
    constructor() {
        this.prs = new Map();
        this.page = 1;
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        this.next();
    }

    async next() {
        let ret;
        if (this._next_req) {
            ret = await this._next_req;
        }

        console.log(
            `Fetching Github commits ${(this.page - 1) * 100} - ${
                this.page * 100 - 1
            }`
        );

        this._next_req = this.octokit.request(
            "GET /repos/{owner}/{repo}/pulls?state=closed&per_page={per_page}&page={page}",
            {
                owner: "finos",
                repo: "perspective",
                per_page: 100,
                page: this.page++,
            }
        );

        return ret;
    }

    async get(sha) {
        while (!this.prs.has(sha) && !this.failed) {
            const resp = await this.next();

            if (resp.data.length == 0) {
                this.failed = true;
            }

            for (const pr of resp.data) {
                this.prs.set(pr.merge_commit_sha, pr);
            }
        }

        return this.prs.get(sha);
    }
}

function template_group(label, rows, prs) {
    if (rows.length > 0) {
        const group_prs = rows
            .map((merge) => `- ${merge.message} [#${merge.id}](${merge.href})`)
            .join("\n");
        return `${label}\n\n${group_prs}\n`;
    } else {
        return "";
    }
}

function template_release(args) {
    const prs = Object.keys(args.row)
        .map((label) => template_group(label, args.row[label]))
        .filter((x) => x.length > 0)
        .join("\n");
    return `# [${args.release.title}](https://github.com/finos/perspective/releases/tag/${args.release.title})

_${args.release.niceDate}_ ([Full changelog](${args.release.href}))

${prs}
`;
}

/**
 * Generate the changelog text from the output of `auto-changelog`, iteratively calling
 * Github's API when necessary to get label information for grouping.
 *
 * @param {*} json the output data from `auto-changelog`
 * @returns
 */
async function template(json) {
    const cache = new GithubPRCache();
    let changelog = "";
    for (const release of json) {
        const row = {
            "**Breaking**": [],
            Features: [],
            Fixes: [],
            Misc: [],
        };

        for (const merge of release.merges) {
            const pr = await cache.get(merge.commit.hash);
            merge.pr = pr;
            if (pr) {
                const labels = pr.labels.map((x) => x.name);
                if (labels.indexOf("breaking") > -1) {
                    row["**Breaking**"].push(merge);
                } else if (labels.indexOf("enhancement") > -1) {
                    row.Features.push(merge);
                } else if (labels.indexOf("bug") > -1) {
                    row.Fixes.push(merge);
                } else {
                    row.Misc.push(merge);
                }
            } else {
                row.Misc.push(merge);
            }
        }

        changelog += template_release({ row, release });
    }

    return changelog;
}

/**
 * Update the `CHANGELOG.md` file from Github API.
 */
async function update_changelog() {
    let options = {
        remote: "origin",
        commitLimit: 10000,
        backfillLimit: 10000,
        tagPrefix: "",
        sortCommits: "relevance",
        appendGitLog: "",
        appendGitTag: "",
        latestVersion: NEW_VERSION,
    };

    const remote = await fetchRemote(options);
    options = { ...options, ...remote };
    console.log("Fetching tags…");
    const tags = await fetchTags(options);
    console.log(`${tags.length} version tags found…`);
    const onParsed = ({ title }) => console.log(`Fetched ${title}…`);
    const json = await parseReleases(tags, options, onParsed);
    const changelog = await template(json);

    fs.writeFileSync("./CHANGELOG.md", changelog);
    execute`git add CHANGELOG.md`;
}

/**
 * Update all project `package.json` files.
 */
async function update_package_jsons() {
    const package = JSON.parse(fs.readFileSync("./package.json"));
    package.version = NEW_VERSION;
    const pkg_json = `${JSON.stringify(package, undefined, 4)}\n`;
    fs.writeFileSync("../package.json", pkg_json);

    const packages = {};
    for (const ws of package.workspaces) {
        for (const path of glob(`${ws}/package.json`, { sync: true })) {
            const pkg = JSON.parse(fs.readFileSync(path));
            pkg.version = NEW_VERSION;
            packages[pkg.name] = { pkg, path };
        }
    }

    for (const pkg_name of Object.keys(packages)) {
        const { pkg, path } = packages[pkg_name];

        for (const deptype of [
            "dependencies",
            "devDependencies",
            "peerDependencies",
        ]) {
            if (pkg[deptype]) {
                for (const dep of Object.keys(pkg[deptype])) {
                    if (packages[dep] !== undefined) {
                        pkg[deptype][dep] = `^${NEW_VERSION}`;
                    }
                }
            }
        }

        const pkg_json = `${JSON.stringify(pkg, undefined, 4)}\n`;
        fs.writeFileSync(path, pkg_json);
        execute(`git add ${path}`);
    }
}

async function run() {
    try {
        await update_changelog();
        await update_package_jsons();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

run();
