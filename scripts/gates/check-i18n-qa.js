#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const PROJECT_ROOT = process.cwd()
const GLOSSARY_PATH = path.join(PROJECT_ROOT, "docs/i18n/glossary.md")
const CONTRIBUTING_PATH = path.join(PROJECT_ROOT, "CONTRIBUTING.md")
const LOCALIZATION_REVIEW_PATH = path.join(PROJECT_ROOT, "docs/specs/localization-quality-review.md")
const TRANSLATIONS_DIR = path.join(PROJECT_ROOT, "src/core/i18n/translations")
const I18N_SOURCE_PATH = path.join(PROJECT_ROOT, "src/core/i18n/i18n.ts")
const LOCALIZED_META_PATH = path.join(PROJECT_ROOT, "src/core/seo/localized-meta-copy.ts")
const ROUTE_INTENT_COPY_PATH = path.join(PROJECT_ROOT, "src/core/seo/route-intent-copy.ts")

const LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"]
const NON_EN_LOCALES = LOCALES.filter((locale) => locale !== "en")

const GLOSSARY_TERMS = [
    "Browser-local",
    "Offline capable",
    "External request",
    "Sensitive input",
    "Privacy-first",
    "Local-first",
    "Formatter",
    "Encoder",
    "Decoder",
    "Hash",
    "Workflow",
    "Pipeline",
]

const REQUIRED_POLICY_PHRASES = [
    "complete, accurate localized text",
    "every supported locale in the same PR",
    "No English-only originality",
    "No partial originality",
    "complete affected user-facing surface",
    "metadata-only localization",
    "Partial localization is a merge blocker",
]

const REQUIRED_META_SLUGS = [
    "api-auth-header-mistakes",
    "certificate-chain-basics-for-developers",
    "convert-curl-to-fetch-python",
    "csp-mistakes-that-break-production",
    "dns-records-uptime",
    "json-formatting-errors",
    "json-schema-validation-checklist",
    "json-vs-json5-differences",
    "mock-openapi-quickly",
    "openapi-debugging-workflow-checklist",
    "robots-txt-testing-checklist",
    "validate-json-before-api-requests",
    "md5-digest-generator",
    "sha1-digest-generator",
    "sha224-digest-generator",
    "sha256-digest-generator",
    "sha384-digest-generator",
    "sha512-digest-generator",
]

const ACCEPTED_TECHNICAL_TOKENS = [
    "API",
    "Base32",
    "Base58",
    "Base64",
    "CSS",
    "CSP",
    "DevTools",
    "DNS",
    "HMAC",
    "HTML",
    "HTTP",
    "JSON",
    "JWT",
    "MD5",
    "OpenAPI",
    "Pipeline",
    "PWA",
    "SHA",
    "SVG",
    "TOML",
    "URL",
    "UUID",
    "YAML",
    "byteflow.tools",
    "cURL",
    "fetch",
    "jwt.io",
]

const NON_LATIN_SCRIPT_REQUIREMENTS = {
    "zh-CN": /[\u3400-\u9FFF]/,
    "zh-TW": /[\u3400-\u9FFF]/,
    ja: /[\u3040-\u30FF\u3400-\u9FFF]/,
    ko: /[\uAC00-\uD7AF]/,
}

function readText(filePath) {
    return fs.readFileSync(filePath, "utf8")
}

function readJson(filePath) {
    return JSON.parse(readText(filePath))
}

function addIssue(issues, message) {
    issues.push(message)
}

