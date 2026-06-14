import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { applySeoSnippetAngle } from "@/core/seo/seo"

const ZH_FREE_ONLINE_TOOL = "\u514d\u8d39\u5728\u7ebf\u5de5\u5177"
const JA_HUB_DESCRIPTION = "\u7528\u9014\u5225\u306b\u6bd4\u8f03\u3057\u3066\u6700\u9069\u306a\u30d5\u30ed\u30fc"
const KO_CHECKLIST = "\uccb4\ud06c\ub9ac\uc2a4\ud2b8"
const DE_ENTHAELT = "Enth\u00e4lt"
const FR_INSTANTANEMENT = "instantan\u00e9ment"

describe("applySeoSnippetAngle locale coverage", () => {
    it("applies tool-route boost for every locale", () => {
        for (const locale of LOCALES) {
            const result = applySeoSnippetAngle({
                lang: locale,
                routeType: "tool",
                title: "Sample Tool",
                description: "Sample description.",
            })

            expect(result.title).not.toBe("Sample Tool")
            expect(result.description).not.toBe("Sample description.")
        }
    })

    it("applies hub-route boost for every locale", () => {
        for (const locale of LOCALES) {
            const result = applySeoSnippetAngle({
                lang: locale,
                routeType: "hub",
                title: "Sample Hub",
                description: "Sample description.",
            })

            expect(result.title).not.toBe("Sample Hub")
            expect(result.description).not.toBe("Sample description.")
        }
    })

    it("applies content-route description boost for every locale", () => {
        for (const locale of LOCALES) {
            const result = applySeoSnippetAngle({
                lang: locale,
                routeType: "content",
                title: "Sample Content",
                description: "Sample description.",
            })

            expect(result.description).not.toBe("Sample description.")
        }
    })

    it("keeps localized snippet boosts readable instead of mojibake", () => {
        expect(applySeoSnippetAngle({
            lang: "zh-CN",
            routeType: "tool",
            title: "示例工具",
            description: "示例描述。",
        }).title).toContain(ZH_FREE_ONLINE_TOOL)

        expect(applySeoSnippetAngle({
            lang: "ja",
            routeType: "hub",
            title: "サンプル",
            description: "サンプル説明。",
        }).description).toContain(JA_HUB_DESCRIPTION)

        expect(applySeoSnippetAngle({
            lang: "ko",
            routeType: "content",
            title: "예시",
            description: "예시 설명.",
        }).description).toContain(KO_CHECKLIST)

        expect(applySeoSnippetAngle({
            lang: "de",
            routeType: "content",
            title: "Beispiel",
            description: "Beispielbeschreibung.",
        }).description).toContain(DE_ENTHAELT)

        expect(applySeoSnippetAngle({
            lang: "fr",
            routeType: "tool",
            title: "Exemple",
            description: "Description d'exemple.",
        }).description).toContain(FR_INSTANTANEMENT)
    })
})
