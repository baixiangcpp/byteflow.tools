import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import axe from "axe-core";
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
const MOBILE_REVIEW_VIEWPORTS = [
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
];
const MOBILE_REVIEW_ROUTES = [
    "/en",
    "/en/all-tools",
    "/en/data-code-formats",
    "/en/json-formatter",
    "/en/pipeline-builder",
    "/en/trust-center",
    "/en/install-app",
];
const AXE_REVIEW_ROUTES = [
    "/en",
    "/en/all-tools",
    "/en/json-formatter",
    "/en/pipeline-builder",
    "/en/trust-center",
    "/en/install-app",
];
const INPUT_INTENT_AUDIT_ROUTES = [
    { route: "/en/qr-code-generator", requiredIntents: ["shortText", "scalar"] },
    { route: "/en/base64-encode-decode", requiredIntents: ["payload", "generatedOutput"] },
    { route: "/en/regex-tester", requiredIntents: ["scalar", "shortText", "payload"] },
    { route: "/en/json-formatter", requiredIntents: ["workbench", "payload"] },
    { route: "/en/csv-json-converter", requiredIntents: ["workbench", "payload", "generatedOutput"] },
    { route: "/en/jwt-decoder", requiredIntents: ["workbench", "payload", "generatedOutput"] },
    { route: "/en/pipeline-builder", requiredIntents: ["workbench", "shortText", "payload", "generatedOutput"] },
];
const INPUT_INTENT_AUDIT_VIEWPORTS = [
    { width: 390, height: 844, mobile: true },
    { width: 1280, height: 900, mobile: false },
];
const ALL_TOOLS_FILTER_INTERACTION_BUDGET_MS = 2000;
const ALL_TOOLS_MOBILE_SCROLL_BUDGET_MS = 3500;
const ALL_TOOLS_MOBILE_MAX_FRAME_DELTA_MS = 500;
const FIRST_LOAD_CLS_BUDGET = 0.1;
const FIRST_LOAD_SETTLE_MS = 2_600;
const FIRST_LOAD_ARTIFACT_DIR = path.resolve(process.cwd(), "output/first-load-audit");
const FIRST_LOAD_AUDIT_CASES = [
    {
        id: "root-preferred-locale",
        route: "/",
        expectedPathname: "/",
        expectedLang: "en",
        theme: "dark",
        colorScheme: "dark",
        preferredLocale: "zh-CN",
    },
    {
        id: "qr-light",
        route: "/en/qr-code-generator",
        expectedPathname: "/en/qr-code-generator",
        expectedLang: "en",
        theme: "light",
        colorScheme: "dark",
        warmReload: true,
    },
    {
        id: "json-dark",
        route: "/en/json-formatter",
        expectedPathname: "/en/json-formatter",
        expectedLang: "en",
        theme: "dark",
        colorScheme: "light",
    },
    {
        id: "all-tools-system",
        route: "/en/all-tools",
        expectedPathname: "/en/all-tools",
        expectedLang: "en",
        theme: "system",
        colorScheme: "light",
    },
    {
        id: "all-tools-personalized",
        route: "/en/all-tools",
        expectedPathname: "/en/all-tools",
        expectedLang: "en",
        theme: "dark",
        colorScheme: "dark",
        storage: {
            "byteflow:tools:favorites": JSON.stringify([
                { toolKey: "json_formatter", updatedAt: "2026-07-01T00:00:00.000Z" },
                { toolKey: "base64_encode_decode", updatedAt: "2026-07-01T00:00:00.000Z" },
                { toolKey: "uuid_generator", updatedAt: "2026-07-01T00:00:00.000Z" },
            ]),
            "byteflow:tools:recent": JSON.stringify([
                { toolKey: "qr_code_generator", updatedAt: "2026-07-01T00:00:00.000Z" },
                { toolKey: "json_formatter", updatedAt: "2026-07-01T00:00:00.000Z" },
            ]),
        },
    },
    {
        id: "qr-zh-cn-system",
        route: "/zh-CN/qr-code-generator",
        expectedPathname: "/zh-CN/qr-code-generator",
        expectedLang: "zh-CN",
        theme: "system",
        colorScheme: "dark",
        warmReload: true,
    },
];
const FIRST_LOAD_AUDIT_PROFILES = [
    {
        id: "mobile-390x844",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        caseIds: FIRST_LOAD_AUDIT_CASES.map((testCase) => testCase.id),
    },
    {
        id: "desktop-1280x800",
        viewport: { width: 1280, height: 800 },
        isMobile: false,
        caseIds: ["root-preferred-locale", "all-tools-system", "qr-zh-cn-system"],
    },
];
const GENERATED_TOOL_INDEX_PATH = path.resolve(process.cwd(), "src/generated/tool-index.json");

function getExpectedToolCount() {
    try {
        const rawIndex = JSON.parse(readFileSync(GENERATED_TOOL_INDEX_PATH, "utf8"));
        const count = Number(rawIndex?.counts?.canonicalTools);
        if (Number.isFinite(count) && count > 0) return count;
    } catch (error) {
        throw new Error(`[playwright-smoke] Unable to read generated tool count from ${GENERATED_TOOL_INDEX_PATH}: ${error.message}`);
    }

    throw new Error(`[playwright-smoke] Missing counts.canonicalTools in ${GENERATED_TOOL_INDEX_PATH}`);
}

const EXPECTED_TOOL_COUNT = getExpectedToolCount();

function createRuntimeObserver(page, label, baseUrl = "") {
    const runtimeErrors = [];
    const appOrigin = baseUrl ? new URL(baseUrl).origin : "";
    const criticalResourceTypes = new Set(["document", "script", "stylesheet", "image", "font"]);

    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
        const text = message.text();
        if (message.type() === "error" && !text.startsWith("Failed to load resource:")) {
            runtimeErrors.push(`console.error: ${message.text()}`);
        }
    });
    page.on("requestfailed", (request) => {
        const url = request.url();
        const sameOrigin = appOrigin && url.startsWith(`${appOrigin}/`);
        const errorText = request.failure()?.errorText || "unknown";
        if ((sameOrigin || url.startsWith("/") || url.includes("/_next/")) && errorText !== "net::ERR_ABORTED") {
            runtimeErrors.push(`request failed: ${request.method()} ${url} (${errorText})`);
        }
    });
    page.on("response", (response) => {
        const request = response.request();
        const url = response.url();
        const sameOrigin = appOrigin && url.startsWith(`${appOrigin}/`);
        if (sameOrigin && response.status() >= 400 && criticalResourceTypes.has(request.resourceType())) {
            runtimeErrors.push(`response failed: ${response.status()} ${request.method()} ${url}`);
        }
    });

    return {
        errors: runtimeErrors,
        assertClean() {
            if (runtimeErrors.length > 0) {
                throw new Error(`${label} triggered runtime, console, or request errors:\n- ${runtimeErrors.join("\n- ")}`);
            }
        },
    };
}

