import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("root layout localized manifest guard", () => {
    it("has a static manifest fallback and updates it during head parsing", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8")

        expect(source).toContain('<link rel="manifest" id="app-manifest" href="/manifest.json" />')
        expect(source).toContain("var manifestLink = document.getElementById('app-manifest');")
        expect(source).toContain("if (!manifestLink) {")
        expect(source).toContain("manifestLink = document.createElement('link');")
        expect(source).toContain("manifestLink.id = 'app-manifest';")
        expect(source).toContain("manifestLink.rel = 'manifest';")
        expect(source).toContain("manifestLink.href = manifestHref;")
        expect(source).toContain("currentScript.parentNode.insertBefore(manifestLink, currentScript.nextSibling);")
    })
})
