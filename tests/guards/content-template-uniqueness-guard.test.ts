import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("content template uniqueness gate", () => {
    it("covers the BF-026 sampled core tools and Trust Center handoff", () => {
        const source = read("scripts/gates/check-content-template-uniqueness.js")

        for (const slug of [
            "json-formatter",
            "jwt-decoder",
            "base64-encode-decode",
            "hash-generator",
            "markdown-preview",
            "image-resizer",
        ]) {
            expect(source).toContain(`"${slug}"`)
        }

        expect(source).toContain('href="/en/trust-center"')
        expect(source).toContain("GENERIC_FAQ_QUESTIONS")
        expect(source).toContain("repeated long sentence")
    })

    it("is wired into build post checks with the existing content quality gates", () => {
        const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> }

        expect(packageJson.scripts["check:content-template:uniqueness"]).toBe(
            "node scripts/gates/check-content-template-uniqueness.js",
        )
        expect(packageJson.scripts["build:post"]).toContain("npm run check:content-template:uniqueness")
        expect(packageJson.scripts["build:post"]).toContain("npm run check:faq-schema")
    })
})
