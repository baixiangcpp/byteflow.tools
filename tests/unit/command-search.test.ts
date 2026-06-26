import { describe, expect, it } from "vitest"
import { scoreCommandSearch, scoreToolSearch, type ToolSearchDocument } from "@/core/search/command-search"
import { getCommandSearchToolByKey } from "@/generated/command-search-index"
import { TRANSLATIONS } from "@/core/i18n/translations/catalog"
import { LOCALES, type Locale } from "@/core/i18n/i18n"

function buildRealToolDocument(toolKey: string, locale: Locale = "en"): ToolSearchDocument {
    const tool = getCommandSearchToolByKey(toolKey)
    if (!tool) throw new Error(`Missing generated command search tool: ${toolKey}`)
    const localizedTools = TRANSLATIONS[locale].tools as Record<string, { title?: string; description?: string }>
    const englishTools = TRANSLATIONS.en.tools as Record<string, { title?: string; description?: string }>
    const translation = localizedTools[toolKey]
    const english = englishTools[toolKey]

    return {
        title: translation?.title ?? english?.title ?? toolKey,
        description: [translation?.description, english?.description].filter(Boolean).join(" "),
        slug: tool.slug,
        key: tool.key,
        family: tool.family,
        keywords: tool.keywords,
        aliases: tool.aliases,
        searchKeywords: tool.searchKeywords,
        tags: tool.tags,
        capabilities: tool.capabilities,
        locale,
    }
}

