import { createServer } from "node:http"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"

const require = createRequire(import.meta.url)
const { chromium } = require("playwright")
const serveHandler = require("serve-handler")

const DEFAULT_PORT = 4174
const OUTPUT_DIR = path.resolve(process.cwd(), "test-results/route-width")
const VIEWPORTS = [
    { name: "desktop-1440", width: 1440, height: 1000 },
    { name: "desktop-1920", width: 1920, height: 1080 },
]
const ROUTES = [
    { path: "/en/all-tools", intent: "catalog", requiredChromeParts: ["intent"] },
    { path: "/en/qr-code-generator", intent: "tool", requiredChromeParts: ["intent", "tool-meta", "install"], requireRelatedTools: true },
    { path: "/en/json-formatter", intent: "wide-tool", requiredChromeParts: ["intent", "tool-meta", "install", "related-tools"], requireRelatedTools: true },
    { path: "/en/pipeline-builder", intent: "wide-tool", requiredChromeParts: ["intent", "tool-meta", "install", "related-tools"], requireRelatedTools: true },
    { path: "/en/support", intent: "static", requiredChromeParts: [] },
    { path: "/en/install-app", intent: "static", requiredChromeParts: [] },
    { path: "/zh-CN/qr-code-generator", intent: "tool", requiredChromeParts: ["intent", "tool-meta", "install"], requireRelatedTools: true },
]
const MAX_WIDTH_BY_INTENT = {
    tool: 1152,
    "wide-tool": 1400,
    static: 1024,
    catalog: 1152,
}
const EDGE_TOLERANCE_PX = 2

function parseArgs(argv) {
    const args = { baseUrl: "", port: DEFAULT_PORT, skipServer: false }
    for (const arg of argv) {
        if (arg === "--skip-server") args.skipServer = true
        if (arg.startsWith("--port=")) args.port = Number(arg.slice("--port=".length)) || DEFAULT_PORT
        if (arg.startsWith("--base-url=")) args.baseUrl = arg.slice("--base-url=".length).trim()
    }
    if (!args.baseUrl) args.baseUrl = `http://127.0.0.1:${args.port}`
    args.baseUrl = args.baseUrl.replace(/\/+$/, "")
    return args
}

function startStaticServer(port) {
    const outDir = path.resolve(process.cwd(), "out")
    if (!existsSync(outDir)) {
        throw new Error(`[route-width-matrix] Missing ${outDir}. Run npm run build first.`)
    }
    const server = createServer((request, response) => serveHandler(request, response, {
        public: outDir,
        cleanUrls: true,
        etag: false,
    }))
    server.listen(port, "127.0.0.1")
    return server
}

async function waitForServer(url) {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
        try {
            const response = await fetch(url, { redirect: "manual" })
            if (response.status < 500) return
        } catch {
            // The static server may still be binding its port.
        }
        await new Promise((resolve) => setTimeout(resolve, 300))
    }
    throw new Error(`[route-width-matrix] Timed out waiting for ${url}`)
}

async function closeServer(server) {
    if (!server) return
    await new Promise((resolve) => server.close(resolve))
}

function assertClose(actual, expected, label) {
    if (Math.abs(actual - expected) > EDGE_TOLERANCE_PX) {
        throw new Error(`${label}: expected ${expected.toFixed(2)} +/- ${EDGE_TOLERANCE_PX}px, received ${actual.toFixed(2)}`)
    }
}

function assertContained(child, parent, label) {
    if (
        child.x < parent.x - EDGE_TOLERANCE_PX
        || child.x + child.width > parent.x + parent.width + EDGE_TOLERANCE_PX
    ) {
        throw new Error(`${label} escapes the route shell horizontally: ${JSON.stringify({ child, parent })}`)
    }
}

function assertAligned(child, parent, label) {
    assertClose(child.x, parent.x, `${label} left edge`)
    assertClose(child.x + child.width, parent.x + parent.width, `${label} right edge`)
}

