import fs from "node:fs"
import path from "node:path"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"

const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const REQUIRED_TOOL_SLUGS = ["json-formatter", "xml-formatter"]
const REQUIRED_FAQ_SLUGS = ["json-formatter", "base64-encode-decode", "jwt-decoder"]

function resolveScanDir() {
    if (process.env.JSONLD_SCAN_DIR) return process.env.JSONLD_SCAN_DIR

    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) return dir
    }

    return null
}

function walkHtmlFiles(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walkHtmlFiles(fullPath, out)
        } else if (entry.isFile() && fullPath.endsWith(".html")) {
            out.push(fullPath)
        }
    }
    return out
}

function htmlFileFor(scanDir, locale, slug = null) {
    if (slug == null) return path.join(scanDir, `${locale}.html`)
    return path.join(scanDir, locale, `${slug}.html`)
}

function extractJsonLdBlocks(html) {
    const blocks = []
    const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

    for (const match of html.matchAll(pattern)) {
        blocks.push(match[1].trim())
    }

    return blocks
}

function parseJsonLdBlocks(html, filePath, failures) {
    return extractJsonLdBlocks(html).flatMap((block, index) => {
        try {
            return [JSON.parse(block)]
        } catch (error) {
            failures.push(`${filePath}: JSON-LD block ${index + 1} is not valid JSON (${error instanceof Error ? error.message : String(error)})`)
            return []
        }
    })
}

function collectTypes(value, out = new Set()) {
    if (Array.isArray(value)) {
        for (const item of value) collectTypes(item, out)
        return out
    }

    if (!value || typeof value !== "object") return out

    const record = value
    const type = record["@type"]
    if (typeof type === "string") out.add(type)
    if (Array.isArray(type)) {
        for (const item of type) {
            if (typeof item === "string") out.add(item)
        }
    }

    for (const child of Object.values(record)) collectTypes(child, out)
    return out
}

function assertTypes({ scanDir, locale, slug, requiredTypes, label, failures }) {
    const filePath = htmlFileFor(scanDir, locale, slug)
    if (!fs.existsSync(filePath)) {
        failures.push(`${label}: missing built HTML at ${path.relative(process.cwd(), filePath)}`)
        return
    }

    const html = fs.readFileSync(filePath, "utf8")
    const blocks = parseJsonLdBlocks(html, filePath, failures)
    if (blocks.length === 0) {
        failures.push(`${label}: no JSON-LD blocks found`)
        return
    }

    const types = collectTypes(blocks)
    for (const requiredType of requiredTypes) {
        if (!types.has(requiredType)) {
            failures.push(`${label}: missing ${requiredType} JSON-LD`)
        }
    }
}

function assertUniqueEnglishToolDescriptions(failures) {
    const translations = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/core/i18n/translations/en.json"), "utf8"))
    const tools = translations.tools ?? {}
    const byDescription = new Map()

    for (const manifest of loadOrderedToolManifests()) {
        const description = tools[manifest.key]?.description
        if (typeof description !== "string" || description.trim().length === 0) {
            failures.push(`${manifest.slug}: missing English metadata description source tools.${manifest.key}.description`)
            continue
        }

        const normalized = description.trim()
        byDescription.set(normalized, [...(byDescription.get(normalized) ?? []), manifest.slug])
    }

    for (const [description, slugs] of byDescription) {
        if (slugs.length > 1) {
            failures.push(`duplicate English tool description for ${slugs.join(", ")}: ${description}`)
        }
    }
}

function main() {
    const scanDir = resolveScanDir()
    if (!scanDir) {
        console.error("[check:jsonld-structured-data] No build output directory found. Expected one of: .next/server/app or out")
        process.exit(1)
    }

    const failures = []
    const htmlFiles = walkHtmlFiles(scanDir)
    let jsonLdBlockCount = 0

    for (const htmlFile of htmlFiles) {
        const html = fs.readFileSync(htmlFile, "utf8")
        const blocks = extractJsonLdBlocks(html)
        jsonLdBlockCount += blocks.length
        parseJsonLdBlocks(html, htmlFile, failures)
    }

    assertTypes({
        scanDir,
        locale: "en",
        requiredTypes: ["WebSite", "SearchAction"],
        label: "/en",
        failures,
    })
    assertTypes({
        scanDir,
        locale: "en",
        slug: "data-code-formats",
        requiredTypes: ["CollectionPage"],
        label: "/en/data-code-formats",
        failures,
    })
    assertTypes({
        scanDir,
        locale: "en",
        slug: "workflows",
        requiredTypes: ["CollectionPage", "BreadcrumbList"],
        label: "/en/workflows",
        failures,
    })
    assertTypes({
        scanDir,
        locale: "en",
        slug: "workflows/api-payload-cleanup",
        requiredTypes: ["HowTo", "HowToStep", "BreadcrumbList"],
        label: "/en/workflows/api-payload-cleanup",
        failures,
    })
    assertTypes({
        scanDir,
        locale: "zh-CN",
        slug: "json-formatting-errors",
        requiredTypes: ["Article"],
        label: "/zh-CN/json-formatting-errors",
        failures,
    })

    for (const slug of REQUIRED_TOOL_SLUGS) {
        assertTypes({
            scanDir,
            locale: "en",
            slug,
            requiredTypes: ["WebApplication", "BreadcrumbList"],
            label: `/en/${slug}`,
            failures,
        })
    }

    for (const slug of REQUIRED_FAQ_SLUGS) {
        assertTypes({
            scanDir,
            locale: "en",
            slug,
            requiredTypes: ["FAQPage"],
            label: `/en/${slug}`,
            failures,
        })
    }

    assertUniqueEnglishToolDescriptions(failures)

    if (jsonLdBlockCount === 0) {
        failures.push("no JSON-LD blocks found in build output")
    }

    if (failures.length > 0) {
        console.error(`[check:jsonld-structured-data] ${failures.length} issue(s) found:`)
        for (const failure of failures.slice(0, 160)) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`[check:jsonld-structured-data] OK: ${jsonLdBlockCount} JSON-LD block(s) parsed and required page schemas found.`)
}

main()
