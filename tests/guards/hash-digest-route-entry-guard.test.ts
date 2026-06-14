import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const DIGEST_ROUTE_FILES = [
    "src/app/[lang]/md5-digest-generator/page.tsx",
    "src/app/[lang]/sha1-digest-generator/page.tsx",
    "src/app/[lang]/sha224-digest-generator/page.tsx",
    "src/app/[lang]/sha256-digest-generator/page.tsx",
    "src/app/[lang]/sha384-digest-generator/page.tsx",
    "src/app/[lang]/sha512-digest-generator/page.tsx",
]

describe("hash digest route entry guards", () => {
    it("keeps focused digest pages as server wrappers", () => {
        for (const file of DIGEST_ROUTE_FILES) {
            const source = fs.readFileSync(path.join(process.cwd(), file), "utf8")

            expect(source).not.toContain('"use client"')
            expect(source).not.toContain("useLang()")
            expect(source).toContain("params: Promise<{ lang: string }>")
            expect(source).toContain("isValidLocale(lang)")
            expect(source).toContain("notFound()")
        }
    })
})
