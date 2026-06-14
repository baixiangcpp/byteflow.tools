import fs from "node:fs"
import path from "node:path"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"

const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const LOCALE = "en"

function resolveScanDir() {
    if (process.env.RELATED_TOOLS_SCAN_DIR) {
        return process.env.RELATED_TOOLS_SCAN_DIR
    }

    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) {
            return dir
        }
    }

    return null
}

function loadToolRoutes() {
    const routes = loadOrderedToolManifests().map(({ key, slug }) => ({ key, slug }))

    if (routes.length === 0) {
        throw new Error("Unable to parse tool routes from feature manifests")
    }

    return routes
}

function main() {
    const scanDir = resolveScanDir()
    if (!scanDir) {
        console.error("[check:related-tools] No build output directory found. Expected one of: .next/server/app or out")
        process.exit(1)
    }

    const routes = loadToolRoutes()
    const missing = []

    for (const route of routes) {
        const htmlPath = path.join(scanDir, LOCALE, `${route.slug}.html`)
        if (!fs.existsSync(htmlPath)) {
            missing.push(`${route.key} (${route.slug}): missing file ${path.relative(process.cwd(), htmlPath)}`)
            continue
        }

        const html = fs.readFileSync(htmlPath, "utf8")
        if (!html.includes("data-related-tools-source=")) {
            missing.push(`${route.key} (${route.slug}): related tools block not found`)
        }
    }

    if (missing.length > 0) {
        console.error(`[check:related-tools] ${missing.length} tool page(s) missing related tools:`)
        for (const issue of missing) {
            console.error(`- ${issue}`)
        }
        process.exit(1)
    }

    console.log(`[check:related-tools] OK: ${routes.length}/${routes.length} tool pages include related tools`)
}

main()
