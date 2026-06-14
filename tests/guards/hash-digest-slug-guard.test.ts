import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const DISALLOWED = [
    "md5-encrypt-decrypt",
    "sha1-encrypt-decrypt",
    "sha224-encrypt-decrypt",
    "sha256-encrypt-decrypt",
    "sha384-encrypt-decrypt",
    "sha512-encrypt-decrypt",
]

const REQUIRED = [
    "md5-digest-generator",
    "sha1-digest-generator",
    "sha224-digest-generator",
    "sha256-digest-generator",
    "sha384-digest-generator",
    "sha512-digest-generator",
]

describe("hash digest slug guard", () => {
    it("keeps focused hash routes on digest-generator slugs", () => {
        const appLangDir = path.join(process.cwd(), "src/app/[lang]")
        const routeDirs = fs.readdirSync(appLangDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)

        for (const slug of DISALLOWED) {
            expect(routeDirs).not.toContain(slug)
        }

        for (const slug of REQUIRED) {
            expect(routeDirs).toContain(slug)
        }
    })

    it("keeps route-group and metadata sources free of old encrypt-decrypt digest slugs", () => {
        const files = [
            "src/lib/sitemap-route-groups.json",
            "src/lib/ia-stability-baseline.json",
            "src/lib/localized-meta-copy.ts",
            "src/lib/localized-articles.ts",
            "src/app/[lang]/hash-generator/page.tsx",
            "src/app/[lang]/hash-functions-compared-md5-vs-sha256-vs-sha512/page.tsx",
        ]

        for (const file of files) {
            const source = fs.readFileSync(path.join(process.cwd(), file), "utf8")
            for (const slug of DISALLOWED) {
                expect(source).not.toContain(slug)
            }
        }
    })
})
