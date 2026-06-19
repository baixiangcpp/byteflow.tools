import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("root page locale redirect guard", () => {
    it("preserves query strings and hashes when redirecting to the detected locale", () => {
        const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8")
        const runtimeSource = fs.readFileSync(path.join(process.cwd(), "public/runtime/root-locale-redirect.js"), "utf8")

        expect(pageSource).toContain('import Script from "next/script"')
        expect(pageSource).toContain('<Script src="/runtime/root-locale-redirect.js" strategy="beforeInteractive" />')
        expect(runtimeSource).toContain('window.location.search || ""')
        expect(runtimeSource).toContain('window.location.hash || ""')
        expect(runtimeSource).toContain('search.indexOf("handoff=") >= 0')
        expect(runtimeSource).toContain('search.indexOf("handoff_ref=") >= 0')
        expect(runtimeSource).toContain('if (raw === "zh" || raw.indexOf("zh-") === 0) return "zh-CN";')
        expect(runtimeSource).toContain('window.location.replace("/" + lang + search + hash);')
    })
})
