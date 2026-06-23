import fs from "node:fs"
import path from "node:path"

const BASE_URL = process.env.SITE_URL || "https://byteflow.tools"
const LOCALES = new Set(["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"])
const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const TOOL_ALIAS_PATH = path.join(process.cwd(), "src", "core", "registry", "tool-aliases.json")
const LEGACY_TAXONOMY_REDIRECT_PATH = path.join(process.cwd(), "src", "core", "routing", "legacy-taxonomy-redirects.json")
const TOOL_ALIAS_TO_CANONICAL_SLUG = fs.existsSync(TOOL_ALIAS_PATH)
    ? JSON.parse(fs.readFileSync(TOOL_ALIAS_PATH, "utf8"))
    : {}
const LEGACY_TAXONOMY_REDIRECTS = fs.existsSync(LEGACY_TAXONOMY_REDIRECT_PATH)
    ? JSON.parse(fs.readFileSync(LEGACY_TAXONOMY_REDIRECT_PATH, "utf8"))
    : {}

function canonicalSlugFor(slug) {
    return LEGACY_TAXONOMY_REDIRECTS[slug] || TOOL_ALIAS_TO_CANONICAL_SLUG[slug] || slug
}

function resolveScanDir() {
    if (process.env.CANONICAL_SCAN_DIR) {
        return process.env.CANONICAL_SCAN_DIR
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

function expectedCanonicalFor(relativePath) {
    if (relativePath === "index.html") {
        return BASE_URL
    }

    if (relativePath === "404.html" || relativePath === "_not-found.html") {
        return null
    }

    const localeRoot = relativePath.match(/^([^/]+)\.html$/)
    if (localeRoot) {
        const locale = localeRoot[1]
        if (LOCALES.has(locale)) {
            return `${BASE_URL}/${locale}`
        }
        return null
    }

    const localizedPage = relativePath.match(/^([^/]+)\/(.+)\.html$/)
    if (localizedPage) {
        const locale = localizedPage[1]
        const slug = canonicalSlugFor(localizedPage[2])
        if (LOCALES.has(locale)) {
            return `${BASE_URL}/${locale}/${slug}`
        }
    }

    return null
}

function extractCanonicalHrefs(html) {
    const canonicalTags = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)]
    return canonicalTags
        .map((match) => {
            const tag = match[0]
            const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i)
            return hrefMatch ? hrefMatch[1] : null
        })
        .filter(Boolean)
}

function main() {
    const scanDir = resolveScanDir()
    if (!scanDir) {
        console.error("[check:canonical] No build output directory found. Expected one of: .next/server/app or out")
        process.exit(1)
    }

    const htmlFiles = listHtmlFiles(scanDir)
    if (htmlFiles.length === 0) {
        console.error(`[check:canonical] No HTML files found under ${scanDir}`)
        process.exit(1)
    }

    const failures = []
    let checkedCount = 0

    for (const absolutePath of htmlFiles) {
        const relativePath = toPosixPath(path.relative(scanDir, absolutePath))
        const expectedCanonical = expectedCanonicalFor(relativePath)
        if (!expectedCanonical) continue

        checkedCount += 1

        const html = fs.readFileSync(absolutePath, "utf8")
        const canonicals = extractCanonicalHrefs(html)

        if (canonicals.length === 0) {
            failures.push(`${relativePath}: missing canonical link`)
            continue
        }

        if (canonicals.length > 1) {
            failures.push(`${relativePath}: multiple canonical links found (${canonicals.length})`)
            continue
        }

        if (canonicals[0] !== expectedCanonical) {
            failures.push(`${relativePath}: canonical mismatch (expected ${expectedCanonical}, got ${canonicals[0]})`)
        }
    }

    if (checkedCount === 0) {
        console.error(`[check:canonical] No indexable pages were checked under ${scanDir}`)
        process.exit(1)
    }

    if (failures.length > 0) {
        console.error(`[check:canonical] ${failures.length} canonical issue(s) found:`)
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`[check:canonical] OK: ${checkedCount} page(s) verified in ${scanDir}`)
}

main()
