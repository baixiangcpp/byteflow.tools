import { describe, expect, it } from "vitest"
import { NO_MATCH_RULE, parseRobotsTxt, testRobotsUrl } from "@/features/tools/robots-txt-tester/utils"

describe("robots.txt utils", () => {
    it("prefers the longest matching directive instead of the first broad allow", () => {
        const rules = parseRobotsTxt(`
User-agent: *
Allow: /
Disallow: /admin/
        `)

        expect(testRobotsUrl(rules, "Bingbot", "/admin/dashboard")).toEqual({
            allowed: false,
            matchedAgent: "*",
            matchedRule: "Disallow: /admin/",
        })
    })

    it("prefers allow when allow and disallow have the same specificity", () => {
        const rules = parseRobotsTxt(`
User-agent: *
Disallow: /private$
Allow: /private$
        `)

        expect(testRobotsUrl(rules, "Googlebot", "/private")).toEqual({
            allowed: true,
            matchedAgent: "*",
            matchedRule: "Allow: /private$",
        })
    })

    it("uses agent-specific groups before wildcard groups", () => {
        const rules = parseRobotsTxt(`
User-agent: *
Disallow: /api/

User-agent: Googlebot
Allow: /api/public/
Disallow: /api/
        `)

        expect(testRobotsUrl(rules, "Googlebot", "/api/public/docs")).toEqual({
            allowed: true,
            matchedAgent: "Googlebot",
            matchedRule: "Allow: /api/public/",
        })
    })

    it("returns the default-allowed sentinel when nothing matches", () => {
        const rules = parseRobotsTxt(`
User-agent: *
Disallow: /admin/
        `)

        expect(testRobotsUrl(rules, "Googlebot", "/docs")).toEqual({
            allowed: true,
            matchedAgent: "Googlebot",
            matchedRule: NO_MATCH_RULE,
        })
    })
})
