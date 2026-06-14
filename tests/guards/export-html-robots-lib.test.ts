import { describe, expect, it } from "vitest"
import { extractRobotsMetaContents, hasDuplicateRobotsMeta, rewriteDuplicateRobotsMeta } from "../../scripts/lib/export-html-robots-lib.js"

describe("export html robots meta helpers", () => {
    it("removes the weaker noindex tag when a stricter noindex,nofollow tag is present", () => {
        const html = [
            "<html><head>",
            '<meta name="robots" content="noindex"/>',
            '<meta name="robots" content="noindex, nofollow"/>',
            "</head><body></body></html>",
        ].join("")

        expect(extractRobotsMetaContents(html)).toEqual(["noindex", "noindex, nofollow"])
        expect(hasDuplicateRobotsMeta(html)).toBe(true)
        expect(rewriteDuplicateRobotsMeta(html)).toContain('<meta name="robots" content="noindex, nofollow"/>')
        expect(rewriteDuplicateRobotsMeta(html)).not.toContain('<meta name="robots" content="noindex"/>')
    })

    it("keeps single robots tags untouched", () => {
        const html = '<html><head><meta name="robots" content="noindex, nofollow"/></head></html>'

        expect(hasDuplicateRobotsMeta(html)).toBe(false)
        expect(rewriteDuplicateRobotsMeta(html)).toBe(html)
    })
})