function rankRealTools(query: string, locale: Locale = "en"): string[] {
    const keys = [
        "json_formatter",
        "jwt_decoder",
        "base64_encode_decode",
        "regex_tester",
        "curl_to_code",
        "openapi_viewer",
        "log_scrubber",
        "har_viewer_sanitizer",
        "youtube_thumbnail_grabber",
        "open_graph_meta_generator",
        "qr_code_generator",
        "password_generator",
        "image_resizer",
        "url_parser",
        "url_encode_decode",
        "hash_generator",
        "certificate_decoder",
        "uuid_generator",
    ]

    return keys
        .map((toolKey, index) => ({
            index,
            score: scoreToolSearch(buildRealToolDocument(toolKey, locale), query, { locale }),
            toolKey,
        }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .map((item) => item.toolKey)
}

function expectTop3(query: string, expectedToolKey: string, locale: Locale = "en") {
    expect(rankRealTools(query, locale).slice(0, 3), `${locale} query: ${query}`).toContain(expectedToolKey)
}

describe("scoreCommandSearch", () => {
    it("prioritizes exact and prefix matches over loose token matches", () => {
        const exact = scoreCommandSearch("JSON Formatter", "json formatter")
        const loose = scoreCommandSearch("Format JSON payloads", "json formatter", ["json formatter"])

        expect(exact).toBeGreaterThan(loose)
        expect(loose).toBeGreaterThan(0)
    })

    it("matches slug-style queries against normalized keywords", () => {
        const score = scoreCommandSearch("JSON Formatter", "json-formatter", ["json-formatter", "format json online"])

        expect(score).toBeGreaterThan(80)
    })

    it("requires every query token to be represented", () => {
        expect(scoreCommandSearch("Base64 Encode/Decode", "base64 decode")).toBeGreaterThan(0)
        expect(scoreCommandSearch("Base64 Encode/Decode", "base64 jwt")).toBe(0)
    })

    it("allows small spelling mistakes for longer terms", () => {
        const typoScore = scoreCommandSearch("JSON Formatter", "formater")
        const missScore = scoreCommandSearch("JSON Formatter", "formzz")

        expect(typoScore).toBeGreaterThan(0)
        expect(missScore).toBe(0)
    })

    it("matches multilingual keywords without replacing visible labels", () => {
        const score = scoreCommandSearch("JSON Formatter", "格式化", ["JSON格式化", "美化", "验证"])

        expect(score).toBeGreaterThan(0)
    })

    it("scores all-tools query regressions against rich tool metadata", () => {
        const tools: Record<string, ToolSearchDocument> = {
            jwt: {
                title: "JWT Decoder",
                description: "Decode token headers and claims.",
                slug: "jwt-decoder",
                key: "jwt_decoder",
                keywords: ["decode token", "jwt token"],
                tags: ["jwt", "security"],
            },
            json: {
                title: "JSON Formatter",
                description: "Pretty print and validate JSON payloads.",
                slug: "json-formatter",
                key: "json_formatter",
                keywords: ["pretty json", "format json"],
                tags: ["json"],
            },
            base64: {
                title: "Base64 Encode/Decode",
                description: "Encode and decode Base64 text.",
                slug: "base64-encode-decode",
                key: "base64_encode_decode",
                keywords: ["base 64", "base64"],
                tags: ["base64"],
            },
            securityHeaders: {
                title: "Security Header Analyzer",
                description: "Analyze HTTP security headers.",
                slug: "security-header-analyzer",
                key: "security_header_analyzer",
                keywords: ["安全头", "security headers"],
                tags: ["http", "security"],
            },
            cron: {
                title: "Cron Visualizer",
                description: "Explain cron schedules.",
                slug: "cron-visualizer",
                key: "cron_visualizer",
                keywords: ["cron explain", "crontab"],
                tags: ["cron"],
            },
        }

        expect(scoreToolSearch(tools.jwt, "decode token")).toBeGreaterThan(scoreToolSearch(tools.json, "decode token"))
        expect(scoreToolSearch(tools.json, "pretty json")).toBeGreaterThan(scoreToolSearch(tools.jwt, "pretty json"))
        expect(scoreToolSearch(tools.base64, "base 64")).toBeGreaterThan(0)
        expect(scoreToolSearch(tools.securityHeaders, "安全头")).toBeGreaterThan(0)
        expect(scoreToolSearch(tools.cron, "cron explain")).toBeGreaterThan(0)
    })

    it("returns intended tools in the top 3 for common English task queries", () => {
        const cases: Array<[string, string]> = [
            ["json", "json_formatter"],
            ["format payload", "json_formatter"],
            ["json prettify", "json_formatter"],
            ["jwt", "jwt_decoder"],
            ["decode token", "jwt_decoder"],
            ["base64", "base64_encode_decode"],
            ["base 64", "base64_encode_decode"],
            ["base64 urlsafe", "base64_encode_decode"],
            ["regex", "regex_tester"],
            ["curl", "curl_to_code"],
            ["curl generator", "curl_to_code"],
            ["openapi", "openapi_viewer"],
            ["log", "log_scrubber"],
            ["sanitize HAR", "har_viewer_sanitizer"],
            ["thumbnail", "youtube_thumbnail_grabber"],
            ["seo", "open_graph_meta_generator"],
            ["make QR", "qr_code_generator"],
            ["password", "password_generator"],
            ["resize image", "image_resizer"],
        ]

        for (const [query, expectedToolKey] of cases) {
            expectTop3(query, expectedToolKey)
        }
    })

    it("supports localized and mixed-language queries across supported locales", () => {
        const cases: Partial<Record<Locale, Array<[string, string]>>> = {
            "zh-CN": [
                ["JSON 格式化", "json_formatter"],
                ["JWT 解码", "jwt_decoder"],
                ["Base64 解码", "base64_encode_decode"],
                ["正则表达式测试", "regex_tester"],
                ["日志 脱敏", "log_scrubber"],
                ["二维码 生成", "qr_code_generator"],
            ],
            "zh-TW": [
                ["JSON 格式化", "json_formatter"],
                ["JWT 解碼", "jwt_decoder"],
                ["Base64 解碼", "base64_encode_decode"],
                ["正則表達式測試", "regex_tester"],
            ],
            ja: [
                ["JSON フォーマット", "json_formatter"],
                ["JWT デコード", "jwt_decoder"],
                ["Base64 デコード", "base64_encode_decode"],
                ["正規表現 テスト", "regex_tester"],
            ],
            ko: [
                ["JSON 포맷", "json_formatter"],
                ["JWT 디코딩", "jwt_decoder"],
                ["Base64 디코딩", "base64_encode_decode"],
                ["정규식 테스트", "regex_tester"],
            ],
            de: [
                ["JSON formatieren", "json_formatter"],
                ["JWT dekodieren", "jwt_decoder"],
                ["Base64 dekodieren", "base64_encode_decode"],
                ["Regex testen", "regex_tester"],
            ],
            fr: [
                ["formater JSON", "json_formatter"],
                ["décoder JWT", "jwt_decoder"],
                ["décoder Base64", "base64_encode_decode"],
                ["tester regex", "regex_tester"],
            ],
        }

        for (const locale of LOCALES) {
            for (const [query, expectedToolKey] of cases[locale] ?? []) {
                expectTop3(query, expectedToolKey, locale)
            }
        }
    })
})
