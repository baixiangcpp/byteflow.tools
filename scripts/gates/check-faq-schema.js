import fs from "node:fs"
import path from "node:path"
import { loadToolSlugs as loadToolSlugsFromManifests } from "../lib/tool-manifest-lib.js"

const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const SUPPORTED_LOCALES = new Set(["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"])
const ALLOWED_FAQ_SCHEMA_SLUGS = new Set(["json-formatter", "base64-encode-decode", "jwt-decoder"])

function parseLocale() {
    const localeArgIndex = process.argv.indexOf("--locale")
    if (localeArgIndex >= 0 && process.argv[localeArgIndex + 1]) {
        return process.argv[localeArgIndex + 1]
    }

    return process.env.FAQ_SCHEMA_LOCALE || "en"
}

function resolveScanDir() {
    if (process.env.FAQ_SCHEMA_SCAN_DIR) {
        return process.env.FAQ_SCHEMA_SCAN_DIR
    }

    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) return dir
    }

    return null
}

function loadToolSlugs() {
    const result = loadToolSlugsFromManifests()
    if (result.length === 0) {
        throw new Error("[check:faq-schema] Failed to parse any tool slug from feature manifests")
    }

    return result
}

function countOccurrences(text, pattern) {
    if (!pattern) return 0
    return text.split(pattern).length - 1
}

function main() {
    const locale = parseLocale()
    if (!SUPPORTED_LOCALES.has(locale)) {
        console.error(`[check:faq-schema] Unsupported locale "${locale}". Supported locales: ${Array.from(SUPPORTED_LOCALES).join(", ")}`)
        process.exit(1)
    }

    const scanDir = resolveScanDir()
    if (!scanDir) {
        console.error("[check:faq-schema] No build output directory found. Expected one of: .next/server/app or out")
        process.exit(1)
    }

    let targetSlugs
    try {
        targetSlugs = loadToolSlugs()
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exit(1)
    }

    const failures = []

    for (const slug of targetSlugs) {
        const htmlPath = path.join(scanDir, locale, `${slug}.html`)
        if (!fs.existsSync(htmlPath)) {
            failures.push(`${slug}: missing built file ${path.relative(process.cwd(), htmlPath)}`)
            continue
        }

        const html = fs.readFileSync(htmlPath, "utf8")
        if (!ALLOWED_FAQ_SCHEMA_SLUGS.has(slug)) {
            if (html.includes("data-faq-schema=\"tool\"") || html.includes("\"@type\":\"FAQPage\"")) {
                failures.push(`${slug}: unexpected FAQPage schema on non-allowlisted tool`)
            }
            continue
        }

        if (!html.includes("data-faq-schema=\"tool\"")) {
            failures.push(`${slug}: FAQ schema marker not found`)
            continue
        }

        if (!html.includes("\"@type\":\"FAQPage\"")) {
            failures.push(`${slug}: FAQPage schema type not found`)
            continue
        }

        const questionCount = countOccurrences(html, "\"@type\":\"Question\"")
        if (questionCount < 3) {
            failures.push(`${slug}: expected at least 3 FAQ questions, found ${questionCount}`)
        }
    }

    if (failures.length > 0) {
        console.error(`[check:faq-schema] ${failures.length} issue(s) found:`)
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`[check:faq-schema] OK (${locale}): ${ALLOWED_FAQ_SCHEMA_SLUGS.size} allowlisted tool pages include valid FAQPage schema blocks`)
}

main()