function extractQuotedStringArray(source, exportName) {
    const match = source.match(new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const`))
    if (!match) return []
    return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
}

function flattenStrings(value, out = []) {
    if (typeof value === "string") {
        out.push(value)
        return out
    }
    if (Array.isArray(value)) {
        for (const item of value) flattenStrings(item, out)
        return out
    }
    if (value && typeof value === "object") {
        for (const item of Object.values(value)) flattenStrings(item, out)
    }
    return out
}

function normalize(value) {
    return value.replace(/\s+/g, " ").trim()
}

function removeAcceptedTechnicalTokens(value) {
    let result = value
    for (const token of ACCEPTED_TECHNICAL_TOKENS) {
        result = result.replace(new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), " ")
    }
    return result
}

function hasSuspiciousEnglishSentence(value) {
    const withoutTechnicalTokens = removeAcceptedTechnicalTokens(value)
    return /[A-Za-z]{4,}\s+[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(withoutTechnicalTokens)
}

function extractObjectBlock(source, objectName) {
    const marker = `${objectName}:`
    const start = source.indexOf(marker)
    if (start < 0) return ""

    const objectStart = source.indexOf("{", start)
    if (objectStart < 0) return ""

    let depth = 0
    for (let index = objectStart; index < source.length; index += 1) {
        const char = source[index]
        if (char === "{") depth += 1
        if (char === "}") {
            depth -= 1
            if (depth === 0) {
                return source.slice(objectStart, index + 1)
            }
        }
    }
    return ""
}

function extractLocalizedMetaValues(source, objectName, slug, locale) {
    const objectBlock = extractObjectBlock(source, objectName)
    const slugMatch = objectBlock.match(new RegExp(`"${slug}"\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`))
    if (!slugMatch) return null
    const localeMatch = slugMatch[1].match(new RegExp(`${locale.includes("-") ? `"${locale}"` : locale}\\s*:\\s*"([^"]+)"`))
    return localeMatch?.[1] ?? null
}

function checkGlossary(issues) {
    if (!fs.existsSync(GLOSSARY_PATH)) {
        addIssue(issues, "Missing docs/i18n/glossary.md")
        return
    }

    const glossary = readText(GLOSSARY_PATH)
    for (const locale of LOCALES) {
        if (!glossary.includes(locale)) {
            addIssue(issues, `Glossary does not mention locale ${locale}`)
        }
    }
    for (const term of GLOSSARY_TERMS) {
        if (!glossary.includes(term)) {
            addIssue(issues, `Glossary missing required term: ${term}`)
        }
    }

    for (const phrase of REQUIRED_POLICY_PHRASES) {
        if (!glossary.includes(phrase)) {
            addIssue(issues, `Glossary missing policy phrase: ${phrase}`)
        }
    }
}

function checkRepositoryPolicy(issues) {
    const contributing = readText(CONTRIBUTING_PATH)
    const review = readText(LOCALIZATION_REVIEW_PATH)
    const combined = `${contributing}\n${review}`

    for (const phrase of REQUIRED_POLICY_PHRASES) {
        if (!combined.includes(phrase)) {
            addIssue(issues, `Repository localization policy missing phrase: ${phrase}`)
        }
    }
    if (!combined.includes("docs/i18n/glossary.md")) {
        addIssue(issues, "Repository docs do not link to docs/i18n/glossary.md")
    }
}

function checkLocaleFiles(issues) {
    const sourceLocales = extractQuotedStringArray(readText(I18N_SOURCE_PATH), "LOCALES")
    if (sourceLocales.join("|") !== LOCALES.join("|")) {
        addIssue(issues, `LOCALES mismatch: expected ${LOCALES.join(", ")}, got ${sourceLocales.join(", ")}`)
    }

    const baseData = readJson(path.join(TRANSLATIONS_DIR, "en.json"))
    const baseStrings = flattenStrings(baseData).filter((value) => normalize(value).length > 0)

    for (const locale of LOCALES) {
        const localePath = path.join(TRANSLATIONS_DIR, `${locale}.json`)
        if (!fs.existsSync(localePath)) {
            addIssue(issues, `Missing translation file for ${locale}`)
            continue
        }

        const data = readJson(localePath)
        const values = flattenStrings(data).filter((value) => normalize(value).length > 0)
        if (values.length !== baseStrings.length) {
            addIssue(issues, `${locale}.json string count differs from en.json (${values.length} vs ${baseStrings.length})`)
        }

        const scriptRequirement = NON_LATIN_SCRIPT_REQUIREMENTS[locale]
        if (!scriptRequirement) continue
        const longValues = values.filter((value) => normalize(value).length >= 24)
        const missingScript = longValues.filter((value) => !scriptRequirement.test(value))
        if (missingScript.length > Math.floor(longValues.length * 0.08)) {
            addIssue(issues, `${locale}.json has too many long values without locale script (${missingScript.length}/${longValues.length})`)
        }
    }
}

