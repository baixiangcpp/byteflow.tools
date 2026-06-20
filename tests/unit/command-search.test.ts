import { describe, expect, it } from "vitest"
import { scoreCommandSearch, scoreToolSearch, type ToolSearchDocument } from "@/core/search/command-search"

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
})