async function inspectRoute(page, baseUrl, route, viewport) {
    const runtimeErrors = []
    page.on("pageerror", (error) => runtimeErrors.push(error.message))
    page.on("console", (message) => {
        if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
            runtimeErrors.push(`console.error: ${message.text()}`)
        }
    })

    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" })
    if (!response?.ok()) throw new Error(`${route.path} failed to load: ${response?.status() ?? "no response"}`)
    await page.locator("main").first().waitFor({ state: "visible", timeout: 15_000 })
    await page.locator('[data-route-shell="true"]').waitFor({ state: "visible", timeout: 15_000 })
    await page.locator("[data-page-container]").first().waitFor({ state: "visible", timeout: 15_000 })
    await page.evaluate(() => document.fonts.ready)

    const shell = page.locator('[data-route-shell="true"]')
    const body = page.locator("[data-page-container]").first()
    const shellIntent = await shell.getAttribute("data-route-container-intent")
    const bodyIntent = await body.getAttribute("data-page-container")
    if (shellIntent !== route.intent || bodyIntent !== route.intent) {
        throw new Error(`${route.path} intent mismatch: expected ${route.intent}, shell=${shellIntent}, body=${bodyIntent}`)
    }

    const shellBox = await shell.boundingBox()
    const bodyBox = await body.boundingBox()
    if (!shellBox || !bodyBox) throw new Error(`${route.path} did not expose measurable shell/body containers`)
    assertClose(bodyBox.x, shellBox.x, `${route.path} body left edge`)
    assertClose(bodyBox.x + bodyBox.width, shellBox.x + shellBox.width, `${route.path} body right edge`)
    if (shellBox.width > MAX_WIDTH_BY_INTENT[route.intent] + EDGE_TOLERANCE_PX) {
        throw new Error(`${route.path} ${route.intent} shell exceeds ${MAX_WIDTH_BY_INTENT[route.intent]}px: ${shellBox.width}px`)
    }
    if (shellBox.x < 16 - EDGE_TOLERANCE_PX || shellBox.x + shellBox.width > viewport.width - 16 + EDGE_TOLERANCE_PX) {
        throw new Error(`${route.path} shell violates desktop gutters: ${JSON.stringify(shellBox)}`)
    }

    const chromeBounds = await page.locator("[data-route-chrome-part]").evaluateAll((nodes) => nodes.map((node) => {
        const rect = node.getBoundingClientRect()
        return {
            part: node.getAttribute("data-route-chrome-part"),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
        }
    }))
    const chromeByPart = new Map(chromeBounds.map((bounds) => [bounds.part, bounds]))
    for (const part of route.requiredChromeParts) {
        const bounds = chromeByPart.get(part)
        if (!bounds) throw new Error(`${route.path} is missing required ${part} route chrome`)
        assertAligned(bounds, shellBox, `${route.path} ${part}`)
    }
    for (const bounds of chromeBounds) assertContained(bounds, shellBox, `${route.path} ${bounds.part}`)

    const h1 = page.locator("h1").first()
    if (await h1.count()) {
        const headingBox = await h1.boundingBox()
        if (headingBox) assertContained(headingBox, bodyBox, `${route.path} h1`)
    }
    const relatedTools = page.locator("[data-related-tools-source]").first()
    if (route.requireRelatedTools && !(await relatedTools.count())) {
        throw new Error(`${route.path} is missing required related tools`)
    }
    if (await relatedTools.count()) {
        const relatedBox = await relatedTools.boundingBox()
        if (!relatedBox) throw new Error(`${route.path} related tools are not measurable`)
        assertAligned(relatedBox, shellBox, `${route.path} related tools`)
    }

    const screenshotDir = path.join(OUTPUT_DIR, viewport.name)
    mkdirSync(screenshotDir, { recursive: true })
    const filename = route.path.slice(1).replaceAll("/", "__") || "root"
    await page.screenshot({
        path: path.join(screenshotDir, `${filename}.png`),
        fullPage: true,
    })

    if (runtimeErrors.length > 0) {
        throw new Error(`${route.path} emitted runtime errors:\n- ${runtimeErrors.join("\n- ")}`)
    }

    return {
        route: route.path,
        viewport: viewport.name,
        intent: route.intent,
        shell: shellBox,
        body: bodyBox,
        chrome: chromeBounds,
    }
}

async function main() {
    const { baseUrl, port, skipServer } = parseArgs(process.argv.slice(2))
    let server = null
    let browser = null
    const matrix = []
    mkdirSync(OUTPUT_DIR, { recursive: true })

    try {
        if (!skipServer) {
            server = startStaticServer(port)
            await waitForServer(baseUrl)
        }
        browser = await chromium.launch({ headless: true })

        for (const viewport of VIEWPORTS) {
            const context = await browser.newContext({
                serviceWorkers: "block",
                viewport: { width: viewport.width, height: viewport.height },
            })
            try {
                for (const route of ROUTES) {
                    const page = await context.newPage()
                    try {
                        matrix.push(await inspectRoute(page, baseUrl, route, viewport))
                        console.log(`[route-width-matrix] PASS ${viewport.name} ${route.path}`)
                    } finally {
                        await page.close()
                    }
                }
            } finally {
                await context.close()
            }
        }

        writeFileSync(path.join(OUTPUT_DIR, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`, "utf8")
        console.log(`[route-width-matrix] PASS: wrote ${matrix.length} screenshots and bounding-box records`)
    } finally {
        if (browser) await browser.close()
        await closeServer(server)
    }
}

main().catch((error) => {
    console.error("[route-width-matrix] FAILED")
    console.error(error instanceof Error ? error.stack || error.message : String(error))
    process.exit(1)
})