function checkLocalizedMetadataSource(issues) {
    const source = readText(LOCALIZED_META_PATH)

    for (const slug of REQUIRED_META_SLUGS) {
        for (const locale of NON_EN_LOCALES) {
            const scriptRequirement = NON_LATIN_SCRIPT_REQUIREMENTS[locale]
            const title = extractLocalizedMetaValues(source, "TITLE_OVERRIDES", slug, locale)
            if (!title) {
                addIssue(issues, `TITLE_OVERRIDES missing ${slug} ${locale}`)
                continue
            }
            if (scriptRequirement && hasSuspiciousEnglishSentence(title)) {
                addIssue(issues, `TITLE_OVERRIDES ${slug} ${locale} looks English: ${title}`)
            }

            if (scriptRequirement && !scriptRequirement.test(title)) {
                addIssue(issues, `TITLE_OVERRIDES ${slug} ${locale} lacks locale script: ${title}`)
            }
        }
    }

    for (const slug of ["md5-digest-generator", "sha1-digest-generator", "sha224-digest-generator", "sha256-digest-generator", "sha384-digest-generator", "sha512-digest-generator"]) {
        for (const locale of NON_EN_LOCALES) {
            const scriptRequirement = NON_LATIN_SCRIPT_REQUIREMENTS[locale]
            const description = extractLocalizedMetaValues(source, "DESCRIPTION_OVERRIDES", slug, locale)
            if (!description) {
                addIssue(issues, `DESCRIPTION_OVERRIDES missing ${slug} ${locale}`)
                continue
            }
            if (scriptRequirement && hasSuspiciousEnglishSentence(description)) {
                addIssue(issues, `DESCRIPTION_OVERRIDES ${slug} ${locale} looks English: ${description}`)
            }
        }
    }
}

function checkRouteIntentCopy(issues) {
    const source = readText(ROUTE_INTENT_COPY_PATH)

    for (const locale of LOCALES) {
        const localeKey = locale.includes("-") ? `"${locale}"` : locale
        if (!source.includes(`${localeKey}:`)) {
            addIssue(issues, `Route intent copy missing locale ${locale}`)
        }
    }

    for (const locale of NON_EN_LOCALES) {
        const scriptRequirement = NON_LATIN_SCRIPT_REQUIREMENTS[locale]
        const block = extractObjectBlock(source, locale.includes("-") ? `"${locale}"` : locale)
        if (!block) continue
        const values = [...block.matchAll(/:\s*"([^"]+)"/g)].map((match) => match[1])
        for (const value of values) {
            if (scriptRequirement && hasSuspiciousEnglishSentence(value)) {
                addIssue(issues, `Route intent copy ${locale} looks English: ${value}`)
            }
            if (scriptRequirement && !scriptRequirement.test(value)) {
                addIssue(issues, `Route intent copy ${locale} lacks locale script: ${value}`)
            }
        }
    }
}

function main() {
    const issues = []

    checkGlossary(issues)
    checkRepositoryPolicy(issues)
    checkLocaleFiles(issues)
    checkLocalizedMetadataSource(issues)
    checkRouteIntentCopy(issues)

    if (issues.length > 0) {
        console.error(`[check:i18n-qa] Found ${issues.length} issue(s):`)
        for (const issue of issues.slice(0, 160)) {
            console.error(`- ${issue}`)
        }
        if (issues.length > 160) {
            console.error(`... truncated ${issues.length - 160} additional issue(s).`)
        }
        process.exit(1)
    }

    console.log("[check:i18n-qa] OK: glossary, locale coverage, metadata source, and localized route intent copy passed.")
}

main()
