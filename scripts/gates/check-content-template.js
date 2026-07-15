import fs from "node:fs"
import path from "node:path"
import { loadToolSlugs as loadToolSlugsFromManifests } from "../lib/tool-manifest-lib.js"

const DEFAULT_SCAN_DIRS = [".next/server/app", "out"]
const SUPPORTED_LOCALES = new Set(["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"])
const REQUIRED_TEMPLATE_LAYOUT_CLASS_TOKENS = ["w-full"]
const FORBIDDEN_TEMPLATE_LAYOUT_CLASS_PREFIXES = ["max-w-"]
const REQUIRED_TEMPLATE_LAYOUT_ATTRIBUTES = ["data-tool-content-template-width-sync"]

const REQUIRED_SECTION_TITLES_BY_LOCALE = {
    en: [
        "What this tool does",
        "Typical use cases",
        "Input examples",
        "Output examples",
        "Common errors and fixes",
        "Security and privacy notes",
        "Frequently asked questions",
    ],
    "zh-CN": [
        "\u8FD9\u4E2A\u5DE5\u5177\u80FD\u505A\u4EC0\u4E48",
        "\u5178\u578B\u4F7F\u7528\u573A\u666F",
        "\u8F93\u5165\u793A\u4F8B",
        "\u8F93\u51FA\u793A\u4F8B",
        "\u5E38\u89C1\u9519\u8BEF\u4E0E\u4FEE\u590D",
        "\u5B89\u5168\u4E0E\u9690\u79C1\u8BF4\u660E",
        "\u5E38\u89C1\u95EE\u9898",
    ],
    "zh-TW": [
        "\u9019\u500B\u5DE5\u5177\u80FD\u505A\u4EC0\u9EBC",
        "\u5178\u578B\u4F7F\u7528\u60C5\u5883",
        "\u8F38\u5165\u7BC4\u4F8B",
        "\u8F38\u51FA\u7BC4\u4F8B",
        "\u5E38\u898B\u932F\u8AA4\u8207\u4FEE\u6B63",
        "\u5B89\u5168\u8207\u96B1\u79C1\u8AAA\u660E",
        "\u5E38\u898B\u554F\u984C",
    ],
    ja: [
        "\u3053\u306E\u30C4\u30FC\u30EB\u3067\u3067\u304D\u308B\u3053\u3068",
        "\u3088\u304F\u3042\u308B\u5229\u7528\u30B7\u30FC\u30F3",
        "\u5165\u529B\u4F8B",
        "\u51FA\u529B\u4F8B",
        "\u3088\u304F\u3042\u308B\u30A8\u30E9\u30FC\u3068\u5BFE\u51E6\u6CD5",
        "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u3068\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u306E\u6CE8\u610F\u70B9",
        "\u3088\u304F\u3042\u308B\u8CEA\u554F",
    ],
    ko: [
        "\uC774 \uB3C4\uAD6C\uB85C \uD560 \uC218 \uC788\uB294 \uC77C",
        "\uB300\uD45C \uC0AC\uC6A9 \uC0AC\uB840",
        "\uC785\uB825 \uC608\uC2DC",
        "\uCD9C\uB825 \uC608\uC2DC",
        "\uC790\uC8FC \uBC1C\uC0DD\uD558\uB294 \uC624\uB958\uC640 \uD574\uACB0 \uBC29\uBC95",
        "\uBCF4\uC548 \uBC0F \uAC1C\uC778\uC815\uBCF4 \uCC38\uACE0 \uC0AC\uD56D",
        "\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38",
    ],
    de: [
        "Was dieses Tool macht",
        "Typische Anwendungsfälle",
        "Eingabebeispiele",
        "Ausgabebeispiele",
        "Häufige Fehler und Lösungen",
        "Hinweise zu Sicherheit und Datenschutz",
        "Häufig gestellte Fragen",
    ],
    fr: [
        "Ce que fait cet outil",
        "Cas d'utilisation courants",
        "Exemples d'entrée",
        "Exemples de sortie",
        "Erreurs courantes et correctifs",
        "Notes de sécurité et de confidentialité",
        "Questions fréquentes",
    ],
}

