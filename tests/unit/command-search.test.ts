import { describe, expect, it } from "vitest"
import { scoreCommandSearch } from "@/core/search/command-search"

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
})
