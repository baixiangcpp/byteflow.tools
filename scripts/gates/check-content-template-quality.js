import fs from "node:fs"
import path from "node:path"
import { loadToolSlugs as loadToolSlugsFromManifests } from "../lib/tool-manifest-lib.js"

const BASELINE_PATH = "scripts/gates/content-template-quality-baseline.json"
const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const SUPPORTED_LOCALES = new Set(["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"])

const SECTION_HEADING_BY_LOCALE = {
    en: {
        useCases: "Typical use cases",
        inputExamples: "Input examples",
        outputExamples: "Output examples",
        faq: "Frequently asked questions",
    },
    "zh-CN": {
        useCases: "典型使用场景",
        inputExamples: "输入示例",
        outputExamples: "输出示例",
        faq: "常见问题",
    },
    "zh-TW": {
        useCases: "典型使用情境",
        inputExamples: "輸入範例",
        outputExamples: "輸出範例",
        faq: "常見問題",
    },
    ja: {
        useCases: "よくある利用シーン",
        inputExamples: "入力例",
        outputExamples: "出力例",
        faq: "よくある質問",
    },
    ko: {
        useCases: "대표 사용 사례",
        inputExamples: "입력 예시",
        outputExamples: "출력 예시",
        faq: "자주 묻는 질문",
    },
    de: {
        useCases: "Typische Anwendungsfälle",
        inputExamples: "Eingabebeispiele",
        outputExamples: "Ausgabebeispiele",
        faq: "Häufig gestellte Fragen",
    },
    fr: {
        useCases: "Cas d'utilisation courants",
        inputExamples: "Exemples d'entrée",
        outputExamples: "Exemples de sortie",
        faq: "Questions fréquentes",
    },
}

const PLACEHOLDER_SIGNALS_BY_LOCALE = {
    en: [
        "representative source content used by your workflow",
        "api integration and incident triage",
    ],
    "zh-CN": [
        "实际使用的代表性内容",
        "api 调试和集成测试",
    ],
    "zh-TW": [
        "實際使用的代表性內容",
        "api 串接時驗證",
    ],
    ja: [
        "代表的な入力を貼り付けます",
        "api連携時に",
    ],
    ko: [
        "대표 데이터를 붙여 넣으세요",
        "api 연동 중",
    ],
    de: [
        "typische daten aus ihrem workflow",
        "api-integration und incident-analyse",
    ],
    fr: [
        "données représentatives de votre workflow",
        "intégration api et l'analyse d'incident",
    ],
}

const DEFAULT_MINIMUMS = {
    introTextChars: 40,
    useCaseItems: 3,
    inputExampleBlocks: 2,
    outputExampleBlocks: 2,
    faqItems: 3,
}

function getArgValue(flagName) {
    const eqMatch = process.argv.find((arg) => arg.startsWith(`${flagName}=`))
    if (eqMatch) return eqMatch.slice(flagName.length + 1).trim()

    const index = process.argv.indexOf(flagName)
    if (index >= 0 && process.argv[index + 1]) {
        return process.argv[index + 1]
    }

    return null
}

function normalizeMode(rawMode) {
    if (!rawMode) return null
    const normalized = rawMode.toLowerCase()
    if (normalized !== "warn" && normalized !== "fail") return null
    return normalized
}

function parseLocale() {
    return getArgValue("--locale") || process.env.CONTENT_TEMPLATE_QUALITY_LOCALE || "en"
}

function resolveScanDir() {
    if (process.env.CONTENT_TEMPLATE_QUALITY_SCAN_DIR) {
        return process.env.CONTENT_TEMPLATE_QUALITY_SCAN_DIR
    }

    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) return dir
    }

    return null
}

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function loadToolSlugs() {
    const result = loadToolSlugsFromManifests()
    if (result.length === 0) {
        throw new Error("[check:content-template-quality] Failed to parse any tool slug from feature manifests")
    }

    return result
}

function extractTemplateSection(html) {
    const marker = 'data-tool-content-template="full"'
    const markerIndex = html.indexOf(marker)
    if (markerIndex < 0) return null

    const sectionStart = html.lastIndexOf("<section", markerIndex)
    if (sectionStart < 0) return null

    return extractSectionByStart(html, sectionStart)
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

function buildTitleVariants(title) {
    return [
        title,
        title.replaceAll("'", "&#x27;"),
        title.replaceAll("'", "&#39;"),
        title.replaceAll("'", "&apos;"),
    ]
}

function findSectionByHeading(templateSection, headingTitle) {
    const variants = buildTitleVariants(headingTitle)
    let headingIndex = -1

    for (const variant of variants) {
        const index = templateSection.indexOf(variant)
        if (index >= 0 && (headingIndex < 0 || index < headingIndex)) {
            headingIndex = index
        }
    }

    if (headingIndex < 0) return null

    const sectionStart = templateSection.lastIndexOf("<section", headingIndex)
    if (sectionStart < 0) return null

    return extractSectionByStart(templateSection, sectionStart)
}

function countMatches(text, regex) {
    const matches = text.match(regex)
    return matches ? matches.length : 0
}

function validateIntro(templateSection, minimums, failures, slug) {
    const headerMatch = templateSection.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)
    if (!headerMatch) {
        failures.push(`${slug}: intro header block not found`)
        return
    }

    const introText = toPlainText(headerMatch[0])
    if (introText.length < minimums.introTextChars) {
        failures.push(`${slug}: intro text too short (${introText.length} < ${minimums.introTextChars})`)
    }
}

