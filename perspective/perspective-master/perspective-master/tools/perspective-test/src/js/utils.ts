/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { expect, Page } from "@playwright/test";

/**
 * Clean a `<svg>` for serialization/comparison.
 * @param selector
 * @param page
 * @returns
 */
export const getSvgContentString = (selector: string) => async (page: Page) => {
    const content = await page.evaluate(async (s) => {
        let el = document.querySelector(s);

        function removeAttrs(node) {
            const svgAttrsToRemove = [
                "r",
                "d",
                "dx",
                "dy",
                "x",
                "y",
                "x1",
                "x2",
                "y1",
                "y2",
                "style",
                "d",
                "transform",
                "viewBox",
                "visibility",
            ];

            if (node.nodeType === Node.ELEMENT_NODE) {
                for (const attr of svgAttrsToRemove) {
                    node.removeAttribute(attr);
                }
            }
        }

        function walkNode(node) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_ALL);

            walk(walker, walker.currentNode);
        }

        function walk(walker, node) {
            if (!node) return;

            if (node.shadowRoot) {
                walkNode(node.shadowRoot);
            }

            switch (node.nodeName) {
                case "style":
                    node.textContent = "";
                    break;
                case "svg":
                    removeAttrs(node);

                    node.remove("viewBox");
                    node.remove("height");
                    break;
                case "g":
                case "path":
                case "line":
                case "circle":
                case "rect":
                case "text":
                    removeAttrs(node);
                    if (
                        ["label", "segment"].some((c) =>
                            node.classList.contains(c)
                        )
                    ) {
                        node.textContent = node.textContent.slice(0, 2);
                    }
                    break;
                default:
                    break;
            }

            walk(walker, walker.nextNode());
        }

        if (el?.shadowRoot) {
            el = el.shadowRoot as unknown as Element;
        }

        const svgs = el?.querySelectorAll("svg") || [];
        let htmlString = "";
        for (const svg of svgs) {
            const clonedSVG = svg.cloneNode(true) as SVGElement;

            walkNode(clonedSVG);

            htmlString += clonedSVG.outerHTML;
        }

        return htmlString;
    }, selector);

    return content;
};

export async function compareContentsToSnapshot(
    contents: string,
    snapshotPath: string[]
): Promise<void> {
    const cleanedContents = contents
        .replace(/style=""/g, "")
        .replace(/(min-|max-)?(width|height): *\d+\.*\d+(px)?;? */g, "");

    await expect(cleanedContents).toMatchSnapshot(snapshotPath);
}

export async function compareSVGContentsToSnapshot(
    page: Page,
    selector: string,
    snapshotPath: string[]
): Promise<void> {
    const svgContent = await getSvgContentString(selector)(page);
    await compareContentsToSnapshot(svgContent, snapshotPath);
}

export function getWorkspaceLightDOMContents(page: Page): Promise<string> {
    return page.evaluate(
        async () => document.querySelector("perspective-workspace")!.outerHTML
    );
}

export function getWorkspaceShadowDOMContents(page: Page): Promise<string> {
    return page.evaluate(async () => {
        return document
            .querySelector("perspective-workspace")!
            .shadowRoot!.querySelector("#container")!.innerHTML;
    });
}

export async function compareLightDOMContents(page, snapshotFileName) {
    const contents = await getWorkspaceLightDOMContents(page);

    await compareContentsToSnapshot(contents, [snapshotFileName]);
}

export async function compareShadowDOMContents(page, snapshotFileName) {
    const contents = await getWorkspaceShadowDOMContents(page);

    await compareContentsToSnapshot(contents, [snapshotFileName]);
}

export async function shadow_click(page, ...path): Promise<void> {
    await page.evaluate(
        ({ path }) => {
            let elem: ShadowRoot | Element | Document | null | undefined =
                document;
            while (path.length > 0) {
                let elem2 = elem;
                if (elem2 instanceof Element && elem2.shadowRoot !== null) {
                    elem = elem2.shadowRoot;
                }

                elem = elem?.querySelector(path.shift());
            }

            function triggerMouseEvent(node, eventType) {
                var clickEvent = document.createEvent("MouseEvent");
                clickEvent.initEvent(eventType, true, true);
                node.dispatchEvent(clickEvent);
            }

            triggerMouseEvent(elem, "mouseover");
            triggerMouseEvent(elem, "mousedown");
            triggerMouseEvent(elem, "mouseup");
            triggerMouseEvent(elem, "click");
        },
        { path }
    );
}

export async function shadow_type(
    page,
    content,
    is_incremental,
    ...path
): Promise<void> {
    if (typeof is_incremental !== "boolean") {
        path.unshift(is_incremental);
        is_incremental = false;
    }

    await page.evaluate(
        async ({ content, path, is_incremental }) => {
            let elem: ShadowRoot | Element | Document | null | undefined =
                document;
            while (path.length > 0) {
                let elem2 = elem;
                if (elem2 instanceof Element && elem2.shadowRoot !== null) {
                    elem = elem2.shadowRoot;
                }

                elem = elem?.querySelector(path.shift());
            }

            if (elem instanceof HTMLElement) {
                elem.focus();
            }

            function triggerInputEvent(element) {
                const event = new Event("input", {
                    bubbles: true,
                    cancelable: true,
                });

                element.dispatchEvent(event);
            }

            if (is_incremental) {
                while (content.length > 0) {
                    if (elem instanceof HTMLInputElement) {
                        elem.value += content[0];
                    }
                    triggerInputEvent(elem);
                    await new Promise(requestAnimationFrame);
                    content = content.slice(1);
                }
            } else {
                if (elem instanceof HTMLInputElement) {
                    elem.value = content;
                }

                triggerInputEvent(elem);
            }
        },
        { content, path, is_incremental }
    );
}

export async function shadow_blur(page): Promise<void> {
    await page.evaluate(() => {
        let elem = document.activeElement;
        while (elem) {
            (elem as HTMLElement).blur();
            let shadowRoot = elem.shadowRoot;
            elem = shadowRoot ? shadowRoot.activeElement : null;
        }
    });
}
