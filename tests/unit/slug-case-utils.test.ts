import { describe, expect, it } from "vitest"
import { analyzeSlugQuality, convertCase } from "@/features/tools/slugify-case-converter/utils"

describe("slug-case-utils", () => {
    it("applies Turkish locale for title case", () => {
        const output = convertCase("istanbul izmir", "title", {
            locale: "tr",
            preserveAcronyms: false,
        })
        expect(output).toBe("İstanbul İzmir")
    })

    it("applies German locale uppercasing for constant case", () => {
        const output = convertCase("straße daten", "constant", {
            locale: "de",
            preserveAcronyms: false,
        })
        expect(output).toBe("STRASSE_DATEN")
    })

    it("preserves acronyms in camel case when enabled", () => {
        const preserved = convertCase("open API URL", "camel", {
            locale: "en-US",
            preserveAcronyms: true,
        })
        const flattened = convertCase("open API URL", "camel", {
            locale: "en-US",
            preserveAcronyms: false,
        })

        expect(preserved).toBe("openAPIURL")
        expect(flattened).toBe("openApiUrl")
    })

    it("scores slug quality and flags blocked characters", () => {
        const slug = convertCase("Hello 世界!!!", "slug", {
            locale: "en-US",
            preserveAcronyms: false,
        })
        const analysis = analyzeSlugQuality("Hello 世界!!!", slug)

        expect(slug).toBe("hello-世界")
        expect(analysis.warnings).toContain("blocked_chars")
        expect(analysis.blockedChars).toContain("!")
        expect(analysis.score).toBeLessThan(100)
    })

    it("returns empty slug warning when input is blank", () => {
        const analysis = analyzeSlugQuality("", "")

        expect(analysis.score).toBe(0)
        expect(analysis.warnings).toEqual(["empty_slug"])
        expect(analysis.level).toBe("poor")
    })
})
