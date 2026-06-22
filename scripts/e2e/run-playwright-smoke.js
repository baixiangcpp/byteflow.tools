import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import serveHandler from "serve-handler";

const DEFAULT_PORT = 4173;
const DEFAULT_ROUTES = [
    "/en",
    "/zh-CN",
    "/en/all-tools",
    "/en/json-formatter",
    "/zh-CN/json-formatter",
    "/en/javascript-formatter",
    "/zh-CN/javascript-formatter",
    "/en/base64-encode-decode",
    "/en/pipeline-builder",
    "/en/csv-json-converter",
];
const MOBILE_TOOL_VIEWPORTS = [
    { width: 390, height: 844 },
    { width: 430, height: 932 },
];

function parseArgs(argv) {
    const args = {
        port: DEFAULT_PORT,
        baseUrl: "",
        skipServer: false,
        includePwa: false,
    };

    for (const arg of argv) {
        if (arg === "--skip-server") {
            args.skipServer = true;
            continue;
        }

        if (arg === "--pwa") {
            args.includePwa = true;
            continue;
        }

        if (arg.startsWith("--port=")) {
            const parsed = Number(arg.slice("--port=".length));
            if (Number.isFinite(parsed) && parsed > 0) {
                args.port = parsed;
            }
            continue;
        }

        if (arg.startsWith("--base-url=")) {
            args.baseUrl = arg.slice("--base-url=".length).trim();
        }
    }

    if (!args.baseUrl) {
        args.baseUrl = `http://127.0.0.1:${args.port}`;
    }

    args.baseUrl = args.baseUrl.replace(/\/+$/, "");
    return args;
}

async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 30_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(url, { redirect: "manual" });
            if (response.status < 500) {
                return;
            }
        } catch {
            // Ignore until timeout.
        }
        await wait(400);
    }

    throw new Error(`Timed out waiting for static server at ${url}`);
}

function startStaticServer(port) {
    const outDir = path.resolve(process.cwd(), "out");
    if (!existsSync(outDir)) {
        throw new Error(`[playwright-smoke] Missing export directory: ${outDir}. Run npm run build first.`);
    }

    let requestLogTail = "";
    const appendLog = (line) => {
        requestLogTail = `${requestLogTail}${line}\n`.slice(-4000);
    };

    const server = createServer((req, res) => {
        appendLog(`${req.method || "GET"} ${req.url || "/"}`);
        return serveHandler(req, res, {
            public: outDir,
            cleanUrls: true,
            etag: false,
            headers: [
                {
                    source: "**/*.html",
                    headers: [{ key: "Cache-Control", value: "no-store" }],
                },
            ],
        });
    });

    server.listen(port, "127.0.0.1");

    return {
        server,
        getOutput() {
            return { stdoutTail: requestLogTail, stderrTail: "" };
        },
    };
}

async function stopServer(server) {
    if (!server) return;

    await new Promise((resolve) => {
        server.close(() => resolve());
    });
}