function parseLocale() {
    const localeArgIndex = process.argv.indexOf("--locale")
    if (localeArgIndex >= 0 && process.argv[localeArgIndex + 1]) {
        return process.argv[localeArgIndex + 1]
    }

    return process.env.CONTENT_TEMPLATE_LOCALE || "en"
}

function resolveScanDir() {
    if (process.env.CONTENT_TEMPLATE_SCAN_DIR) {
        return process.env.CONTENT_TEMPLATE_SCAN_DIR
    }

    for (const dir of DEFAULT_SCAN_DIRS) {
        if (fs.existsSync(dir)) return dir
    }

    return null
}

function loadToolSlugs() {
    const result = loadToolSlugsFromManifests()
    if (result.length === 0) {
        throw new Error(
            "[check:content-template] Failed to parse any tool slug from feature manifests",
        )
    }

    return result
}

function extractTemplateSection(html) {
    const marker = 'data-tool-content-template="full"'
    const markerIndex = html.indexOf(marker)
    if (markerIndex < 0) return null

    const sectionStart = html.lastIndexOf("<section", markerIndex)
    if (sectionStart < 0) return null

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

function extractSectionStartClassList(sectionHtml) {
    const sectionStartMatch = sectionHtml.match(/^<section\b[^>]*>/)
    if (!sectionStartMatch) return []

    const classAttrMatch = sectionStartMatch[0].match(/\bclass="([^"]+)"/)
    if (!classAttrMatch) return []

    return classAttrMatch[1]
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
}

function includesSectionTitle(sectionHtml, sectionTitle) {
    const variants = [
        sectionTitle,
        sectionTitle.replaceAll("'", "&#x27;"),
        sectionTitle.replaceAll("'", "&#39;"),
        sectionTitle.replaceAll("'", "&apos;"),
    ]

    return variants.some((variant) => sectionHtml.includes(variant))
}

function main() {
    const locale = parseLocale()
    if (!SUPPORTED_LOCALES.has(locale)) {
        console.error(
            `[check:content-template] Unsupported locale "${locale}". Supported locales: ${Array.from(
                SUPPORTED_LOCALES,
            ).join(", ")}`,
        )
        process.exit(1)
    }

    const requiredSectionTitles = REQUIRED_SECTION_TITLES_BY_LOCALE[locale]
    if (!requiredSectionTitles) {
        console.error(
            `[check:content-template] Missing required title set for locale "${locale}"`,
        )
        process.exit(1)
    }

    const scanDir = resolveScanDir()
    if (!scanDir) {
        console.error(
            "[check:content-template] No build output directory found. Expected one of: .next/server/app or out",
        )
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
        const templateSection = extractTemplateSection(html)
        if (!templateSection) {
            failures.push(`${slug}: content template block not found`)
            continue
        }

        const classList = extractSectionStartClassList(templateSection)
        for (const token of REQUIRED_TEMPLATE_LAYOUT_CLASS_TOKENS) {
            if (!classList.includes(token)) {
                failures.push(`${slug}: template layout missing class token "${token}"`)
            }
        }
        for (const prefix of FORBIDDEN_TEMPLATE_LAYOUT_CLASS_PREFIXES) {
            if (classList.some((token) => token.startsWith(prefix))) {
                failures.push(`${slug}: template layout must inherit route width instead of using "${prefix}*"`)
            }
        }

        for (const attr of REQUIRED_TEMPLATE_LAYOUT_ATTRIBUTES) {
            if (!templateSection.includes(`${attr}=`)) {
                failures.push(`${slug}: template layout missing attribute "${attr}"`)
            }
        }

        for (const sectionTitle of requiredSectionTitles) {
            if (!includesSectionTitle(templateSection, sectionTitle)) {
                failures.push(`${slug}: missing section "${sectionTitle}"`)
            }
        }
    }

    if (failures.length > 0) {
        console.error(`[check:content-template] ${failures.length} issue(s) found:`)
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(
        `[check:content-template] OK (${locale}): ${targetSlugs.length}/${targetSlugs.length} tool pages include the required content-template sections`,
    )
}

main()
