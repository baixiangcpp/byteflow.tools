import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("issue #7 Next bundled PostCSS advisory runbook", () => {
    it("keeps stable remediation evidence and closure criteria documented", () => {
        const doc = read("docs/security/next-postcss-advisory-runbook.md")
        const packageJson = read("package.json")

        expect(doc).toContain("issue #7")
        expect(doc).toContain("GHSA-qx2v-qp2m-jg93")
        expect(doc).toContain("postcss >= 8.5.10")
        expect(doc).toContain("Checked on 2026-06-27")
        expect(doc).toContain("16.2.9")
        expect(doc).toContain("8.4.31")
        expect(doc).toContain("npm run check:audit:prod-high")
        expect(doc).toContain("npm run test:e2e:pwa")
        expect(doc).toContain("Do not run `npm audit fix --force`")
        expect(packageJson).toContain('"next": "16.2.9"')
        expect(packageJson).toContain('"@next/bundle-analyzer": "16.2.9"')
    })
})