async function assertRouteRenders(context, baseUrl, route) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    const targetUrl = `${baseUrl}${route}`;
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    if (!response || !response.ok()) {
        throw new Error(`Route ${route} failed to load (status: ${response ? response.status() : "no_response"})`);
    }

    await page.waitForSelector("main", { timeout: 15_000 });
    if (runtimeErrors.length > 0) {
        throw new Error(`Route ${route} triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function assertHomeNavigation(context, baseUrl, locale) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto(`${baseUrl}/${locale}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    const toolRoute = `/${locale}/json-formatter`;
    const toolLink = page.locator(`a[href="${toolRoute}"]`).first();
    await toolLink.waitFor({ state: "visible", timeout: 15_000 });

    await Promise.all([
        page.waitForURL(`${baseUrl}${toolRoute}`, { timeout: 15_000 }),
        toolLink.click(),
    ]);

    await page.waitForSelector("main", { timeout: 15_000 });
    if (runtimeErrors.length > 0) {
        throw new Error(`Navigation smoke for ${locale} triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function openCommandPalette(page) {
    const input = page.locator('[data-slot="command-input"]');
    const waitForInput = () => input.waitFor({ state: "visible", timeout: 2_000 });

    await page.click("body", { position: { x: 20, y: 20 } });

    try {
        await page.keyboard.press("Control+K");
        await waitForInput();
        return input;
    } catch {
        // Fallback to mac shortcut.
    }

    try {
        await page.keyboard.press("Meta+K");
        await waitForInput();
        return input;
    } catch {
        // Fallback to search trigger click.
    }

    const searchTrigger = page.getByRole("button", { name: /search tools/i }).first();
    if (await searchTrigger.isVisible()) {
        await searchTrigger.click();
        await waitForInput();
        return input;
    }

    await page.evaluate(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }));
    });
    await input.waitFor({ state: "visible", timeout: 5_000 });
    return input;
}

async function assertCommandPaletteJourney(context, baseUrl, locale) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    const homeUrl = `${baseUrl}/${locale}`;
    await page.goto(homeUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });
    await page.getByRole("button", { name: /search tools/i }).first().waitFor({ state: "visible", timeout: 15_000 });

    const commandInput = await openCommandPalette(page);
    await page.keyboard.press("Escape");
    await commandInput.waitFor({ state: "hidden", timeout: 5_000 });

    const reopenedInput = await openCommandPalette(page);
    await reopenedInput.fill("json formatter");

    const jsonFormatterItem = page.locator('[data-slot="command-item"]').filter({ hasText: /JSON Formatter/i }).first();
    await jsonFormatterItem.waitFor({ state: "visible", timeout: 15_000 });

    const toolRoute = `${baseUrl}/${locale}/json-formatter`;
    await jsonFormatterItem.focus();
    await Promise.all([
        page.waitForURL(toolRoute, { timeout: 15_000 }),
        page.keyboard.press("Enter"),
    ]);

    await page.waitForSelector("main", { timeout: 15_000 });
    if (runtimeErrors.length > 0) {
        throw new Error(`Command palette journey for ${locale} triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function assertInputProcessCopyJourney(context, baseUrl, locale) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    const toolRoute = `${baseUrl}/${locale}/list-randomizer`;
    await page.goto(toolRoute, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    const inputTextarea = page.locator('textarea[placeholder="One item per line"]');
    await inputTextarea.waitFor({ state: "visible", timeout: 15_000 });
    await inputTextarea.fill("alpha\nbeta\nbeta\ngamma");

    const randomizeButton = page.getByRole("button", { name: "Randomize" });
    await randomizeButton.waitFor({ state: "visible", timeout: 15_000 });
    await randomizeButton.click();

    const outputTextarea = page.locator("textarea[readonly]").first();
    await outputTextarea.waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForFunction(() => {
        const node = document.querySelector("textarea[readonly]");
        if (!(node instanceof HTMLTextAreaElement)) return false;
        return node.value.includes("Result Items:") && /\n1\.\s/.test(node.value);
    }, null, { timeout: 15_000 });

    const output = await outputTextarea.inputValue();
    if (!output.includes("Result Items:")) {
        throw new Error("Input/process journey did not produce expected output summary.");
    }

    const copyButton = page.getByRole("button", { name: /^Copy$/ }).first();
    await copyButton.waitFor({ state: "visible", timeout: 15_000 });
    // Wait for DeferredToaster to mount (which has a 2000ms delay)
    await page.waitForTimeout(2500);
    await copyButton.click();

    const copiedToast = page.getByText(/copied/i).first();
    await copiedToast.waitFor({ state: "visible", timeout: 5_000 });

    if (runtimeErrors.length > 0) {
        throw new Error(`Input/process/copy journey for ${locale} triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function waitForAriaHiddenFocusablesToSettle(page, routeLabel) {
    await page.waitForFunction(() => {
        const isHiddenByStyle = (node) => {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return (
                style.display === "none" ||
                style.visibility === "hidden" ||
                Number(style.opacity) === 0 ||
                (rect.width === 0 && rect.height === 0)
            );
        };

        const shouldSkipInteractive = (node) => {
            const ariaHidden = node.getAttribute("aria-hidden") === "true";
            const disabled = node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true";
            const hiddenInput = node instanceof HTMLInputElement && node.type === "hidden";
            return ariaHidden || disabled || hiddenInput || isHiddenByStyle(node);
        };

        const hiddenFocusables = Array.from(document.querySelectorAll("[aria-hidden='true'] button, [aria-hidden='true'] a[href], [aria-hidden='true'] input, [aria-hidden='true'] textarea"))
            .filter((element) => !shouldSkipInteractive(element));

        return hiddenFocusables.length === 0;
    }, null, { timeout: 5_000 }).catch(() => {
        throw new Error(`Timed out waiting for aria-hidden focus guards to settle for ${routeLabel}.`);
    });
}

async function assertBasicAccessibility(page, routeLabel) {
    await waitForAriaHiddenFocusablesToSettle(page, routeLabel);

    const violations = await page.evaluate(() => {
        const issues = [];
        const interactiveSelectors = [
            "button",
            "a[href]",
            "input",
            "select",
            "textarea",
            "[role='button']",
            "[role='menuitem']",
            "[role='option']",
        ];

        const isHiddenByStyle = (node) => {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return (
                style.display === "none" ||
                style.visibility === "hidden" ||
                Number(style.opacity) === 0 ||
                (rect.width === 0 && rect.height === 0)
            );
        };

        const shouldSkipInteractive = (node) => {
            const ariaHidden = node.getAttribute("aria-hidden") === "true";
            const disabled = node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true";
            const hiddenInput = node instanceof HTMLInputElement && node.type === "hidden";
            return ariaHidden || disabled || hiddenInput || isHiddenByStyle(node);
        };

        for (const element of document.querySelectorAll(interactiveSelectors.join(","))) {
            const node = element;
            if (shouldSkipInteractive(node)) continue;

            const tag = node.tagName.toLowerCase();
            const role = node.getAttribute("role") || tag;
            const text = (node.textContent || "").trim();
            const labelFor =
                node.id && typeof CSS !== "undefined" && typeof CSS.escape === "function"
                    ? document.querySelector(`label[for="${CSS.escape(node.id)}"]`)?.textContent?.trim()
                    : "";
            const wrappingLabel = node.closest("label")?.textContent?.trim();
            const placeholder = "placeholder" in node ? node.getAttribute("placeholder") : "";
            const label =
                node.getAttribute("aria-label") ||
                node.getAttribute("aria-labelledby") ||
                node.getAttribute("title") ||
                labelFor ||
                wrappingLabel ||
                placeholder ||
                text;
            if (!label) {
                issues.push(`${role} lacks an accessible name`);
            }
        }

        const hiddenFocusables = Array.from(document.querySelectorAll("[aria-hidden='true'] button, [aria-hidden='true'] a[href], [aria-hidden='true'] input, [aria-hidden='true'] textarea"))
            .filter((element) => !shouldSkipInteractive(element));
        if (hiddenFocusables.length > 0) {
            issues.push(`${hiddenFocusables.length} focusable element(s) are inside aria-hidden content`);
        }

        return issues;
    });

    if (violations.length > 0) {
        throw new Error(`Accessibility smoke failed for ${routeLabel}:\n- ${violations.join("\n- ")}`);
    }
}

async function assertSkipLinkKeyboardPath(context, baseUrl) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    try {
        await page.goto(`${baseUrl}/en/all-tools`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });

        await page.keyboard.press("Tab");
        const skipLink = page.locator('[data-skip-link="main-content"]');
        await skipLink.waitFor({ state: "visible", timeout: 5_000 });

        const skipBox = await skipLink.boundingBox();
        if (!skipBox || skipBox.width < 40 || skipBox.height < 20) {
            throw new Error("Skip link did not become visibly focusable.");
        }

        await page.keyboard.press("Enter");
        await page.waitForFunction(() => document.activeElement?.id === "main-content", null, { timeout: 5_000 });

        if (runtimeErrors.length > 0) {
            throw new Error(`Skip link keyboard path triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
        }
    } finally {
        await page.close();
    }
}

async function assertNoHorizontalOverflow(page, routeLabel) {
    const overflow = await page.evaluate(() => {
        const documentElement = document.documentElement;
        const body = document.body;
        const viewportWidth = window.innerWidth;
        const scrollWidth = Math.max(documentElement.scrollWidth, body?.scrollWidth || 0);
        return {
            viewportWidth,
            scrollWidth,
            overflowPx: scrollWidth - viewportWidth,
        };
    });

    if (overflow.overflowPx > 2) {
        throw new Error(
            `Mobile layout overflow for ${routeLabel}: scrollWidth ${overflow.scrollWidth}px exceeds viewport ${overflow.viewportWidth}px.`,
        );
    }
}

async function assertMobileTouchTargets(page, routeLabel) {
    const violations = await page.evaluate(() => {
        const controls = Array.from(document.querySelectorAll("button, input, select, textarea, [role='button']"));

        const isHiddenByStyle = (node) => {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return (
                style.display === "none" ||
                style.visibility === "hidden" ||
                Number(style.opacity) === 0 ||
                (rect.width === 0 && rect.height === 0)
            );
        };

        return controls.flatMap((element) => {
            if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true" || isHiddenByStyle(element)) {
                return [];
            }
            const rect = element.getBoundingClientRect();
            if (rect.width >= 44 && rect.height >= 44) return [];
            const label =
                element.getAttribute("aria-label") ||
                element.getAttribute("title") ||
                element.textContent?.trim() ||
                element.getAttribute("placeholder") ||
                element.tagName.toLowerCase();
            return [`${label}: ${Math.round(rect.width)}x${Math.round(rect.height)}`];
        });
    });

    if (violations.length > 0) {
        throw new Error(`Mobile touch targets failed for ${routeLabel}:\n- ${violations.slice(0, 12).join("\n- ")}`);
    }
}

async function clickCopyAndExpectToast(page, button, label) {
    await button.waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(2500);
    await button.click();

    const copiedToast = page.getByText(/copied/i).first();
    await copiedToast.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {
        throw new Error(`Expected copied toast after ${label}.`);
    });

    await page.locator("[data-sonner-toast]").filter({ hasText: /copied/i }).first()
        .waitFor({ state: "hidden", timeout: 8_000 })
        .catch(() => {});
}

async function assertMobileToolJourney(context, baseUrl, viewport, route, runJourney) {
    const page = await context.newPage();
    const runtimeErrors = [];
    const routeLabel = `${route} mobile ${viewport.width}x${viewport.height}`;
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });

        await runJourney(page, routeLabel);
        await assertBasicAccessibility(page, routeLabel);
        await assertMobileTouchTargets(page, routeLabel);
        await assertNoHorizontalOverflow(page, routeLabel);

        if (runtimeErrors.length > 0) {
            throw new Error(`${routeLabel} triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
        }
    } finally {
        await page.close();
    }
}

async function assertMobileJsonFormatter(page) {
    const input = page.locator("textarea").first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await input.fill("{\"name\":\"Ada\",\"roles\":[\"admin\"]}");
    await page.getByRole("button", { name: /^Format$/ }).first().click();
    await expectTextareaValue(page, /"name": "Ada"/, "mobile json formatter output");
    await clickCopyAndExpectToast(
        page,
        page.getByRole("button", { name: /copy output/i }).first(),
        "mobile JSON output copy",
    );

    await input.fill("{\"name\":}");
    await page.getByRole("button", { name: /^Format$/ }).first().click();
    await page.getByText(/Invalid JSON|Unexpected token|Expected token|Trailing comma/i).first()
        .waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileBase64(page) {
    const input = page.locator("textarea").first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await input.fill("hello mobile");
    await page.getByRole("button", { name: /^Encode Base64$/ }).first().click();
    await expectTextareaValue(page, /aGVsbG8gbW9iaWxl/, "mobile base64 output");
    await clickCopyAndExpectToast(
        page,
        page.getByRole("button", { name: /^Copy$/ }).first(),
        "mobile Base64 output copy",
    );

    await page.getByRole("radio", { name: /^Decode$/ }).first().click();
    await input.fill("%%%");
    await page.getByRole("button", { name: /^Decode Base64$/ }).first().click();
    await page.getByText(/Invalid Base64 input/i).first()
        .waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileJwtDecoder(page) {
    await page.getByRole("button", { name: /Try Example/i }).first().click();
    await expectTextareaValue(page, /"name": "Alice Chen"/, "mobile jwt decoded payload");
    await clickCopyAndExpectToast(
        page,
        page.getByRole("button", { name: /copy:\s*(header|payload)/i }).first(),
        "mobile JWT header copy",
    );

    await page.locator("textarea").first().fill("bad.token");
    await page.getByText(/Invalid JWT format/i).first()
        .waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileMarkdownPreview(page) {
    const editor = page.getByRole("textbox", { name: /Markdown Source|MD Source|Markdown/i }).first();
    await editor.waitFor({ state: "visible", timeout: 15_000 });
    await editor.fill("# Mobile preview\n\n**Works** locally.");

    await page.getByRole("button", { name: /Preview/i }).first().click();
    await page.getByRole("region", { name: /Preview/i }).first()
        .waitFor({ state: "visible", timeout: 15_000 });

    await clickCopyAndExpectToast(
        page,
        page.getByRole("button", { name: /Copy MD/i }).first(),
        "mobile Markdown source copy",
    );
}

async function assertMobileRegexTester(page) {
    const pattern = page.locator('input[placeholder="pattern"]').first();
    const flags = page.locator('input[placeholder="g, i, m"]').first();
    const testString = page.locator('textarea[placeholder="Paste text here to test against the regular expression..."]').first();

    await pattern.fill("([A-Z][a-z]+)(\\d)");
    await flags.fill("g");
    await testString.fill("Ada1 Bob2");
    await page.getByText("Ada1").first().waitFor({ state: "visible", timeout: 15_000 });
    await page.getByText("Bob2").first().waitFor({ state: "visible", timeout: 15_000 });

    await pattern.fill("[");
    await page.getByText(/Fix syntax to view matches/i).first().waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileAllTools(page) {
    await page.getByRole("button", { name: /Show filters/i }).first().click();
    await page.getByRole("group", { name: /Input type/i }).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.getByRole("button", { name: /^File$/ }).first().click();
    await page.getByText(/Active filters/i).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('a[href="/en/json-formatter"]').first().waitFor({ state: "visible", timeout: 15_000 });
    await page.getByRole("button", { name: /Clear filters/i }).first().click();
    await page.getByText(/123 tools/i).first().waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileCrontabGenerator(page) {
    const rawExpression = page.getByRole("textbox", { name: /^Raw Expression Input$/ }).first();
    await rawExpression.waitFor({ state: "visible", timeout: 15_000 });
    await rawExpression.fill("*/15 * * * *");
    await page.getByText(/Every 15 minutes/i).first().waitFor({ state: "visible", timeout: 15_000 });
    await clickCopyAndExpectToast(
        page,
        page.getByRole("button", { name: /^Copy Expression$/ }).first(),
        "mobile cron expression copy",
    );

    await rawExpression.fill("* *");
    await page.getByText(/Invalid cron expression/i).first()
        .waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileToolPageJourneys(browser, baseUrl) {
    const journeys = [
        { route: "/en/all-tools", run: assertMobileAllTools },
        { route: "/en/json-formatter", run: assertMobileJsonFormatter },
        { route: "/en/base64-encode-decode", run: assertMobileBase64 },
        { route: "/en/jwt-decoder", run: assertMobileJwtDecoder },
        { route: "/en/markdown-preview", run: assertMobileMarkdownPreview },
        { route: "/en/regex-tester", run: assertMobileRegexTester },
        { route: "/en/crontab-generator", run: assertMobileCrontabGenerator },
    ];

    for (const viewport of MOBILE_TOOL_VIEWPORTS) {
        const context = await browser.newContext({
            serviceWorkers: "block",
            viewport,
            isMobile: true,
        });

        try {
            await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
            for (const journey of journeys) {
                await assertMobileToolJourney(context, baseUrl, viewport, journey.route, journey.run);
            }
        } finally {
            await context.close();
        }
    }
}

async function assertBase64PipelineHandoffJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto(`${baseUrl}/en/base64-encode-decode`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    const input = page.locator("textarea").first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await input.fill("hello pipeline");

    await page.getByRole("button", { name: /^Encode Base64$/ }).first().click();
    const output = page.locator("textarea").nth(1);
    await output.waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForFunction(() => {
        const textareas = Array.from(document.querySelectorAll("textarea"));
        return textareas.some((node) => node.value.includes("aGVsbG8gcGlwZWxpbmU="));
    }, null, { timeout: 15_000 });

    const handoffMenu = page.getByRole("button", { name: /Send to/i }).first();
    await handoffMenu.waitFor({ state: "visible", timeout: 15_000 });
    await handoffMenu.click();

    const pipelineLink = page.locator('a[data-analytics-id="to_pipeline_builder"]').first();
    await pipelineLink.waitFor({ state: "visible", timeout: 15_000 });
    await Promise.all([
        page.waitForURL((url) => url.pathname === "/en/pipeline-builder", { timeout: 15_000 }),
        pipelineLink.click(),
    ]);

    await page.waitForSelector("main", { timeout: 15_000 });
    await expectTextareaValue(page, /aGVsbG8gcGlwZWxpbmU=/, "pipeline handoff initial input");
    await assertBasicAccessibility(page, "/en/pipeline-builder handoff");

    if (runtimeErrors.length > 0) {
        throw new Error(`Base64 -> Pipeline Builder handoff triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function expectTextareaValue(page, pattern, label) {
    await page.waitForFunction((source) => {
        const regex = new RegExp(source);
        return Array.from(document.querySelectorAll("textarea")).some((node) => regex.test(node.value));
    }, pattern.source, { timeout: 15_000 }).catch(() => {
        throw new Error(`Expected textarea value matching ${pattern} for ${label}.`);
    });
}

async function assertPipelineRecipeJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto(`${baseUrl}/en/pipeline-builder`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    await page.getByRole("button", { name: /Try Example/i }).first().click();
    await page.getByLabel("Recipe name").fill("Smoke saved recipe");
    await page.getByLabel("Initial input").fill('{ "apiKey": "runtime-secret-value-987", "ok": true }');
    await page.getByRole("button", { name: /Run Recipe/i }).first().click();
    await page.waitForFunction(() => {
        const readonlyOutput = Array.from(document.querySelectorAll("textarea")).find((node) => node.readOnly);
        return Boolean(readonlyOutput?.value.trim()) && document.body.innerText.includes("OK");
    }, null, { timeout: 15_000 });

    const saveButton = page.getByRole("button", { name: /^Save$/ }).first();
    await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.some((button) => button.textContent?.trim() === "Save" && !button.disabled);
    }, null, { timeout: 15_000 });
    await saveButton.click();
    await page.waitForFunction(() => {
        const select = document.querySelector("[aria-label='Select saved recipe']");
        if (!(select instanceof HTMLSelectElement)) return false;
        return Array.from(select.options).some((option) => option.textContent?.trim() === "Smoke saved recipe");
    }, null, { timeout: 15_000 });

    const storedRecipes = await page.evaluate(async () => {
        return await new Promise((resolve, reject) => {
            const request = indexedDB.open("byteflow-pipeline-recipes");
            request.onerror = () => reject(request.error ?? new Error("Unable to open recipe store."));
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction("recipes", "readonly");
                const getAll = tx.objectStore("recipes").getAll();
                getAll.onerror = () => reject(getAll.error ?? new Error("Unable to read saved recipes."));
                getAll.onsuccess = () => {
                    db.close();
                    resolve(getAll.result);
                };
            };
        });
    });
    const serializedSavedRecipes = JSON.stringify(storedRecipes);
    if (!serializedSavedRecipes.includes("Smoke saved recipe")) {
        throw new Error("Pipeline Builder did not save the smoke recipe locally.");
    }
    if (serializedSavedRecipes.includes("runtime-secret-value-987")) {
        throw new Error("Pipeline Builder saved runtime input in IndexedDB.");
    }

    await page.getByLabel("Recipe name").fill("Unsaved scratch recipe");
    await page.getByLabel("Select saved recipe").selectOption({ label: "Smoke saved recipe" });
    await page.getByRole("button", { name: /^Load$/ }).click();
    await page.waitForFunction(() => {
        const input = document.querySelector("#recipe-name");
        return input instanceof HTMLInputElement && input.value === "Smoke saved recipe";
    }, null, { timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /^Export JSON$/ }).first().click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    if (!downloadPath) {
        throw new Error("Pipeline Builder export did not produce a downloadable file.");
    }
    const exportedRecipeJson = await readFile(downloadPath, "utf8");
    const exportedRecipe = JSON.parse(exportedRecipeJson);
    if (exportedRecipeJson.includes("runtime-secret-value-987")) {
        throw new Error("Pipeline Builder exported runtime input in recipe JSON.");
    }
    if (!Array.isArray(exportedRecipe.steps) || exportedRecipe.steps.length < 2) {
        throw new Error("Pipeline Builder export did not include recipe steps.");
    }

    await page.locator('input[type="file"]').setInputFiles({
        name: "smoke-recipe.json",
        mimeType: "application/json",
        buffer: Buffer.from(exportedRecipeJson),
    });
    await page.waitForFunction(() => {
        const input = document.querySelector("#recipe-name");
        return input instanceof HTMLInputElement && input.value === "Smoke saved recipe";
    }, null, { timeout: 15_000 });
    await page.getByRole("button", { name: /Run Recipe/i }).first().click();
    await page.waitForFunction(() => document.body.innerText.includes("OK"), null, { timeout: 15_000 });
    await assertBasicAccessibility(page, "/en/pipeline-builder recipe");

    if (runtimeErrors.length > 0) {
        throw new Error(`Pipeline recipe journey triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function assertMonacoFallbackJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto(`${baseUrl}/en/csv-json-converter`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    const textareas = page.locator("textarea");
    await textareas.first().waitFor({ state: "visible", timeout: 15_000 });
    await textareas.first().fill("id,name\n1,Ada");
    await page.getByRole("button", { name: /^Convert$/ }).first().click();
    await expectTextareaValue(page, /"name": "Ada"/, "csv-json converter output");
    await assertBasicAccessibility(page, "/en/csv-json-converter");

    if (runtimeErrors.length > 0) {
        throw new Error(`Monaco fallback journey triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function assertMobileCommandPaletteJourney(browser, baseUrl) {
    const context = await browser.newContext({
        serviceWorkers: "block",
        viewport: { width: 390, height: 844 },
        isMobile: true,
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    try {
        await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });
        const commandInput = await openCommandPalette(page);
        await commandInput.fill("base64");
        const base64Item = page.locator('[data-slot="command-item"]').filter({ hasText: /Base64/i }).first();
        await base64Item.waitFor({ state: "visible", timeout: 15_000 });
        await Promise.all([
            page.waitForURL(`${baseUrl}/en/base64-encode-decode`, { timeout: 15_000 }),
            base64Item.click(),
        ]);
        await page.waitForSelector("main", { timeout: 15_000 });
        await assertBasicAccessibility(page, "/en mobile command palette");

        if (runtimeErrors.length > 0) {
            throw new Error(`Mobile command palette journey triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
        }
    } finally {
        await page.close();
        await context.close();
    }
}

async function assertLocaleSwitchJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto(`${baseUrl}/en/json-formatter?smoke=1`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    const languageTrigger = page.getByRole("button", { name: /^Language:/ }).first();
    await languageTrigger.waitFor({ state: "visible", timeout: 15_000 });
    await languageTrigger.click();

    const zhCnOption = page.locator('[data-slot="dropdown-menu-item"]').filter({ hasText: "简体中文" }).first();
    await zhCnOption.waitFor({ state: "visible", timeout: 15_000 });

    await Promise.all([
        page.waitForURL(
            (url) => url.pathname === "/zh-CN/json-formatter" && url.searchParams.get("smoke") === "1",
            { timeout: 15_000 },
        ),
        zhCnOption.click(),
    ]);

    await page.waitForSelector("main", { timeout: 15_000 });
    if (runtimeErrors.length > 0) {
        throw new Error(`Locale switch journey triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
    }

    await page.close();
}

async function assertPwaShellJourney(browser, baseUrl) {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    const runtimeErrors = [];
    let contextOffline = false;
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    try {
        await page.goto(`${baseUrl}/en`, { waitUntil: "networkidle" });
        await page.waitForSelector("main", { timeout: 15_000 });

        const manifestHref = await page.locator('link[rel="manifest"]').first().getAttribute("href");
        if (manifestHref !== "/manifest.json") {
            throw new Error(`Expected default manifest link to be /manifest.json, found ${manifestHref || "none"}`);
        }

        const registration = await page.evaluate(async () => {
            if (!("serviceWorker" in navigator)) return null;
            const ready = await navigator.serviceWorker.ready;
            return {
                scope: ready.scope,
                activeScriptUrl: ready.active?.scriptURL || "",
            };
        });
        if (!registration?.activeScriptUrl.endsWith("/sw.js")) {
            throw new Error("Service worker did not become active for the PWA shell.");
        }

        const waitForController = async () => {
            const deadline = Date.now() + 15_000;

            while (Date.now() < deadline) {
                try {
                    const isControlled = await page.evaluate(() =>
                        "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller),
                    );
                    if (isControlled) return true;
                } catch {
                    // The app reloads on controllerchange; retry after navigation settles.
                    await page.waitForLoadState("domcontentloaded").catch(() => {});
                }

                await wait(250);
            }

            return false;
        };

        let isControlled = await waitForController();
        if (!isControlled) {
            await page.reload({ waitUntil: "networkidle" });
            isControlled = await waitForController();
        }
        if (!isControlled) {
            throw new Error("Service worker is active but did not control the PWA smoke page.");
        }

        await page.goto(`${baseUrl}/en/json-formatter`, { waitUntil: "networkidle" });
        await page.waitForSelector("main", { timeout: 15_000 });
        isControlled = await waitForController();
        if (!isControlled) {
            throw new Error("Service worker stopped controlling the PWA smoke page before offline navigation.");
        }

        const cacheBucketsBeforeOffline = await page.evaluate(async () =>
            (await caches.keys()).filter((key) => key.startsWith("byteflow-")).sort(),
        );
        for (const requiredBucket of [
            "byteflow-app-shell-v",
            "byteflow-manifest-icons-v",
            "byteflow-runtime-pages-v",
            "byteflow-tool-chunks-v",
        ]) {
            if (!cacheBucketsBeforeOffline.some((key) => key.startsWith(requiredBucket))) {
                throw new Error(`PWA smoke did not find cache bucket ${requiredBucket}. Found: ${cacheBucketsBeforeOffline.join(", ")}`);
            }
        }

        await context.setOffline(true);
        contextOffline = true;

        const offlineToolResult = await page.evaluate(async (targetUrl) => {
            try {
                const response = await fetch(targetUrl, {
                    headers: { accept: "text/html" },
                });
                const bodyText = await response.text();
                return {
                    ok: response.ok,
                    status: response.status,
                    bodyText,
                    error: "",
                };
            } catch (error) {
                return {
                    ok: false,
                    status: 0,
                    bodyText: "",
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        }, `${baseUrl}/en/json-formatter`);
        if (!offlineToolResult.ok || !/JSON Formatter/i.test(offlineToolResult.bodyText)) {
            throw new Error(`Offline local tool shell did not render from cache. Status: ${offlineToolResult.status}; error: ${offlineToolResult.error || "none"}`);
        }

        const externalRequestProbe = await page.evaluate(async () => {
            try {
                await fetch("https://example.com/byteflow-pwa-external-probe", {
                    cache: "no-store",
                    mode: "no-cors",
                });
                return { reachedNetwork: true, error: "" };
            } catch (error) {
                return {
                    reachedNetwork: false,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        });
        if (externalRequestProbe.reachedNetwork) {
            throw new Error("External request probe unexpectedly succeeded while the PWA smoke context was offline.");
        }
        const externalProbeCached = await page.evaluate(async () => {
            const keys = await caches.keys();
            for (const key of keys) {
                const cache = await caches.open(key);
                const match = await cache.match("https://example.com/byteflow-pwa-external-probe");
                if (match) return key;
            }
            return "";
        });
        if (externalProbeCached) {
            throw new Error(`External request probe was cached in ${externalProbeCached}.`);
        }

        const offlineResult = await page.evaluate(async (targetUrl) => {
            try {
                const response = await fetch(targetUrl, {
                    headers: { accept: "text/html" },
                });
                const bodyText = await response.text();
                return {
                    ok: response.ok,
                    status: response.status,
                    bodyText,
                    error: "",
                };
            } catch (error) {
                return {
                    ok: false,
                    status: 0,
                    bodyText: "",
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        }, `${baseUrl}/en/not-cached-for-smoke-${Date.now()}`);
        if (!offlineResult.ok || !/offline/i.test(offlineResult.bodyText)) {
            throw new Error(`Offline fetch did not render the cached offline fallback. Status: ${offlineResult.status}; error: ${offlineResult.error || "none"}`);
        }

        await page.setContent(offlineResult.bodyText, {
            waitUntil: "domcontentloaded",
        });
        const bodyText = await page.locator("body").innerText({ timeout: 15_000 });
        if (!/offline/i.test(bodyText)) {
            throw new Error("Offline navigation did not render the cached offline fallback.");
        }

        if (contextOffline) {
            await context.setOffline(false);
            contextOffline = false;
        }

        await page.goto(`${baseUrl}/en/install-app`, { waitUntil: "networkidle" });
        await page.getByRole("button", { name: /Clear cached app files/i }).click();
        await page.getByText("Cached app files cleared.").waitFor({ state: "visible", timeout: 15_000 });
        const cacheBucketsAfterClear = await page.evaluate(async () =>
            (await caches.keys()).filter((key) => key.startsWith("byteflow-")),
        );
        if (cacheBucketsAfterClear.length > 0) {
            throw new Error(`Manual PWA cache clear left Byteflow caches behind: ${cacheBucketsAfterClear.join(", ")}`);
        }

        if (runtimeErrors.length > 0) {
            throw new Error(`PWA smoke triggered runtime errors:\n- ${runtimeErrors.join("\n- ")}`);
        }
    } finally {
        if (contextOffline) {
            await context.setOffline(false).catch(() => {});
        }
        await page.close();
        await context.close();
    }
}

async function runSmoke(baseUrl) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: "block" });

    try {
        await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });

        for (const route of DEFAULT_ROUTES) {
            await assertRouteRenders(context, baseUrl, route);
            console.log(`[playwright-smoke] PASS render: ${route}`);
        }

        await assertHomeNavigation(context, baseUrl, "en");
        console.log("[playwright-smoke] PASS navigation: /en -> /en/json-formatter");

        await assertHomeNavigation(context, baseUrl, "zh-CN");
        console.log("[playwright-smoke] PASS navigation: /zh-CN -> /zh-CN/json-formatter");

        await assertCommandPaletteJourney(context, baseUrl, "en");
        console.log("[playwright-smoke] PASS journey: command palette search -> open /en/json-formatter");

        await assertSkipLinkKeyboardPath(context, baseUrl);
        console.log("[playwright-smoke] PASS accessibility: skip link keyboard path");

        await assertInputProcessCopyJourney(context, baseUrl, "en");
        console.log("[playwright-smoke] PASS journey: /en/list-randomizer input -> process -> copy");

        await assertBase64PipelineHandoffJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: /en/base64-encode-decode -> /en/pipeline-builder handoff");

        await assertPipelineRecipeJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: /en/pipeline-builder template -> run");

        await assertMonacoFallbackJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: /en/csv-json-converter Monaco fallback -> convert");

        await assertLocaleSwitchJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: locale switch /en/json-formatter -> /zh-CN/json-formatter");

        await assertMobileCommandPaletteJourney(browser, baseUrl);
        console.log("[playwright-smoke] PASS mobile journey: command palette -> /en/base64-encode-decode");

        await assertMobileToolPageJourneys(browser, baseUrl);
        console.log("[playwright-smoke] PASS mobile journeys: JSON/Base64/JWT/Regex/Cron tool pages");
    } finally {
        await context.close();
        await browser.close();
    }
}

async function runPwaSmoke(baseUrl) {
    const browser = await chromium.launch({ headless: true });
    try {
        await assertPwaShellJourney(browser, baseUrl);
        console.log("[playwright-smoke] PASS pwa: service worker, cache buckets, offline fallback, and manual cache clear");
    } finally {
        await browser.close();
    }
}

async function main() {
    const { baseUrl, port, skipServer, includePwa } = parseArgs(process.argv.slice(2));
    let serverHandle = null;

    try {
        if (!skipServer) {
            serverHandle = startStaticServer(port);
            await waitForServer(baseUrl);
            console.log(`[playwright-smoke] Static server ready at ${baseUrl}`);
        }

        await runSmoke(baseUrl);
        if (includePwa) {
            await runPwaSmoke(baseUrl);
        }
        console.log("[playwright-smoke] PASS: critical routes render and navigate correctly");
    } catch (error) {
        console.error("[playwright-smoke] FAILED");
        if (serverHandle) {
            const { stdoutTail, stderrTail } = serverHandle.getOutput();
            if (stdoutTail.trim()) {
                console.error("[playwright-smoke] static server stdout tail:");
                console.error(stdoutTail.trim());
            }
            if (stderrTail.trim()) {
                console.error("[playwright-smoke] static server stderr tail:");
                console.error(stderrTail.trim());
            }
        }

        console.error(error instanceof Error ? error.stack || error.message : String(error));
        process.exitCode = 1;
    } finally {
        if (serverHandle) {
            await stopServer(serverHandle.server);
        }
    }
}

main();
