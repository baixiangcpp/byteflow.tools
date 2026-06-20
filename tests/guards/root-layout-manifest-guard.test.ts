import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("root layout localized manifest guard", () => {
    it("has a static manifest fallback and updates it during head parsing", () => {
        const layoutSource = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8")
        const runtimeSource = fs.readFileSync(path.join(process.cwd(), "public/runtime/theme-manifest-bootstrap.js"), "utf8")

        expect(layoutSource).toContain('<link rel="manifest" id="app-manifest" href="/manifest.json" />')
        expect(layoutSource).toContain('<Script src="/runtime/theme-manifest-bootstrap.js" strategy="beforeInteractive" />')
        expect(runtimeSource).toContain('var manifestLink = document.getElementById("app-manifest");')
        expect(runtimeSource).toContain("if (!manifestLink) {")
        expect(runtimeSource).toContain('manifestLink = document.createElement("link");')
        expect(runtimeSource).toContain('manifestLink.id = "app-manifest";')
        expect(runtimeSource).toContain('manifestLink.rel = "manifest";')
        expect(runtimeSource).toContain("manifestLink.href = manifestHref;")
        expect(runtimeSource).toContain("currentScript.parentNode.insertBefore(manifestLink, currentScript.nextSibling);")
    })
})