function parseArgs(argv) {
    const args = {
        port: DEFAULT_PORT,
        baseUrl: "",
        skipServer: false,
        includePwa: false,
        firstLoadOnly: false,
        writeFirstLoadArtifacts: false,
        inputIntentsOnly: false,
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

        if (arg === "--first-load-only") {
            args.firstLoadOnly = true;
            continue;
        }

        if (arg === "--first-load-artifacts") {
            args.writeFirstLoadArtifacts = true;
            continue;
        }

        if (arg === "--input-intents-only") {
            args.inputIntentsOnly = true;
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
    const runtime = createRuntimeObserver(page, `Route ${route}`, baseUrl);

    const targetUrl = `${baseUrl}${route}`;
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    if (!response || !response.ok()) {
        throw new Error(`Route ${route} failed to load (status: ${response ? response.status() : "no_response"})`);
    }

    await page.waitForSelector("main", { timeout: 15_000 });
    runtime.assertClean();

    await page.close();
}

function expectedResolvedTheme(testCase) {
    return testCase.theme === "system" ? testCase.colorScheme : testCase.theme;
}

async function installFirstLoadInstrumentation(context, testCase) {
    await context.addInitScript(({ preferredLocale, storage, theme }) => {
        try {
            localStorage.setItem("theme", theme);
            if (preferredLocale) {
                localStorage.setItem("byteflow:preferred-locale", preferredLocale);
            }
            for (const [key, value] of Object.entries(storage || {})) {
                localStorage.setItem(key, value);
            }
        } catch {
            // The audit still validates the default path when storage is unavailable.
        }

        const audit = {
            layoutShiftSupported: false,
            shifts: [],
            themeChanges: [],
        };
        window.__byteflowFirstLoadAudit = audit;

        const readTheme = () => ({
            className: document.documentElement?.className || "",
            colorScheme: document.documentElement?.style.colorScheme || "",
        });
        const recordTheme = () => audit.themeChanges.push({
            startTime: performance.now(),
            ...readTheme(),
        });
        const observeThemeRoot = () => {
            if (!document.documentElement) return false;
            recordTheme();
            new MutationObserver(recordTheme).observe(document.documentElement, {
                attributeFilter: ["class", "style"],
                attributes: true,
            });
            return true;
        };
        if (!observeThemeRoot()) {
            const rootObserver = new MutationObserver(() => {
                if (observeThemeRoot()) rootObserver.disconnect();
            });
            rootObserver.observe(document, { childList: true, subtree: true });
        }

        const supportedEntryTypes = PerformanceObserver.supportedEntryTypes || [];
        audit.layoutShiftSupported = supportedEntryTypes.includes("layout-shift");
        if (!audit.layoutShiftSupported) return;

        const copyRect = (rect) => ({
            height: rect.height,
            width: rect.width,
            x: rect.x,
            y: rect.y,
        });
        const describeNode = (node) => {
            if (!(node instanceof Element)) return "unknown";
            if (node.id) return `#${node.id}`;
            for (const attribute of [
                "data-all-tools-personalization",
                "data-all-tools-card",
                "data-navbar-controls-footprint",
                "data-navbar-language-footprint",
                "data-navbar-theme-footprint",
                "data-tool-global-actions",
            ]) {
                if (node.hasAttribute(attribute)) return `[${attribute}]`;
            }
            const classes = Array.from(node.classList).slice(0, 3).join(".");
            return `${node.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
        };

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.hadRecentInput) continue;
                audit.shifts.push({
                    startTime: entry.startTime,
                    value: entry.value,
                    sources: (entry.sources || []).map((source) => ({
                        currentRect: copyRect(source.currentRect),
                        node: describeNode(source.node),
                        previousRect: copyRect(source.previousRect),
                    })),
                });
            }
        });
        observer.observe({ type: "layout-shift", buffered: true });
    }, {
        preferredLocale: testCase.preferredLocale || "",
        storage: testCase.storage || {},
        theme: testCase.theme,
    });
}

function calculateSessionWindowCls(entries) {
    let currentScore = 0;
    let currentWindowStart = 0;
    let lastEntryTime = 0;
    let maxScore = 0;

    for (const entry of [...entries].sort((left, right) => left.startTime - right.startTime)) {
        const startsNewWindow = currentScore === 0
            || entry.startTime - lastEntryTime > 1_000
            || entry.startTime - currentWindowStart > 5_000;
        if (startsNewWindow) {
            currentScore = entry.value;
            currentWindowStart = entry.startTime;
        } else {
            currentScore += entry.value;
        }
        lastEntryTime = entry.startTime;
        maxScore = Math.max(maxScore, currentScore);
    }

    return maxScore;
}

async function capturePreHydrationState(browser, baseUrl, profile, testCase) {
    const context = await browser.newContext({
        colorScheme: testCase.colorScheme,
        isMobile: profile.isMobile,
        serviceWorkers: "block",
        viewport: profile.viewport,
    });
    await installFirstLoadInstrumentation(context, testCase);
    const page = await context.newPage();

    try {
        await page.route("**/*", async (route) => {
            const request = route.request();
            const pathname = new URL(request.url()).pathname;
            if (request.resourceType() === "script" && pathname.startsWith("/_next/")) {
                await route.abort();
                return;
            }
            await route.continue();
        });

        const response = await page.goto(`${baseUrl}${testCase.route}`, { waitUntil: "domcontentloaded" });
        if (!response || !response.ok()) {
            throw new Error(`Pre-hydration route ${testCase.route} failed with ${response?.status() || "no response"}.`);
        }
        await page.waitForSelector("main", { timeout: 30_000 });
        await page.evaluate(() => document.fonts?.ready);
        await page.waitForTimeout(100);

        return {
            heading: (await page.locator("h1").first().textContent())?.replace(/\s+/g, " ").trim() || "",
            screenshot: await page.screenshot({ animations: "disabled", fullPage: false }),
            theme: await page.evaluate(() => ({
                className: document.documentElement.className,
                colorScheme: document.documentElement.style.colorScheme,
            })),
        };
    } finally {
        await context.close();
    }
}

async function captureHydratedState(browser, baseUrl, profile, testCase) {
    const context = await browser.newContext({
        colorScheme: testCase.colorScheme,
        isMobile: profile.isMobile,
        serviceWorkers: "block",
        viewport: profile.viewport,
    });
    await installFirstLoadInstrumentation(context, testCase);
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, `First-load audit ${profile.id}/${testCase.id}`, baseUrl);

    try {
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        await cdp.send("Network.emulateNetworkConditions", {
            connectionType: "cellular4g",
            downloadThroughput: (1.6 * 1024 * 1024) / 8,
            latency: 100,
            offline: false,
            uploadThroughput: (750 * 1024) / 8,
        });
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

        const response = await page.goto(`${baseUrl}${testCase.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        if (!response || !response.ok()) {
            throw new Error(`Hydrated route ${testCase.route} failed with ${response?.status() || "no response"}.`);
        }
        await page.waitForSelector("main", { timeout: 30_000 });
        await page.waitForTimeout(FIRST_LOAD_SETTLE_MS);
        await page.evaluate(() => document.fonts?.ready);

        const metrics = await page.evaluate(() => ({
            audit: window.__byteflowFirstLoadAudit,
            firstContentfulPaint: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
            heading: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() || "",
            lang: document.documentElement.lang,
            pathname: window.location.pathname,
            theme: {
                className: document.documentElement.className,
                colorScheme: document.documentElement.style.colorScheme,
            },
        }));
        const screenshot = await page.screenshot({ animations: "disabled", fullPage: false });
        runtime.assertClean();
        return { metrics, screenshot };
    } finally {
        await context.close();
    }
}

async function captureWarmReloadState(browser, baseUrl, profile, testCase) {
    const context = await browser.newContext({
        colorScheme: testCase.colorScheme,
        isMobile: profile.isMobile,
        serviceWorkers: "block",
        viewport: profile.viewport,
    });
    await installFirstLoadInstrumentation(context, testCase);
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, `Warm reload audit ${profile.id}/${testCase.id}`, baseUrl);

    try {
        const initialResponse = await page.goto(`${baseUrl}${testCase.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        if (!initialResponse || !initialResponse.ok()) {
            throw new Error(`Warm reload seed ${testCase.route} failed with ${initialResponse?.status() || "no response"}.`);
        }
        await page.waitForSelector("main", { timeout: 30_000 });
        await page.waitForTimeout(200);

        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

        const response = await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
        if (!response || !response.ok()) {
            throw new Error(`Warm reload ${testCase.route} failed with ${response?.status() || "no response"}.`);
        }
        await page.waitForSelector("main", { timeout: 30_000 });
        await page.waitForTimeout(FIRST_LOAD_SETTLE_MS);
        await page.evaluate(() => document.fonts?.ready);

        const metrics = await page.evaluate(() => ({
            audit: window.__byteflowFirstLoadAudit,
            firstContentfulPaint: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
            heading: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() || "",
            lang: document.documentElement.lang,
            pathname: window.location.pathname,
            theme: {
                className: document.documentElement.className,
                colorScheme: document.documentElement.style.colorScheme,
            },
        }));
        const screenshot = await page.screenshot({ animations: "disabled", fullPage: false });
        runtime.assertClean();
        return { metrics, screenshot };
    } finally {
        await context.close();
    }
}

function assertFirstLoadResult(profile, testCase, before, after) {
    const expectedTheme = expectedResolvedTheme(testCase);
    const shifts = after.metrics.audit?.shifts || [];
    const cls = calculateSessionWindowCls(shifts);
    const label = `${profile.id}/${testCase.id}`;
    const themeAtFirstContentfulPaint = [...(after.metrics.audit?.themeChanges || [])]
        .reverse()
        .find((entry) => entry.startTime <= after.metrics.firstContentfulPaint);

    if (!after.metrics.audit?.layoutShiftSupported) {
        throw new Error(`${label} did not expose Chromium layout-shift entries.`);
    }
    if (cls >= FIRST_LOAD_CLS_BUDGET) {
        throw new Error(`${label} CLS ${cls.toFixed(4)} exceeded the ${FIRST_LOAD_CLS_BUDGET} budget. Sources: ${JSON.stringify(shifts)}`);
    }
    if (
        after.metrics.firstContentfulPaint === null
        || !themeAtFirstContentfulPaint?.className.split(/\s+/).includes(expectedTheme)
        || themeAtFirstContentfulPaint.colorScheme !== expectedTheme
    ) {
        throw new Error(`${label} first contentful paint used ${JSON.stringify(themeAtFirstContentfulPaint)} instead of ${expectedTheme}.`);
    }
    if (!after.metrics.theme.className.split(/\s+/).includes(expectedTheme) || after.metrics.theme.colorScheme !== expectedTheme) {
        throw new Error(`${label} settled theme used ${JSON.stringify(after.metrics.theme)} instead of ${expectedTheme}.`);
    }
    if (!before.theme.className.split(/\s+/).includes(expectedTheme) || before.theme.colorScheme !== expectedTheme) {
        throw new Error(`${label} pre-hydration theme used ${JSON.stringify(before.theme)} instead of ${expectedTheme}.`);
    }
    if (after.metrics.pathname !== testCase.expectedPathname || after.metrics.lang !== testCase.expectedLang) {
        throw new Error(`${label} settled at ${after.metrics.pathname} (${after.metrics.lang}), expected ${testCase.expectedPathname} (${testCase.expectedLang}).`);
    }
    if (!before.heading || before.heading !== after.metrics.heading) {
        throw new Error(`${label} changed its first heading across hydration: ${JSON.stringify(before.heading)} -> ${JSON.stringify(after.metrics.heading)}.`);
    }
    if (before.screenshot.length < 2_000 || after.screenshot.length < 2_000) {
        throw new Error(`${label} produced an unexpectedly empty first-load screenshot.`);
    }

    return {
        cls,
        heading: after.metrics.heading,
        lang: after.metrics.lang,
        pathname: after.metrics.pathname,
        shifts,
        theme: after.metrics.theme,
        themeAtFirstContentfulPaint,
    };
}

async function writeFirstLoadCaseArtifacts(profile, testCase, before, after, warmAfter) {
    await mkdir(FIRST_LOAD_ARTIFACT_DIR, { recursive: true });
    const prefix = `${profile.id}-${testCase.id}`;
    await Promise.all([
        writeFile(path.join(FIRST_LOAD_ARTIFACT_DIR, `${prefix}-before-hydration.png`), before.screenshot),
        writeFile(path.join(FIRST_LOAD_ARTIFACT_DIR, `${prefix}-after-hydration.png`), after.screenshot),
        ...(warmAfter ? [writeFile(path.join(FIRST_LOAD_ARTIFACT_DIR, `${prefix}-warm-reload.png`), warmAfter.screenshot)] : []),
    ]);
}

async function assertFirstLoadStabilityMatrix(browser, baseUrl, { writeArtifacts = false } = {}) {
    const reports = [];
    for (const profile of FIRST_LOAD_AUDIT_PROFILES) {
        for (const caseId of profile.caseIds) {
            const testCase = FIRST_LOAD_AUDIT_CASES.find((candidate) => candidate.id === caseId);
            if (!testCase) throw new Error(`Unknown first-load audit case: ${caseId}`);

            const before = await capturePreHydrationState(browser, baseUrl, profile, testCase);
            const after = await captureHydratedState(browser, baseUrl, profile, testCase);
            const report = assertFirstLoadResult(profile, testCase, before, after);
            reports.push({ caseId, profileId: profile.id, ...report });
            let warmAfter = null;
            if (testCase.warmReload) {
                const warmReloadCase = { ...testCase, id: `${testCase.id}-warm-reload` };
                warmAfter = await captureWarmReloadState(browser, baseUrl, profile, testCase);
                const warmReport = assertFirstLoadResult(profile, warmReloadCase, before, warmAfter);
                reports.push({ caseId: warmReloadCase.id, profileId: profile.id, ...warmReport });
                console.log(`[playwright-smoke] PASS warm reload: ${profile.id}/${testCase.id} CLS=${warmReport.cls.toFixed(4)}`);
            }
            if (writeArtifacts) {
                await writeFirstLoadCaseArtifacts(profile, testCase, before, after, warmAfter);
            }
            console.log(`[playwright-smoke] PASS first load: ${profile.id}/${caseId} CLS=${report.cls.toFixed(4)}`);
        }
    }

    if (writeArtifacts) {
        await writeFile(
            path.join(FIRST_LOAD_ARTIFACT_DIR, "report.json"),
            `${JSON.stringify(reports, null, 2)}\n`,
            "utf8",
        );
    }
}

async function assertHomeNavigation(context, baseUrl, locale) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, `Navigation smoke for ${locale}`, baseUrl);

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
    runtime.assertClean();

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
    const runtime = createRuntimeObserver(page, `Command palette journey for ${locale}`, baseUrl);

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
    runtime.assertClean();

    await page.close();
}

async function assertInputProcessCopyJourney(context, baseUrl, locale) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, `Input/process/copy journey for ${locale}`, baseUrl);

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

    runtime.assertClean();

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
    const runtime = createRuntimeObserver(page, "Skip link keyboard path", baseUrl);

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

        runtime.assertClean();
    } finally {
        await page.close();
    }
}

async function assertHeaderKeyboardPaths(context, baseUrl) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "Header keyboard paths", baseUrl);

    try {
        await page.goto(`${baseUrl}/en/json-formatter?keyboard=1`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });

        const languageTrigger = page.getByRole("button", { name: /^Language:/ }).first();
        await languageTrigger.waitFor({ state: "visible", timeout: 15_000 });
        await languageTrigger.focus();
        await page.keyboard.press("Enter");
        const zhCnOption = page.locator('[data-slot="dropdown-menu-item"]').filter({ hasText: "简体中文" }).first();
        await zhCnOption.waitFor({ state: "visible", timeout: 15_000 });
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => {
            const active = document.activeElement;
            return active instanceof HTMLElement && active.getAttribute("aria-label")?.startsWith("Language:");
        }, null, { timeout: 5_000 });

        runtime.assertClean();
    } finally {
        await page.close();
    }
}

async function assertMobileNavigationKeyboardPath(browser, baseUrl) {
    const context = await browser.newContext({
        serviceWorkers: "block",
        viewport: { width: 390, height: 844 },
        isMobile: true,
    });
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "Mobile navigation keyboard path", baseUrl);

    try {
        await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });

        const menuTrigger = page.getByRole("button", { name: /Open Navigation/i }).first();
        await menuTrigger.waitFor({ state: "visible", timeout: 15_000 });
        await page.waitForFunction(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            return buttons.some((button) => /Open Navigation/i.test(button.textContent || button.getAttribute("aria-label") || "") && !button.disabled);
        }, null, { timeout: 15_000 });
        await menuTrigger.focus();
        await page.keyboard.press("Enter");

        const dialog = page.getByRole("dialog").first();
        await dialog.waitFor({ state: "visible", timeout: 15_000 });
        await dialog.getByRole("link", { name: /Pipeline Builder/i }).first().waitFor({ state: "visible", timeout: 15_000 });

        await page.keyboard.press("Tab");
        const focusedInsideDialog = await page.evaluate(() => {
            const dialog = document.querySelector("[data-slot='sheet-content']");
            return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement));
        });
        if (!focusedInsideDialog) {
            throw new Error("Mobile navigation drawer did not keep focus inside after Tab.");
        }

        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden", timeout: 5_000 });
        await page.waitForFunction(() => {
            const active = document.activeElement;
            return active instanceof HTMLElement && /Open Navigation/i.test(active.textContent || active.getAttribute("aria-label") || "");
        }, null, { timeout: 5_000 });

        runtime.assertClean();
    } finally {
        await page.close();
        await context.close();
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
    await button.scrollIntoViewIfNeeded();
    await button.evaluate((element) => {
        element.scrollIntoView({ block: "center", inline: "nearest" });
    });
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
    const routeLabel = `${route} mobile ${viewport.width}x${viewport.height}`;
    const runtime = createRuntimeObserver(page, routeLabel, baseUrl);

    try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });

        await runJourney(page, routeLabel);
        await assertBasicAccessibility(page, routeLabel);
        await assertMobileTouchTargets(page, routeLabel);
        await assertNoHorizontalOverflow(page, routeLabel);

        runtime.assertClean();
    } finally {
        await page.close();
    }
}

async function assertMobileReviewMatrix(browser, baseUrl) {
    for (const viewport of MOBILE_REVIEW_VIEWPORTS) {
        const context = await browser.newContext({
            serviceWorkers: "block",
            viewport,
            isMobile: viewport.width < 768,
        });

        try {
            for (const route of MOBILE_REVIEW_ROUTES) {
                const page = await context.newPage();
                const routeLabel = `${route} mobile review ${viewport.width}x${viewport.height}`;
                const runtime = createRuntimeObserver(page, routeLabel, baseUrl);

                try {
                    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
                    await page.waitForSelector("main", { timeout: 15_000 });
                    await assertBasicAccessibility(page, routeLabel);
                    await assertMobileTouchTargets(page, routeLabel);
                    await assertNoHorizontalOverflow(page, routeLabel);
                    runtime.assertClean();
                } finally {
                    await page.close();
                }
            }
        } finally {
            await context.close();
        }
    }
}

async function assertInputIntentSizingMatrix(browser, baseUrl) {
    for (const viewport of INPUT_INTENT_AUDIT_VIEWPORTS) {
        const context = await browser.newContext({
            serviceWorkers: "block",
            viewport: { width: viewport.width, height: viewport.height },
            isMobile: viewport.mobile,
        });

        try {
            for (const audit of INPUT_INTENT_AUDIT_ROUTES) {
                const page = await context.newPage();
                const routeLabel = `${audit.route} input intent ${viewport.width}x${viewport.height}`;
                const runtime = createRuntimeObserver(page, routeLabel, baseUrl);

                try {
                    await page.goto(`${baseUrl}${audit.route}`, { waitUntil: "domcontentloaded" });
                    await page.waitForSelector("main", { timeout: 15_000 });
                    await page.locator("[data-input-intent]").first().waitFor({ state: "attached", timeout: 15_000 });

                    const measurements = await page.evaluate(({ mobile }) => {
                        const isVisible = (element) => {
                            const style = window.getComputedStyle(element);
                            const rect = element.getBoundingClientRect();
                            return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
                        };
                        const nodes = Array.from(document.querySelectorAll("[data-input-intent]")).filter(isVisible);
                        const counts = {};
                        const issues = [];

                        for (const element of nodes) {
                            const intent = element.getAttribute("data-input-intent");
                            if (!intent) continue;
                            counts[intent] = (counts[intent] || 0) + 1;

                            const rect = element.getBoundingClientRect();
                            const tag = element.tagName.toLowerCase();
                            const field = ["input", "textarea", "select"].includes(tag);
                            if (intent === "scalar" && field) {
                                const target = element.closest("label") || element;
                                const targetRect = target.getBoundingClientRect();
                                const minimum = mobile ? 44 : 36;
                                if (targetRect.height + 0.5 < minimum || targetRect.width + 0.5 < minimum) {
                                    issues.push(`${intent} ${tag}: ${Math.round(targetRect.width)}x${Math.round(targetRect.height)}`);
                                }
                            }
                            if (intent === "shortText" && tag === "input" && rect.height + 0.5 < (mobile ? 44 : 44)) {
                                issues.push(`${intent} input height: ${Math.round(rect.height)}px`);
                            }
                            if (intent === "shortText" && tag === "textarea") {
                                const style = window.getComputedStyle(element);
                                const resize = style.resize;
                                if (rect.height + 0.5 < 144) issues.push(`${intent} textarea height: ${Math.round(rect.height)}px (min-height ${style.minHeight}; ${element.className})`);
                                if (!resize.includes("vertical") && resize !== "both") issues.push(`${intent} textarea resize: ${resize}`);
                            }
                            if (["payload", "generatedOutput"].includes(intent) && ["textarea", "pre"].includes(tag) && rect.height + 0.5 < 256) {
                                issues.push(`${intent} ${tag} height: ${Math.round(rect.height)}px`);
                            }
                        }

                        return { counts, issues };
                    }, { mobile: viewport.mobile });

                    for (const intent of audit.requiredIntents) {
                        if (!measurements.counts[intent]) {
                            throw new Error(`${routeLabel} did not render required ${intent} input intent.`);
                        }
                    }
                    if (measurements.issues.length > 0) {
                        throw new Error(`${routeLabel} input sizing failed:\n- ${measurements.issues.join("\n- ")}`);
                    }

                    await assertNoHorizontalOverflow(page, routeLabel);
                    const screenshot = await page.screenshot({ animations: "disabled", fullPage: false });
                    if (screenshot.byteLength < 5_000) {
                        throw new Error(`${routeLabel} sizing screenshot was unexpectedly blank (${screenshot.byteLength} bytes).`);
                    }
                    runtime.assertClean();
                } finally {
                    await page.close();
                }
            }
        } finally {
            await context.close();
        }
    }
}

async function assertAxeSeriousCriticalMatrix(browser, baseUrl) {
    const context = await browser.newContext({ serviceWorkers: "block" });

    try {
        for (const route of AXE_REVIEW_ROUTES) {
            const page = await context.newPage();
            const runtime = createRuntimeObserver(page, `Axe review ${route}`, baseUrl);

            try {
                await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
                await page.waitForSelector("main", { timeout: 15_000 });
                await page.addScriptTag({ content: axe.source });
                const violations = await page.evaluate(async () => {
                    const result = await window.axe.run(document, {
                        resultTypes: ["violations"],
                        rules: {
                            "color-contrast": { enabled: false },
                        },
                    });

                    return result.violations
                        .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
                        .map((violation) => {
                            const targets = violation.nodes
                                .slice(0, 3)
                                .flatMap((node) => node.target)
                                .join(", ");
                            return `${violation.id} (${violation.impact}): ${violation.help}${targets ? ` [${targets}]` : ""}`;
                        });
                });

                if (violations.length > 0) {
                    throw new Error(`Axe serious/critical violations for ${route}:\n- ${violations.join("\n- ")}`);
                }

                runtime.assertClean();
            } finally {
                await page.close();
            }
        }
    } finally {
        await context.close();
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

    const longKey = "x".repeat(220);
    await input.fill(JSON.stringify({ [longKey]: longKey }));
    await page.getByRole("button", { name: /^Format$/ }).first().click();
    await expectTextareaValue(page, new RegExp(longKey.slice(0, 60)), "mobile json formatter long output");
    await assertNoHorizontalOverflow(page, "mobile json formatter long output");
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

    await page.getByRole("radio", { name: /^Encode$/ }).first().click();
    await input.fill("https://example.com/" + "very-long-path-segment-".repeat(12));
    await page.getByRole("button", { name: /^Encode Base64$/ }).first().click();
    await assertNoHorizontalOverflow(page, "mobile base64 long URL output");
}

async function assertMobileJwtDecoder(page) {
    await page.getByRole("button", { name: /^Sample$/ }).first().click();
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
    const initialDomBudget = await page.evaluate(() => ({
        cards: document.querySelectorAll("[data-all-tools-card='true']").length,
        compactLinks: document.querySelectorAll("[data-all-tools-compact-link='true']").length,
    }));
    if (initialDomBudget.cards > 60 || initialDomBudget.compactLinks < 1) {
        throw new Error(`All Tools mobile DOM budget failed: ${initialDomBudget.cards} full cards, ${initialDomBudget.compactLinks} compact links.`);
    }

    const scrollMetrics = await page.evaluate(async () => {
        const frameDeltas = [];
        const longTasks = [];
        let previousFrame = performance.now();
        let observer = null;
        if (
            "PerformanceObserver" in window &&
            Array.isArray(PerformanceObserver.supportedEntryTypes) &&
            PerformanceObserver.supportedEntryTypes.includes("longtask")
        ) {
            observer = new PerformanceObserver((list) => {
                longTasks.push(...list.getEntries().map((entry) => entry.duration));
            });
            observer.observe({ entryTypes: ["longtask"] });
        }
        const waitFrame = () => new Promise((resolve) => {
            requestAnimationFrame((now) => {
                frameDeltas.push(now - previousFrame);
                previousFrame = now;
                resolve();
            });
        });

        const start = performance.now();
        const maxScroll = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0) - window.innerHeight;
        const step = Math.max(160, Math.floor(window.innerHeight / 2));
        for (let y = 0; y <= maxScroll; y += step) {
            window.scrollTo(0, y);
            await waitFrame();
        }
        window.scrollTo(0, 0);
        await waitFrame();
        observer?.disconnect();

        return {
            elapsedMs: performance.now() - start,
            longTaskCount: longTasks.length,
            maxFrameDeltaMs: Math.max(0, ...frameDeltas),
            maxLongTaskMs: Math.max(0, ...longTasks),
        };
    });
    if (
        scrollMetrics.elapsedMs > ALL_TOOLS_MOBILE_SCROLL_BUDGET_MS ||
        scrollMetrics.maxFrameDeltaMs > ALL_TOOLS_MOBILE_MAX_FRAME_DELTA_MS
    ) {
        throw new Error(
            `All Tools mobile scroll budget failed: ${Math.round(scrollMetrics.elapsedMs)}ms elapsed, ` +
            `${Math.round(scrollMetrics.maxFrameDeltaMs)}ms max frame delta, ` +
            `${scrollMetrics.longTaskCount} long tasks, ${Math.round(scrollMetrics.maxLongTaskMs)}ms max long task.`,
        );
    }

    await page.getByRole("button", { name: /Show filters/i }).first().click();
    const filterDialog = page.getByRole("dialog", { name: /Show filters/i }).first();
    await filterDialog.waitFor({ state: "visible", timeout: 15_000 });
    await filterDialog.getByRole("group", { name: /Input type/i }).first().waitFor({ state: "visible", timeout: 15_000 });
    const filterStart = Date.now();
    await filterDialog.getByRole("button", { name: /^File$/ }).first().click();
    await page.getByText(/Active filters/i).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('a[href="/en/json-formatter"]').first().waitFor({ state: "visible", timeout: 15_000 });
    const filterElapsedMs = Date.now() - filterStart;
    if (filterElapsedMs > ALL_TOOLS_FILTER_INTERACTION_BUDGET_MS) {
        throw new Error(`All Tools mobile filter interaction exceeded budget: ${filterElapsedMs}ms.`);
    }
    await filterDialog.getByRole("button", { name: /Clear filters/i }).first().click();
    await page.getByText(new RegExp(`${EXPECTED_TOOL_COUNT}\\s+tools`, "i")).first().waitFor({ state: "visible", timeout: 15_000 });
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

async function assertMobileImageResizer(page) {
    await page.getByRole("button", { name: /^Sample$/ }).first().click();
    await expectTextareaValue(page, /WEBP|1200|675/, "mobile image resizer output summary");
    await page.getByRole("button", { name: /^Download$/ }).first().waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileJsonDiffViewer(page) {
    await page.getByRole("button", { name: /^Format$/ }).first().click();
    await page.getByText(/Key Diff|Structural Changes/i).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.getByText(/Original \(A\)|Modified \(B\)/i).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.getByText(/version|features|port|analytics/i).first().waitFor({ state: "visible", timeout: 15_000 });
}

async function assertMobileTextDiffChecker(page) {
    await page.getByRole("button", { name: /^Clear$/ }).first().click();
    await page.getByText(/Original/i).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.getByText(/Modified/i).first().waitFor({ state: "visible", timeout: 15_000 });
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
        { route: "/en/image-resizer", run: assertMobileImageResizer },
        { route: "/en/json-diff-viewer", run: assertMobileJsonDiffViewer },
        { route: "/en/text-diff-checker", run: assertMobileTextDiffChecker },
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

async function assertBase64PipelineSafeNavigationJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "Base64 -> Pipeline Builder safe navigation", baseUrl);

    await page.goto(`${baseUrl}/en/base64-encode-decode`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    const input = page.locator("textarea").first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await input.fill("hello pipeline");

    await page.getByRole("button", { name: /^Encode Base64$/ }).first().click();
    const output = page.getByLabel("Output").first();
    await output.waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForFunction(() => {
        const outputNode = document.querySelector("[aria-label='Output']");
        const outputText = outputNode && "value" in outputNode ? outputNode.value : outputNode?.textContent;
        return outputText?.includes("aGVsbG8gcGlwZWxpbmU=");
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
    if (page.url().includes("aGVsbG8gcGlwZWxpbmU") || page.url().includes("hello%20pipeline")) {
        throw new Error("Base64 -> Pipeline Builder navigation exposed payload in the URL.");
    }
    await expectTextareaValueAbsent(page, /aGVsbG8gcGlwZWxpbmU=|hello pipeline/, "pipeline safe navigation");
    await assertBasicAccessibility(page, "/en/pipeline-builder safe navigation");

    runtime.assertClean();

    await page.close();
}

async function assertDownloadedFile(download, expectedFilename, kind) {
    if (download.suggestedFilename() !== expectedFilename) {
        throw new Error(`Expected ${expectedFilename}, received ${download.suggestedFilename()}.`);
    }

    const failure = await download.failure();
    if (failure) {
        throw new Error(`${expectedFilename} download failed: ${failure}`);
    }

    const downloadPath = await download.path();
    if (!downloadPath) {
        throw new Error(`${expectedFilename} did not produce a downloadable file.`);
    }

    const contents = await readFile(downloadPath);
    if (contents.length === 0) {
        throw new Error(`${expectedFilename} download was empty.`);
    }

    if (kind === "png" && !contents.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        throw new Error(`${expectedFilename} did not contain a PNG signature.`);
    }
    if (kind === "svg" && !contents.toString("utf8").includes("<svg")) {
        throw new Error(`${expectedFilename} did not contain SVG markup.`);
    }

    return downloadPath;
}

async function assertQrDownloadJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "QR code downloads", baseUrl);

    try {
        await page.goto(`${baseUrl}/en/qr-code-generator`, { waitUntil: "domcontentloaded" });
        await page.locator("textarea").first().fill("https://byteflow.tools/qr-download-smoke");

        const pngButton = page.getByRole("button", { name: "PNG", exact: true }).first();
        await page.waitForFunction(() => {
            const canvas = document.querySelector("canvas");
            const button = Array.from(document.querySelectorAll("button"))
                .find((candidate) => candidate.textContent?.trim() === "PNG");
            return canvas instanceof HTMLCanvasElement && canvas.width > 0 && button && !button.disabled;
        }, null, { timeout: 15_000 });
        const pngDownloadPromise = page.waitForEvent("download");
        await pngButton.click();
        const pngDownloadPath = await assertDownloadedFile(await pngDownloadPromise, "qr-code.png", "png");

        const svgDownloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "SVG", exact: true }).first().click();
        await assertDownloadedFile(await svgDownloadPromise, "qr-code.svg", "svg");

        const pageCountBeforeDecode = context.pages().length;
        await page.getByRole("tab", { name: "Decode image", exact: true }).click();
        const decodeInput = page.locator('input[type="file"][accept*=".png"]').first();
        await decodeInput.setInputFiles({
            name: "qr-code.png",
            mimeType: "image/png",
            buffer: await readFile(pngDownloadPath),
        });
        await page.waitForFunction((expectedPayload) => {
            const output = document.querySelector('[data-testid="qr-decoded-output"]')?.textContent?.trim();
            const error = document.querySelector('[data-testid="qr-decode-error"]')
                || Array.from(document.querySelectorAll('[role="alert"]')).find((node) => node.textContent?.trim());
            return output === expectedPayload || Boolean(error);
        }, "https://byteflow.tools/qr-download-smoke", { timeout: 15_000 });
        const decodeAlert = (await page.getByRole("alert").allTextContents()).filter((message) => message.trim());
        if (decodeAlert.length > 0) {
            throw new Error(`QR round-trip decode failed: ${decodeAlert.join(" ")}`);
        }
        if (context.pages().length !== pageCountBeforeDecode) {
            throw new Error("QR decoding opened the decoded URL without explicit user action.");
        }

        await decodeInput.setInputFiles({
            name: "blank.png",
            mimeType: "image/png",
            buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
        });
        await page.getByRole("alert").filter({ hasText: "No QR code was found" }).waitFor({ timeout: 15_000 });
        runtime.assertClean();
    } finally {
        await page.close();
    }
}

async function expectTextareaValueAbsent(page, pattern, label) {
    const found = await page.evaluate((source) => {
        const regex = new RegExp(source);
        const textareaMatches = Array.from(document.querySelectorAll("textarea")).some((node) => regex.test(node.value));
        const labelledOutputMatches = ["Output", "Final output"].some((name) => {
            const node = document.querySelector(`[aria-label='${name}']`);
            return regex.test(node && "value" in node ? node.value : node?.textContent || "");
        });
        return textareaMatches || labelledOutputMatches;
    }, pattern.source);

    if (found) {
        throw new Error(`Expected no textarea or output value matching ${pattern} for ${label}.`);
    }
}

async function expectTextareaValue(page, pattern, label) {
    await page.waitForFunction((source) => {
        const regex = new RegExp(source);
        const textareaMatches = Array.from(document.querySelectorAll("textarea")).some((node) => regex.test(node.value));
        const labelledOutputMatches = ["Output", "Final output"].some((name) => {
            const node = document.querySelector(`[aria-label='${name}']`);
            return regex.test(node && "value" in node ? node.value : node?.textContent || "");
        });
        return textareaMatches || labelledOutputMatches;
    }, pattern.source, { timeout: 15_000 }).catch(() => {
        throw new Error(`Expected textarea or output value matching ${pattern} for ${label}.`);
    });
}

async function assertPipelineRecipeJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "Pipeline recipe journey", baseUrl);

    await page.goto(`${baseUrl}/en/pipeline-builder`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    await page.getByRole("button", { name: /^Sample$/ }).first().click();
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
    await page.getByRole("button", { name: /Save structure only/i }).click();
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
    await page.getByRole("button", { name: /Export structure only/i }).click();
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

    runtime.assertClean();

    await page.close();
}

async function assertMonacoFallbackJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "Monaco fallback journey", baseUrl);

    await page.goto(`${baseUrl}/en/csv-json-converter`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });

    const textareas = page.locator("textarea");
    await textareas.first().waitFor({ state: "visible", timeout: 15_000 });
    await textareas.first().fill("id,name\n1,Ada");
    await page.getByRole("button", { name: /^Convert$/ }).first().click();
    await expectTextareaValue(page, /"name": "Ada"/, "csv-json converter output");
    await assertBasicAccessibility(page, "/en/csv-json-converter");

    runtime.assertClean();

    await page.close();
}

async function assertMobileCommandPaletteJourney(browser, baseUrl) {
    const context = await browser.newContext({
        serviceWorkers: "block",
        viewport: { width: 390, height: 844 },
        isMobile: true,
    });
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "Mobile command palette journey", baseUrl);

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

        runtime.assertClean();
    } finally {
        await page.close();
        await context.close();
    }
}

async function assertLocaleSwitchJourney(context, baseUrl) {
    const page = await context.newPage();
    const runtime = createRuntimeObserver(page, "Locale switch journey", baseUrl);

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
    runtime.assertClean();

    await page.close();
}

async function assertPwaShellJourney(browser, baseUrl) {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    const runtimeErrors = [];
    let contextOffline = false;
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    try {
        await page.goto(`${baseUrl}/en`, { waitUntil: "domcontentloaded" });
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
            await page.reload({ waitUntil: "domcontentloaded" });
            isControlled = await waitForController();
        }
        if (!isControlled) {
            throw new Error("Service worker is active but did not control the PWA smoke page.");
        }

        await page.goto(`${baseUrl}/en/json-formatter`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });
        isControlled = await waitForController();
        if (!isControlled) {
            throw new Error("Service worker stopped controlling the PWA smoke page before offline navigation.");
        }
        for (const warmedRoute of [
            "/en/har-viewer-sanitizer",
            "/en/pipeline-builder",
            "/en/youtube-thumbnail-grabber",
        ]) {
            await page.goto(`${baseUrl}${warmedRoute}`, { waitUntil: "domcontentloaded" });
            await page.waitForSelector("main", { timeout: 15_000 });
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

        await page.goto(`${baseUrl}/en/json-formatter`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });
        const offlineJsonInput = page.locator("textarea").first();
        await offlineJsonInput.fill("{\"offline\":true,\"items\":[1,2]}");
        await page.getByRole("button", { name: /^Format$/ }).first().click();
        await expectTextareaValue(page, /"offline": true/, "offline JSON formatter output");

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

        await page.goto(`${baseUrl}/en/har-viewer-sanitizer`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });
        const harInput = page.locator("textarea").first();
        await harInput.fill(JSON.stringify({
            log: {
                entries: [{
                    startedDateTime: "2026-06-24T00:00:00.000Z",
                    time: 42,
                    request: {
                        method: "POST",
                        url: "https://api.example.com/users?token=secret",
                        headers: [{ name: "Authorization", value: "Bearer local-secret" }],
                        cookies: [{ name: "session", value: "cookie-secret" }],
                        queryString: [{ name: "token", value: "secret" }],
                        postData: { text: "{\"password\":\"secret\"}" },
                    },
                    response: {
                        status: 200,
                        headers: [{ name: "Set-Cookie", value: "id=secret" }],
                        cookies: [{ name: "id", value: "secret" }],
                        content: { mimeType: "application/json", text: "{\"ok\":true}" },
                    },
                }],
            },
        }));
        await page.getByRole("button", { name: /^Sanitize$/ }).first().click();
        await expectTextareaValue(page, /"redactionCount":/, "offline HAR sanitizer output");
        await expectTextareaValue(page, /\[REDACTED\]/, "offline HAR sanitizer redaction");

        await page.goto(`${baseUrl}/en/pipeline-builder`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });
        await page.getByRole("button", { name: /^Sample$/ }).first().click();
        await page.getByLabel("Initial input").fill('{ "message": "offline pipeline", "ok": true }');
        await page.getByRole("button", { name: /Run Recipe/i }).first().click();
        await page.waitForFunction(() => {
            const readonlyOutput = Array.from(document.querySelectorAll("textarea")).find((node) => node.readOnly);
            return Boolean(readonlyOutput?.value.trim()) && document.body.innerText.includes("OK");
        }, null, { timeout: 15_000 });

        await page.goto(`${baseUrl}/en/youtube-thumbnail-grabber`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 15_000 });
        await page.getByRole("button", { name: /^Sample$/ }).first().click();
        await page.getByLabel(/I understand this action may request/i).click();
        const offlinePreview = page.getByRole("button", {
            name: /^Preview$/,
            description: /external-request action needs network access/i,
        }).first();
        await offlinePreview.waitFor({ state: "visible", timeout: 15_000 });
        if (await offlinePreview.isEnabled()) {
            throw new Error("Offline external-request preview should be disabled before any network action.");
        }
        await page.getByText(/external-request action needs network access/i).first()
            .waitFor({ state: "visible", timeout: 15_000 });

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

        if (contextOffline) {
            await context.setOffline(false);
            contextOffline = false;
        }

        await page.goto(`${baseUrl}/en/install-app`, { waitUntil: "domcontentloaded" });
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

async function runSmoke(baseUrl, { writeFirstLoadArtifacts = false } = {}) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: "block" });

    try {
        await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });

        for (const route of DEFAULT_ROUTES) {
            await assertRouteRenders(context, baseUrl, route);
            console.log(`[playwright-smoke] PASS render: ${route}`);
        }

        await assertFirstLoadStabilityMatrix(browser, baseUrl, { writeArtifacts: writeFirstLoadArtifacts });
        console.log("[playwright-smoke] PASS first-load CLS, theme, locale, and hydration screenshot matrix");

        await assertHomeNavigation(context, baseUrl, "en");
        console.log("[playwright-smoke] PASS navigation: /en -> /en/json-formatter");

        await assertHomeNavigation(context, baseUrl, "zh-CN");
        console.log("[playwright-smoke] PASS navigation: /zh-CN -> /zh-CN/json-formatter");

        await assertCommandPaletteJourney(context, baseUrl, "en");
        console.log("[playwright-smoke] PASS journey: command palette search -> open /en/json-formatter");

        await assertSkipLinkKeyboardPath(context, baseUrl);
        console.log("[playwright-smoke] PASS accessibility: skip link keyboard path");

        await assertHeaderKeyboardPaths(context, baseUrl);
        console.log("[playwright-smoke] PASS accessibility: header language keyboard path");

        await assertInputProcessCopyJourney(context, baseUrl, "en");
        console.log("[playwright-smoke] PASS journey: /en/list-randomizer input -> process -> copy");

        await assertBase64PipelineSafeNavigationJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: /en/base64-encode-decode -> /en/pipeline-builder safe navigation");

        await assertQrDownloadJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: /en/qr-code-generator PNG and SVG downloads");

        await assertPipelineRecipeJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: /en/pipeline-builder template -> run");

        await assertMonacoFallbackJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: /en/csv-json-converter Monaco fallback -> convert");

        await assertLocaleSwitchJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: locale switch /en/json-formatter -> /zh-CN/json-formatter");

        await assertMobileNavigationKeyboardPath(browser, baseUrl);
        console.log("[playwright-smoke] PASS mobile navigation keyboard path");

        await assertMobileCommandPaletteJourney(browser, baseUrl);
        console.log("[playwright-smoke] PASS mobile journey: command palette -> /en/base64-encode-decode");

        await assertMobileToolPageJourneys(browser, baseUrl);
        console.log("[playwright-smoke] PASS mobile journeys: JSON/Base64/JWT/Regex/Cron tool pages");

        await assertMobileReviewMatrix(browser, baseUrl);
        console.log("[playwright-smoke] PASS mobile review matrix: no overflow or touch-target regressions");

        await assertInputIntentSizingMatrix(browser, baseUrl);
        console.log("[playwright-smoke] PASS input intent sizing matrix: mobile/desktop heights, touch targets, overflow, and screenshots");

        await assertAxeSeriousCriticalMatrix(browser, baseUrl);
        console.log("[playwright-smoke] PASS accessibility: no serious or critical axe violations on representative pages");
    } finally {
        await context.close();
        await browser.close();
    }
}

async function runFirstLoadAudit(baseUrl, { writeArtifacts = false } = {}) {
    const browser = await chromium.launch({ headless: true });
    try {
        await assertFirstLoadStabilityMatrix(browser, baseUrl, { writeArtifacts });
    } finally {
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

async function runInputIntentSmoke(baseUrl) {
    const browser = await chromium.launch({ headless: true });
    try {
        await assertInputIntentSizingMatrix(browser, baseUrl);
        console.log("[playwright-smoke] PASS input intent sizing matrix: mobile/desktop heights, touch targets, overflow, and screenshots");
    } finally {
        await browser.close();
    }
}

async function main() {
    const {
        baseUrl,
        firstLoadOnly,
        includePwa,
        inputIntentsOnly,
        port,
        skipServer,
        writeFirstLoadArtifacts,
    } = parseArgs(process.argv.slice(2));
    let serverHandle = null;

    try {
        if (!skipServer) {
            serverHandle = startStaticServer(port);
            await waitForServer(baseUrl);
            console.log(`[playwright-smoke] Static server ready at ${baseUrl}`);
        }

        if (inputIntentsOnly) {
            await runInputIntentSmoke(baseUrl);
        } else if (firstLoadOnly) {
            await runFirstLoadAudit(baseUrl, { writeArtifacts: writeFirstLoadArtifacts });
        } else {
            await runSmoke(baseUrl, { writeFirstLoadArtifacts });
        }
        if (includePwa && !firstLoadOnly && !inputIntentsOnly) {
            await runPwaSmoke(baseUrl);
        }
        if (!firstLoadOnly && !inputIntentsOnly) {
            console.log("[playwright-smoke] PASS: critical routes render and navigate correctly");
        }
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
