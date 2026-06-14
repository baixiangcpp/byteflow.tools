#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const OUTPUT_PATH = path.resolve(process.cwd(), "public/screenshots/byteflow-demo.png");
const VIEWPORT = { width: 1280, height: 800 };
const JSON_SAMPLE = JSON.stringify({
    user: {
        id: 1001,
        name: "Alice Chen",
        roles: ["admin", "developer"],
        active: true,
        metadata: {
            lastLogin: "2026-06-04T10:30:00Z",
            preferences: {
                theme: "system",
                language: "en",
            },
        },
    },
    request: {
        method: "POST",
        path: "/api/releases",
        retry: { attempts: 3, backoffMs: 250 },
    },
});
const JSON_SAMPLE_PRETTY = JSON.stringify(JSON.parse(JSON_SAMPLE), null, 2);
const BASE64_SAMPLE = "user_001|zh-CN|text";
const BASE64_SAMPLE_OUTPUT = Buffer.from(BASE64_SAMPLE, "utf8").toString("base64");

function getArgValue(flagName) {
    const match = process.argv.find((arg) => arg.startsWith(`${flagName}=`));
    if (!match) return null;
    return match.slice(flagName.length + 1).trim();
}

function hasFlag(flagName) {
    return process.argv.includes(flagName);
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function startDevServer() {
    const child = spawn("npm", ["run", "dev"], {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    const appendOutput = (chunk) => {
        output = `${output}${chunk.toString()}`.slice(-5000);
    };

    child.stdout.on("data", appendOutput);
    child.stderr.on("data", appendOutput);

    return {
        child,
        getOutput() {
            return output;
        },
        async stop() {
            if (child.exitCode !== null) return;
            child.kill("SIGTERM");
            await Promise.race([
                new Promise((resolve) => child.once("exit", resolve)),
                wait(5000).then(() => {
                    if (child.exitCode === null) child.kill("SIGKILL");
                }),
            ]);
        },
    };
}

async function waitForApp(baseUrl) {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${baseUrl}/en/json-formatter`, { redirect: "manual" });
            if (response.status < 500) return;
        } catch {
            // Keep polling until the dev server is ready.
        }
        await wait(500);
    }
    throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function preparePage(context, url) {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
        localStorage.clear();
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 15_000 });
    return page;
}

async function captureJsonFormatter(context, baseUrl) {
    console.log("[capture-readme-demo] Capturing JSON Formatter");
    const page = await preparePage(context, `${baseUrl}/en/json-formatter`);
    await page.evaluate(({ input, output }) => {
        const headers = Array.from(document.querySelectorAll(".tool-pane-header"));
        const renderCode = (host, text) => {
            if (!host) return;
            host.innerHTML = "";
            const pre = document.createElement("pre");
            pre.textContent = text;
            pre.style.margin = "0";
            pre.style.height = "100%";
            pre.style.minHeight = "300px";
            pre.style.padding = "16px";
            pre.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
            pre.style.fontSize = "13px";
            pre.style.lineHeight = "1.7";
            pre.style.whiteSpace = "pre-wrap";
            pre.style.color = "rgb(203, 213, 225)";
            pre.style.background = "rgb(15, 23, 42)";
            host.append(pre);
        };

        const inputPane = headers.find((node) => node.textContent?.includes("Input"))?.parentElement;
        const outputPane = headers.find((node) => node.textContent?.includes("Output"))?.parentElement;
        renderCode(inputPane?.querySelector(".min-h-\\[300px\\]"), input);
        renderCode(outputPane?.querySelector(".min-h-\\[300px\\]"), output);
    }, { input: JSON_SAMPLE, output: JSON_SAMPLE_PRETTY });
    await page.screenshot({ path: "/tmp/byteflow-readme-json.png" });
    await page.close();
}

async function captureBase64(context, baseUrl) {
    console.log("[capture-readme-demo] Capturing Base64");
    const page = await preparePage(context, `${baseUrl}/en/base64-encode-decode`);
    const input = page.locator("textarea").first();

    await input.waitFor({ state: "visible", timeout: 15_000 });
    await input.fill(BASE64_SAMPLE);
    console.log("[capture-readme-demo] Base64 input filled");
    await page.waitForFunction((expected) => {
        const textarea = document.querySelector("textarea");
        return textarea instanceof HTMLTextAreaElement && textarea.value === expected;
    }, BASE64_SAMPLE, { timeout: 10_000 });
    console.log("[capture-readme-demo] Base64 input confirmed");

    await page.evaluate((encoded) => {
        const textareas = Array.from(document.querySelectorAll("textarea"));
        const output = textareas[1];
        if (!(output instanceof HTMLTextAreaElement)) {
            throw new Error("Base64 output textarea not found");
        }
        output.value = encoded;
        output.dispatchEvent(new Event("input", { bubbles: true }));
    }, BASE64_SAMPLE_OUTPUT);
    await page.screenshot({ path: "/tmp/byteflow-readme-base64.png" });
    await page.close();
}

async function createComposite(context) {
    console.log("[capture-readme-demo] Creating composite");
    const page = await context.newPage();
    await page.setViewportSize({ width: 1400, height: 600 });
    const jsonImage = await fs.readFile("/tmp/byteflow-readme-json.png", "base64");
    const base64Image = await fs.readFile("/tmp/byteflow-readme-base64.png", "base64");
    await page.setContent(`
        <!doctype html>
        <html>
            <head>
                <style>
                    html,
                    body {
                        margin: 0;
                        min-height: 100%;
                        background: #f4f7fb;
                        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    }

                    .stage {
                        box-sizing: border-box;
                        width: 1400px;
                        height: 600px;
                        padding: 28px;
                        background:
                            linear-gradient(135deg, rgba(14, 165, 233, 0.16), transparent 34%),
                            linear-gradient(315deg, rgba(34, 197, 94, 0.13), transparent 32%),
                            #eef4fb;
                    }

                    .frame {
                        display: grid;
                        grid-template-columns: 1.22fr 0.78fr;
                        gap: 18px;
                        align-items: start;
                    }

                    .panel {
                        display: flex;
                        align-items: flex-start;
                        justify-content: center;
                        overflow: hidden;
                        border: 1px solid rgba(15, 23, 42, 0.14);
                        border-radius: 18px;
                        background: #08111f;
                        box-shadow: 0 22px 58px rgba(15, 23, 42, 0.16);
                    }

                    .panel img {
                        display: block;
                        width: 100%;
                        height: auto;
                    }

                </style>
            </head>
            <body>
                <main class="stage">
                    <div class="frame">
                        <section class="panel">
                            <img alt="Byteflow JSON Formatter" src="data:image/png;base64,${jsonImage}">
                        </section>
                        <section class="panel secondary">
                            <img alt="Byteflow Base64 tool" src="data:image/png;base64,${base64Image}">
                        </section>
                    </div>
                </main>
            </body>
        </html>
    `);
    await page.screenshot({ path: OUTPUT_PATH, clip: { x: 0, y: 0, width: 1400, height: 600 } });
    await page.close();
}

async function main() {
    const baseUrl = (getArgValue("--base-url") || process.env.BYTEFLOW_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
    const devServer = hasFlag("--start-server") ? startDevServer() : null;
    try {
        await waitForApp(baseUrl);
    } catch (error) {
        if (devServer) {
            console.error(devServer.getOutput());
        }
        throw error;
    }

    const browser = await chromium.launch();
    try {
        const context = await browser.newContext({
            viewport: VIEWPORT,
            deviceScaleFactor: 1,
            colorScheme: "light",
            reducedMotion: "reduce",
        });
        await captureJsonFormatter(context, baseUrl);
        await captureBase64(context, baseUrl);
        await createComposite(context);
        const stat = await fs.stat(OUTPUT_PATH);
        console.log(`[capture-readme-demo] Wrote ${path.relative(process.cwd(), OUTPUT_PATH)} (${Math.round(stat.size / 1024)} KiB)`);
    } finally {
        await browser.close();
        await devServer?.stop();
    }
}

main().catch((error) => {
    console.error(`[capture-readme-demo] ${error instanceof Error ? error.stack || error.message : String(error)}`);
    process.exit(1);
});