function checkPlaceholderSignal(locale, templateSection) {
    const normalized = toPlainText(templateSection).toLowerCase()
    const signals = PLACEHOLDER_SIGNALS_BY_LOCALE[locale] || []
    return signals.some((signal) => normalized.includes(signal))
}

function main() {
    const baseline = loadJson(BASELINE_PATH)
    const locale = parseLocale()
    const mode = normalizeMode(getArgValue("--mode"))
        || normalizeMode(process.env.CONTENT_TEMPLATE_QUALITY_MODE)
        || normalizeMode(baseline?.rollout?.defaultMode)
        || "fail"

    if (!SUPPORTED_LOCALES.has(locale)) {
        console.error(`[check:content-template-quality] Unsupported locale "${locale}". Supported locales: ${Array.from(SUPPORTED_LOCALES).join(", ")}`)
        process.exit(1)
    }

    if (!SECTION_HEADING_BY_LOCALE[locale]) {
        console.error(`[check:content-template-quality] Missing section-heading config for locale "${locale}"`)
        process.exit(1)
    }

    const placeholderLimit = baseline?.maxPlaceholderSignalPages?.[locale]
    if (typeof placeholderLimit !== "number") {
        console.error(`[check:content-template-quality] Missing placeholder baseline for locale "${locale}" in ${BASELINE_PATH}`)
        process.exit(1)
    }

    const minimums = { ...DEFAULT_MINIMUMS, ...(baseline?.minimums || {}) }

    const scanDir = resolveScanDir()
    if (!scanDir) {
        console.error("[check:content-template-quality] No build output directory found. Expected one of: .next/server/app or out")
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
    let placeholderSignalPages = 0

    const headings = SECTION_HEADING_BY_LOCALE[locale]

    for (const slug of targetSlugs) {
        const htmlPath = path.join(scanDir, locale, `${slug}.html`)
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

        validateIntro(templateSection, minimums, failures, slug)

        const useCaseSection = findSectionByHeading(templateSection, headings.useCases)
        if (!useCaseSection) {
            failures.push(`${slug}: use-cases section not found`)
        } else {
            const itemCount = countMatches(useCaseSection, /<li\b/g)
            if (itemCount < minimums.useCaseItems) {
                failures.push(`${slug}: use-cases too short (${itemCount} < ${minimums.useCaseItems})`)
            }
        }

        const inputSection = findSectionByHeading(templateSection, headings.inputExamples)
        if (!inputSection) {
            failures.push(`${slug}: input-examples section not found`)
        } else {
            const blockCount = countMatches(inputSection, /<pre\b/g)
            if (blockCount < minimums.inputExampleBlocks) {
                failures.push(`${slug}: input-examples too short (${blockCount} < ${minimums.inputExampleBlocks})`)
            }
        }

        const outputSection = findSectionByHeading(templateSection, headings.outputExamples)
        if (!outputSection) {
            failures.push(`${slug}: output-examples section not found`)
        } else {
            const blockCount = countMatches(outputSection, /<pre\b/g)
            if (blockCount < minimums.outputExampleBlocks) {
                failures.push(`${slug}: output-examples too short (${blockCount} < ${minimums.outputExampleBlocks})`)
            }
        }

        const faqSection = findSectionByHeading(templateSection, headings.faq)
        if (!faqSection) {
            failures.push(`${slug}: faq section not found`)
        } else {
            const itemCount = countMatches(faqSection, /<p class="text-sm font-medium text-foreground">/g)
            if (itemCount < minimums.faqItems) {
                failures.push(`${slug}: faq too short (${itemCount} < ${minimums.faqItems})`)
            }
        }

        if (checkPlaceholderSignal(locale, templateSection)) {
            placeholderSignalPages += 1
        }
    }

    const placeholderExceeded = placeholderSignalPages > placeholderLimit

    console.log(`[check:content-template-quality] Locale: ${locale}`)
    console.log(`[check:content-template-quality] Scan dir: ${path.relative(process.cwd(), scanDir)}`)
    console.log(`[check:content-template-quality] Placeholder signal pages: ${placeholderSignalPages} (limit ${placeholderLimit})`)

    if (failures.length > 0) {
        console.error(`[check:content-template-quality] FAILED: ${failures.length} structural issue(s) found:`)
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    if (placeholderExceeded) {
        const message = `[check:content-template-quality] Placeholder signal regression: ${placeholderSignalPages} > ${placeholderLimit}`
        if (mode === "warn") {
            console.warn(`${message} (warn mode)`)
            process.exit(0)
        }
        console.error(`${message} (fail mode)`)
        process.exit(1)
    }

    console.log("[check:content-template-quality] OK: quality floor and placeholder-ratchet checks passed")
}

main()
