import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { getRegexPresetSample } from "@/features/tools/regex-generator/utils"
import { LOCALIZED_ARTICLES } from "@/core/seo/localized-articles"
import { TRANSLATIONS } from "@/core/i18n/translations/catalog"

const GENERATED_ZH_TW_PATH = path.join(
    process.cwd(),
    "src",
    "core",
    "seo",
    "components",
    "tool-content-template-modules",
    "generated",
    "zh-TW.json",
)
const GENERATED_ZH_CN_PATH = path.join(
    process.cwd(),
    "src",
    "core",
    "seo",
    "components",
    "tool-content-template-modules",
    "generated",
    "zh-CN.json",
)
const GENERATED_JA_PATH = path.join(
    process.cwd(),
    "src",
    "core",
    "seo",
    "components",
    "tool-content-template-modules",
    "generated",
    "ja.json",
)

describe("localized content consistency guards", () => {
    it("uses locale-agnostic regex email sample text", () => {
        const sample = getRegexPresetSample("email")
        expect(sample).toBe("team@byteflow.tools\nsupport@example.org")
        expect(sample).not.toContain("Contact us at")
    })

    it("keeps robots checklist output localized for non-English locales", () => {
        const locales = ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"] as const
        const entry = LOCALIZED_ARTICLES["robots-txt-testing-checklist"]
        for (const locale of locales) {
            const output = entry.locales[locale].exampleOutput
            expect(output).not.toContain("crawler access: blocked")
            expect(output).not.toContain("indexing risk: critical")
        }
    })

    it("uses standardized Design Token terminology for color shades in Chinese locales", () => {
        expect(TRANSLATIONS["zh-CN"].tools.color_shades_generator.description).toContain("设计令牌")
        expect(TRANSLATIONS["zh-TW"].tools.color_shades_generator.description).toContain("設計權杖")
    })

    it("keeps zh-TW wording in core regex/common labels and template copy", () => {
        expect(TRANSLATIONS["zh-TW"].common.sample_image).toBe("範例圖片")
        expect(TRANSLATIONS["zh-TW"].tools.regex_generator.sample_text_label).toBe("範例文字")
        expect(TRANSLATIONS["zh-TW"].tools.regex_generator.sample_matches_label).toBe("範例比對")
        expect(TRANSLATIONS["zh-TW"].tools.regex_generator.no_matches).toBe("沒有比對結果")
        expect(TRANSLATIONS["zh-TW"].tools.multiple_whitespace_remover.sample_text).not.toContain("示例")
        expect(TRANSLATIONS["zh-TW"].tools.regex_tester.match_results_label).toBe("比對結果")

        const zhTwGenerated = JSON.parse(
            fs.readFileSync(GENERATED_ZH_TW_PATH, "utf8"),
        ) as Record<string, { content?: { intro?: string; whatThisToolDoes?: string[] } }>

        const colorShades = zhTwGenerated["color-shades-generator"]
        expect(colorShades?.content?.intro || "").toContain("設計權杖")
        expect((colorShades?.content?.intro || "").toLowerCase()).not.toContain("design token")
        for (const line of colorShades?.content?.whatThisToolDoes || []) {
            expect(line).not.toContain("design token")
        }
    })

    it("keeps targeted zh-TW generated tool content specific instead of fallback template filler", () => {
        const zhTwGenerated = JSON.parse(
            fs.readFileSync(GENERATED_ZH_TW_PATH, "utf8"),
        ) as Record<string, { content?: { intro?: string; inputExamples?: Array<{ value?: string }> } }>

        const genericFragments = [
            "會依照目前輸入立即更新結果，方便先確認主要輸出是否符合預期。",
            "在交付前再次確認",
            "保留一份通過",
        ]
        const targetedKeys = [
            "jwt-decoder",
            "password-generator",
            "css-gradient-generator",
            "cidr-subnet-calculator",
            "color-shades-generator",
            "react-native-shadow-generator",
            "list-randomizer",
            "security-header-analyzer",
            "instagram-photo-downloader",
            "instagram-post-generator",
        ]

        for (const key of targetedKeys) {
            const serialized = JSON.stringify(zhTwGenerated[key])
            for (const fragment of genericFragments) {
                expect(serialized).not.toContain(fragment)
            }
        }

        expect(zhTwGenerated["jwt-decoder"]?.content?.intro || "").toContain("不會驗證簽章")
        expect(zhTwGenerated["cidr-subnet-calculator"]?.content?.intro || "").toContain("IPv4 CIDR")
        expect(
            JSON.stringify(zhTwGenerated["cidr-subnet-calculator"]?.content?.inputExamples || []),
        ).not.toContain("2001:db8")
        expect(zhTwGenerated["color-shades-generator"]?.content?.intro || "").toContain("設計權杖")
        expect(zhTwGenerated["list-randomizer"]?.content?.intro || "").toContain("種子")
        expect(zhTwGenerated["security-header-analyzer"]?.content?.intro || "").toContain("HTTP")
        expect(zhTwGenerated["instagram-photo-downloader"]?.content?.intro || "").toContain("直接圖片網址")
    })

    it("keeps targeted zh-CN generated content aligned with actual tool behavior and terminology", () => {
        const zhCnGenerated = JSON.parse(
            fs.readFileSync(GENERATED_ZH_CN_PATH, "utf8"),
        ) as Record<string, { content?: { intro?: string; inputExamples?: Array<{ value?: string }> } }>

        const cidrSerialized = JSON.stringify(zhCnGenerated["cidr-subnet-calculator"])
        expect(cidrSerialized).not.toContain("它将转换将")
        expect(cidrSerialized).not.toContain("2001:db8")
        expect(zhCnGenerated["cidr-subnet-calculator"]?.content?.intro || "").toContain("IPv4 CIDR")

        const colorShadesSerialized = JSON.stringify(zhCnGenerated["color-shades-generator"])
        expect(colorShadesSerialized).toContain("设计令牌")
        expect(colorShadesSerialized).not.toContain("设计标记")
        expect(colorShadesSerialized).not.toContain("Token 映射")
    })

    it("keeps confirmed zh-CN production fixes pinned to corrected terminology and examples", () => {
        const zhCnGenerated = JSON.parse(
            fs.readFileSync(GENERATED_ZH_CN_PATH, "utf8"),
        ) as Record<string, {
            content?: {
                intro?: string
                whatThisToolDoes?: string[]
                useCases?: string[]
                outputExamples?: Array<{ label?: string; value?: string }>
                commonErrors?: Array<{ error?: string; fix?: string }>
                faqs?: Array<{ a?: string }>
            }
            workflowSteps?: string[]
        }>

        expect(TRANSLATIONS["zh-CN"].tools.jsonpath_playground.path_placeholder).toBe("$['data']['rows'][0]['id']")

        const zhCnSerialized = JSON.stringify(zhCnGenerated)
        expect(zhCnSerialized).not.toContain("显式确认编码、分隔符、时区等前提。")
        expect(zhCnSerialized).not.toContain("在功能推出中审查 API 负载前后。")
        expect(zhCnSerialized).not.toContain("大粘贴斑点很难扫描")
        expect(zhCnSerialized).not.toContain("已将 3 -> 5 标记为修改")
        expect(zhCnSerialized).not.toContain("与错误顺序进行比较的行")
        expect(zhCnSerialized).not.toContain("种子固定装置")
        expect(zhCnSerialized).not.toContain("碰撞安全标识符")
        expect(zhCnSerialized).not.toContain("打破玻璃帐户")
        expect(zhCnSerialized).not.toContain("强机密")
        expect(zhCnSerialized).not.toContain("破碎玻璃恢复操作手册")
        expect(zhCnSerialized).not.toContain("纪元")
        expect(zhCnSerialized).not.toContain("JSONPath 评估在本地运行浏览器.")
        expect(zhCnSerialized).not.toContain("显式查询范围狭窄段和过滤器")
        expect(zhCnSerialized).not.toContain("使用 markdown 或文档 CSS 重新应用基本演示文稿")

        expect(zhCnGenerated["html-to-markdown"]?.content?.intro || "").toContain("清晰的 Markdown")
        expect(JSON.stringify(zhCnGenerated["html-to-markdown"])).not.toContain("固定装置")
        expect(zhCnGenerated["html-to-markdown"]?.content?.outputExamples?.[0]?.value).toContain("## note-01")
        expect(zhCnGenerated["html-to-markdown"]?.content?.outputExamples?.[1]?.value).toContain("- step-01")
        expect((zhCnGenerated["html-to-markdown"]?.content?.commonErrors || []).map((item) => item.fix || "").join(" ")).toContain("安全净化流程")
        expect((zhCnGenerated["html-to-markdown"]?.workflowSteps || []).join(" ")).toContain("README")
        expect(zhCnGenerated["jsonpath-playground"]?.content?.intro || "").toContain("结构化 JSON")
        expect((zhCnGenerated["jsonpath-playground"]?.content?.commonErrors || []).map((item) => item.fix || "").join(" ")).toContain("过滤条件")
        expect((zhCnGenerated["jsonpath-playground"]?.workflowSteps || []).join(" ")).toContain("$.data.rows.*.id")
        expect(zhCnGenerated["text-diff-checker"]?.content?.outputExamples?.[0]?.value || "").toContain("已将 3 改为 5")
        expect(zhCnGenerated["uuid-generator"]?.content?.intro || "").toContain("避免冲突")
        expect(
            (zhCnGenerated["password-generator"]?.content?.whatThisToolDoes || []).join(" "),
        ).toContain("应急账户")
        expect((zhCnGenerated["unix-timestamp"]?.content?.intro || "")).toContain("Unix 时间戳值")
        expect(
            (zhCnGenerated["totp-generator"]?.content?.useCases || []).join(" "),
        ).toContain("应急恢复操作手册")
        expect(
            (zhCnGenerated["jwt-decoder"]?.content?.commonErrors || []).map((item) => item.fix || "").join(" "),
        ).toContain("UTC 时间戳")
    })

    it("keeps confirmed ja production fixes pinned to corrected placeholders and examples", () => {
        const jaGenerated = JSON.parse(
            fs.readFileSync(GENERATED_JA_PATH, "utf8"),
        ) as Record<string, {
            content?: {
                intro?: string
                useCases?: string[]
                outputExamples?: Array<{ value?: string }>
                commonErrors?: Array<{ fix?: string }>
            }
            workflowSteps?: string[]
        }>

        expect(TRANSLATIONS["ja"].tools.jsonpath_playground.path_placeholder).toBe("$['data']['rows'][0]['id']")

        const jaSerialized = JSON.stringify(jaGenerated)
        expect(jaSerialized).not.toContain("エンコード、区切り文字、タイムゾーンなどの前提を明示的に確認します。")
        expect(jaSerialized).not.toContain("必須項目、区切り、エンコード設定を確認してから再実行してください。")
        expect(jaSerialized).not.toContain("3 -> 5 marked as modified")
        expect(jaSerialized).not.toContain("便利な情報を保持します。")
        expect(jaSerialized).not.toContain("インライン スタイルは使用できません。保存")
        expect(jaSerialized).not.toContain("出力を処理")
        expect(jaSerialized).not.toContain("明示的なセグメントと狭いクエリ範囲フィルタ。")
        expect(jaSerialized).not.toContain("Web、モバイル、およびサービス間のトークン ペイロードの違いを比較します。クライアント。")
        expect(JSON.stringify(jaGenerated["html-to-markdown"])).not.toContain("このページが重視している観点は次のとおりです")

        expect(jaGenerated["html-to-markdown"]?.content?.intro || "").toContain("HTML 片")
        expect(jaGenerated["html-to-markdown"]?.content?.outputExamples?.[0]?.value).toContain("## note-01")
        expect(jaGenerated["html-to-markdown"]?.content?.outputExamples?.[1]?.value || "").toContain("- step-02")
        expect((jaGenerated["html-to-markdown"]?.content?.commonErrors || []).map((item) => item.fix || "").join(" ")).toContain("安全化処理")
        expect(jaGenerated["text-diff-checker"]?.content?.outputExamples?.[0]?.value || "").toContain("3 から 5")
        expect(jaGenerated["jsonpath-playground"]?.content?.intro || "").toContain("構造化 JSON")
        expect((jaGenerated["jsonpath-playground"]?.content?.commonErrors || []).map((item) => item.fix || "").join(" ")).toContain("フィルタ条件")
        expect((jaGenerated["jsonpath-playground"]?.workflowSteps || []).join(" ")).toContain("$.data.rows.*.id")
        expect(jaGenerated["jwt-decoder"]?.content?.intro || "").toContain("ローカルでデコード")
        expect((jaGenerated["jwt-decoder"]?.content?.useCases || []).join(" ")).toContain("ペイロード差分")
    })
})
