import fs from "node:fs"
import path from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import RootPage from "@/app/page"

describe("root page locale redirect guard", () => {
    it("preserves query strings and hashes when redirecting to the detected locale", () => {
        const html = renderToStaticMarkup(<RootPage />)
        const runtimeSource = fs.readFileSync(path.join(process.cwd(), "public/runtime/root-locale-redirect.js"), "utf8")

        expect(html).toContain('<script src="/runtime/root-locale-redirect.js"></script>')
        expect(runtimeSource).toContain('window.location.search || ""')
        expect(runtimeSource).toContain('window.location.hash || ""')
        expect(runtimeSource).toContain('search.indexOf("handoff=") >= 0')
        expect(runtimeSource).toContain('search.indexOf("handoff_ref=") >= 0')
        expect(runtimeSource).toContain('if (raw === "zh" || raw.indexOf("zh-") === 0) return "zh-CN";')
        expect(runtimeSource).toContain('window.location.replace("/" + lang + search + hash);')
    })
})
