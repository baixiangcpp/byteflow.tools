import fs from "node:fs"
import path from "node:path"
import { loadToolSlugs as loadToolSlugsFromManifests } from "../lib/tool-manifest-lib.js"

const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const SUPPORTED_LOCALES = new Set(["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"])
const ALLOWED_FAQ_SCHEMA_SLUGS = new Set([
    "json-formatter",
    "jwt-decoder",
    "base64-encode-decode",
    "hash-generator",
    "markdown-preview",
    "image-resizer",
])
const SHORT_QUESTION_LOCALES = new Set(["zh-CN", "zh-TW", "ja", "ko"])

function minimumQuestionLength(locale) {
    return SHORT_QUESTION_LOCALES.has(locale) ? 4 : 12
}

function minimumAnswerLength(locale) {
    return SHORT_QUESTION_LOCALES.has(locale) ? 8 : 20
}

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

function decodeEntities(text) {
    return text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
            const code = Number.parseInt(hex, 16)
            return Number.isFinite(code) ? String.fromCodePoint(code) : ""
        })
        .replace(/&#([0-9]+);/g, (_, dec) => {
            const code = Number.parseInt(dec, 10)
            return Number.isFinite(code) ? String.fromCodePoint(code) : ""
        })
}

function toPlainText(html) {
    return decodeEntities(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " "),
    ).replace(/\s+/g, " ").trim()
}

function normalizeText(text) {
    return toPlainText(text)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function extractToolTemplateSection(html) {
    const marker = 'data-tool-content-template="full"'
    const markerIndex = html.indexOf(marker)
    if (markerIndex < 0) return ""

    const sectionStart = html.lastIndexOf("<section", markerIndex)
    if (sectionStart < 0) return ""

    const sectionTagRegex = /<\/?section\b[^>]*>/g
    sectionTagRegex.lastIndex = sectionStart

    let depth = 0
    let match
    while ((match = sectionTagRegex.exec(html)) !== null) {
        const tag = match[0]
        const isClosing = tag.startsWith("</section")

        if (!isClosing) {
            depth += 1
        } else {
            depth -= 1
            if (depth === 0) {
                return html.slice(sectionStart, sectionTagRegex.lastIndex)
            }
        }
    }

    return ""
}

function extractFaqSchema(html) {
    const scriptMatch = html.match(/<script\b(?=[^>]*data-faq-schema="tool")(?=[^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/i)
    if (!scriptMatch) return null

    return JSON.parse(decodeEntities(scriptMatch[1]))
}

function validateFaqSchemaAlignment(slug, locale, html, failures) {
    const schema = extractFaqSchema(html)
    if (!schema) {
        failures.push(`${slug}: FAQ schema marker not found`)
        return
    }

    if (schema["@type"] !== "FAQPage") {
        failures.push(`${slug}: FAQPage schema type not found`)
        return
    }

    const entities = Array.isArray(schema.mainEntity) ? schema.mainEntity : []
    if (entities.length < 3) {
        failures.push(`${slug}: expected at least 3 FAQ questions, found ${entities.length}`)
        return
    }

    const visibleTemplateText = normalizeText(extractToolTemplateSection(html))
    if (!visibleTemplateText) {
        failures.push(`${slug}: visible tool content template not found for FAQ alignment`)
        return
    }

    for (const entity of entities) {
        const question = entity?.name
        const answer = entity?.acceptedAnswer?.text
        if (entity?.["@type"] !== "Question" || entity?.acceptedAnswer?.["@type"] !== "Answer") {
            failures.push(`${slug}: invalid FAQ entity shape`)
            continue
        }
        if (typeof question !== "string" || question.trim().length < minimumQuestionLength(locale)) {
            failures.push(`${slug}: FAQ question is missing or too short`)
            continue
        }
        if (typeof answer !== "string" || answer.trim().length < minimumAnswerLength(locale)) {
            failures.push(`${slug}: FAQ answer for "${question}" is missing or too short`)
            continue
        }

        if (!visibleTemplateText.includes(normalizeText(question))) {
            failures.push(`${slug}: FAQ schema question is not visible on page: "${question}"`)
        }
        if (!visibleTemplateText.includes(normalizeText(answer))) {
            failures.push(`${slug}: FAQ schema answer is not visible on page for question: "${question}"`)
        }
    }
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

        validateFaqSchemaAlignment(slug, locale, html, failures)
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
