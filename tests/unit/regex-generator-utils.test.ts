import { describe, expect, it } from "vitest"
import { buildRegexGeneratorResult, getRegexPresetSample } from "@/features/tools/regex-generator/utils"

describe("regex generator utils", () => {
    it("builds anchored static preset patterns", () => {
        const result = buildRegexGeneratorResult({ preset: "email", anchored: true, global: true })
        expect(result.pattern).toBe("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
        expect(result.flags).toBe("g")
    })

    it("builds variable-length patterns", () => {
        const result = buildRegexGeneratorResult({
            preset: "alphanumeric",
            minLength: 4,
            maxLength: 12,
            anchored: true,
            global: false,
        })

        expect(result.pattern).toBe("^[A-Za-z0-9]{4,12}$")
        expect(result.flags).toBe("")
        expect(result.literal).toBe("/^[A-Za-z0-9]{4,12}$/")
    })

    it("sanitizes custom char class and exposes sample text", () => {
        const result = buildRegexGeneratorResult({
            preset: "custom",
            customCharClass: "[A-F0-9]",
            minLength: 2,
            maxLength: 2,
            anchored: false,
            caseInsensitive: true,
            global: true,
        })

        expect(result.pattern).toBe("[A-F0-9]{2}")
        expect(result.flags).toBe("gi")
        expect(getRegexPresetSample("custom")).toContain("abc_123")
    })
})
