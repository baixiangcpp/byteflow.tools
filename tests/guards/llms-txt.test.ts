import fs from "node:fs"
import { describe, expect, it } from "vitest"

describe("llms.txt", () => {
    it("is generated from source metadata with catalog, privacy, and trust links", () => {
        const content = fs.readFileSync("public/llms.txt", "utf8")

        expect(content).toContain("# byteflow.tools")
        expect(content).toContain("## Representative Tool Catalog")
        expect(content).toContain("JSON Formatter: https://byteflow.tools/en/json-formatter")
        expect(content).toContain("Trust Center: https://byteflow.tools/en/trust-center")
        expect(content).toContain("Security reporting: https://byteflow.tools/.well-known/security.txt")
        expect(content).toContain("External-request tools require explicit user action")
        expect(content.length).toBeLessThan(30_000)
    })
})
