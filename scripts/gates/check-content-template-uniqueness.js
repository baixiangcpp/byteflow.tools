#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const SAMPLE_TOOL_REQUIREMENTS = {
    "json-formatter": ["json", "api", "payload"],
    "jwt-decoder": ["jwt", "claim", "signature"],
    "base64-encode-decode": ["base64", "url-safe", "padding"],
    "hash-generator": ["hash", "hmac", "sha"],
    "markdown-preview": ["markdown", "html", "renderer"],
    "image-resizer": ["image", "fit", "webp"],
}
const GENERIC_FAQ_QUESTIONS = new Set([
    "is my data secure",
    "how do i verify this tool is truly local",
    "what about other online tools",
    "does this tool run locally",
    "is this tool free",
])

function resolveScanDir() {
    if (process.env.CONTENT_TEMPLATE_UNIQUENESS_SCAN_DIR) {
        return process.env.CONTENT_TEMPLATE_UNIQUENESS_SCAN_DIR
    }

    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) return dir
    }

    return null
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

function extractSectionByStart(html, sectionStart) {
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

    return null
}

function extractTemplateSection(html) {
    const marker = 'data-tool-content-template="full"'
    const markerIndex = html.indexOf(marker)
    if (markerIndex < 0) return null
    const sectionStart = html.lastIndexOf("<section", markerIndex)
    if (sectionStart < 0) return null
    return extractSectionByStart(html, sectionStart)
}

function extractFaqQuestions(templateSection) {
    const questionRegex = /<p class="text-sm font-medium text-foreground">([\s\S]*?)<\/p>/g
    return [...templateSection.matchAll(questionRegex)]
        .map((match) => normalizeText(match[1]))
        .filter(Boolean)
}

function sentenceFingerprints(text) {
    return text
        .split(/[.!?]\s+/)
        .map((sentence) => normalizeText(sentence))
        .filter((sentence) => sentence.length >= 80)
}

const scanDir = resolveScanDir()
if (!scanDir) {
    console.error("[check:content-template:uniqueness] No build output directory found. Expected one of: .next/server/app or out")
    process.exit(1)
}

const failures = []
const repeatedSentences = new Map()

for (const [slug, requiredTerms] of Object.entries(SAMPLE_TOOL_REQUIREMENTS)) {
    const htmlPath = path.join(scanDir, "en", `${slug}.html`)
    if (!fs.existsSync(htmlPath)) {
        failures.push(`${slug}: missing built file ${path.relative(process.cwd(), htmlPath)}`)
        continue
    }

    const html = fs.readFileSync(htmlPath, "utf8")
    const templateSection = extractTemplateSection(html)
    if (!templateSection) {
        failures.push(`${slug}: content template block not found`)
        continue
    }

    if (!templateSection.includes('href="/en/trust-center"')) {
        failures.push(`${slug}: security/privacy section must link to /en/trust-center`)
    }

    const plainText = normalizeText(templateSection)
    for (const term of requiredTerms) {
        if (!plainText.includes(normalizeText(term))) {
            failures.push(`${slug}: template text must include tool-specific term "${term}"`)
        }
    }

    const faqQuestions = extractFaqQuestions(templateSection)
    if (faqQuestions.length < 3) {
        failures.push(`${slug}: expected at least 3 visible FAQ questions`)
    }

    for (const question of faqQuestions) {
        if (GENERIC_FAQ_QUESTIONS.has(question)) {
            failures.push(`${slug}: generic FAQ question should live in Trust Center instead: "${question}"`)
        }
    }

    for (const sentence of sentenceFingerprints(templateSection)) {
        const slugs = repeatedSentences.get(sentence) || new Set()
        slugs.add(slug)
        repeatedSentences.set(sentence, slugs)
    }
}

for (const [sentence, slugs] of repeatedSentences.entries()) {
    if (slugs.size >= 3) {
        failures.push(`repeated long sentence across sampled tools (${Array.from(slugs).join(", ")}): "${sentence.slice(0, 120)}"`)
    }
}

if (failures.length > 0) {
    console.error(`[check:content-template:uniqueness] FAILED: ${failures.length} issue(s) found:`)
    for (const failure of failures) {
        console.error(`- ${failure}`)
    }
    process.exit(1)
}

console.log(`[check:content-template:uniqueness] OK: ${Object.keys(SAMPLE_TOOL_REQUIREMENTS).length} sampled core tool templates are specific, non-generic, and linked to Trust Center.`)
