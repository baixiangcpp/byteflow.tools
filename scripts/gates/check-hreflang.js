import fs from "node:fs"
import path from "node:path"

const BASE_URL = process.env.SITE_URL || "https://byteflow.tools"
const LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"]
const LOCALE_SET = new Set(LOCALES)
const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const TOOL_ALIAS_PATH = path.join(process.cwd(), "src", "core", "registry", "tool-aliases.json")
const TOOL_ALIAS_TO_CANONICAL_SLUG = fs.existsSync(TOOL_ALIAS_PATH)
    ? JSON.parse(fs.readFileSync(TOOL_ALIAS_PATH, "utf8"))
    : {}

function resolveScanDir() {
    if (process.env.HREFLANG_SCAN_DIR) {
        return process.env.HREFLANG_SCAN_DIR
    }

    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) {
            return dir
        }
    }

    return null
}

function listHtmlFiles(rootDir) {
    const results = []

    function walk(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true })
        for (const entry of entries) {
            const absolutePath = path.join(currentDir, entry.name)
            if (entry.isDirectory()) {
                walk(absolutePath)
                continue
            }
            if (entry.isFile() && entry.name.endsWith(".html")) {
                results.push(absolutePath)
            }
        }
    }

    walk(rootDir)
    return results
}

function toPosixPath(filePath) {
    return filePath.split(path.sep).join("/")
}

function parseRoute(relativePath) {
    if (relativePath === "index.html") {
        return { locale: null, slug: null }
    }

    if (relativePath === "404.html" || relativePath === "_not-found.html") {
        return null
    }

    const localeRoot = relativePath.match(/^([^/]+)\.html$/)
    if (localeRoot) {
        const locale = localeRoot[1]
        if (LOCALE_SET.has(locale)) {
            return { locale, slug: null }
        }
        return null
    }

    const localizedPage = relativePath.match(/^([^/]+)\/([^/]+)\.html$/)
    if (!localizedPage) return null
    const locale = localizedPage[1]
    const slug = localizedPage[2]
    if (!LOCALE_SET.has(locale)) return null
    return { locale, slug }
}

function expectedHreflangs(slug) {
    const canonicalSlug = slug ? (TOOL_ALIAS_TO_CANONICAL_SLUG[slug] || slug) : null
    const expected = new Map()
    for (const locale of LOCALES) {
        expected.set(
            locale,
            canonicalSlug ? `${BASE_URL}/${locale}/${canonicalSlug}` : `${BASE_URL}/${locale}`,
        )
    }
    expected.set(
        "x-default",
        canonicalSlug ? `${BASE_URL}/en/${canonicalSlug}` : BASE_URL,
    )
    return expected
}

function extractAlternateLinks(html) {
    const tags = [...html.matchAll(/<link\b[^>]*\brel=["']alternate["'][^>]*>/gi)]
    const alternates = new Map()
    const duplicates = []

    for (const match of tags) {
        const tag = match[0]
        const hreflangMatch = tag.match(/\bhrefLang=["']([^"']+)["']/i)
        const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i)
        if (!hreflangMatch || !hrefMatch) continue

        const hreflang = hreflangMatch[1]
        const href = hrefMatch[1]
        if (alternates.has(hreflang)) {
            duplicates.push(hreflang)
            continue
        }
        alternates.set(hreflang, href)
    }

    return { alternates, duplicates }
}

function main() {
    const scanDir = resolveScanDir()
    if (!scanDir) {
        console.error("[check:hreflang] No build output directory found. Expected one of: .next/server/app or out")
        process.exit(1)
    }

    const htmlFiles = listHtmlFiles(scanDir)
    if (htmlFiles.length === 0) {
        console.error(`[check:hreflang] No HTML files found under ${scanDir}`)
        process.exit(1)
    }

    const failures = []
    let checkedCount = 0

    for (const absolutePath of htmlFiles) {
        const relativePath = toPosixPath(path.relative(scanDir, absolutePath))
        const route = parseRoute(relativePath)
        if (!route) continue

        checkedCount += 1
        const html = fs.readFileSync(absolutePath, "utf8")
        const { alternates, duplicates } = extractAlternateLinks(html)
        const expected = expectedHreflangs(route.slug)

        if (duplicates.length > 0) {
            failures.push(`${relativePath}: duplicate hreflang tags for ${duplicates.join(", ")}`)
            continue
        }

        for (const [hreflang, expectedHref] of expected.entries()) {
            const actualHref = alternates.get(hreflang)
            if (!actualHref) {
                failures.push(`${relativePath}: missing hreflang="${hreflang}"`)
                continue
            }
            if (actualHref !== expectedHref) {
                failures.push(
                    `${relativePath}: hreflang="${hreflang}" mismatch (expected ${expectedHref}, got ${actualHref})`,
                )
            }
        }
    }

    if (checkedCount === 0) {
        console.error(`[check:hreflang] No indexable pages were checked under ${scanDir}`)
        process.exit(1)
    }

    if (failures.length > 0) {
        console.error(`[check:hreflang] ${failures.length} hreflang issue(s) found:`)
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`[check:hreflang] OK: ${checkedCount} page(s) verified in ${scanDir}`)
}

main()
