import { createServer } from "node:http";
import { existsSync } from "node:fs";
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
];

function parseArgs(argv) {
    const args = {
        port: DEFAULT_PORT,
        baseUrl: "",
        skipServer: false,
    };

    for (const arg of argv) {
        if (arg === "--skip-server") {
            args.skipServer = true;
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
    await commandInput.fill("json formatter");

    const jsonFormatterItem = page.locator('[data-slot="command-item"]').filter({ hasText: /JSON Formatter/i }).first();
    await jsonFormatterItem.waitFor({ state: "visible", timeout: 15_000 });

    const toolRoute = `${baseUrl}/${locale}/json-formatter`;
    await Promise.all([
        page.waitForURL(toolRoute, { timeout: 15_000 }),
        jsonFormatterItem.click(),
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

        await assertInputProcessCopyJourney(context, baseUrl, "en");
        console.log("[playwright-smoke] PASS journey: /en/list-randomizer input -> process -> copy");

        await assertLocaleSwitchJourney(context, baseUrl);
        console.log("[playwright-smoke] PASS journey: locale switch /en/json-formatter -> /zh-CN/json-formatter");
    } finally {
        await context.close();
        await browser.close();
    }
}

async function main() {
    const { baseUrl, port, skipServer } = parseArgs(process.argv.slice(2));
    let serverHandle = null;

    try {
        if (!skipServer) {
            serverHandle = startStaticServer(port);
            await waitForServer(baseUrl);
            console.log(`[playwright-smoke] Static server ready at ${baseUrl}`);
        }

        await runSmoke(baseUrl);
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
