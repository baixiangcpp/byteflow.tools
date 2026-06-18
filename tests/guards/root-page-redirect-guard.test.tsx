import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import RootPage from "@/app/page"

describe("root page locale redirect guard", () => {
    it("preserves query strings and hashes when redirecting to the detected locale", () => {
        const html = renderToStaticMarkup(<RootPage />)

        expect(html).toContain("window.location.search || ''")
        expect(html).toContain("window.location.hash || ''")
        expect(html).toContain("search.indexOf('handoff=') >= 0")
        expect(html).toContain("search.indexOf('handoff_ref=') >= 0")
        expect(html).toContain("else if (raw === 'zh' || raw.indexOf('zh-') === 0) lang = 'zh-CN';")
        expect(html).toContain("var target = '/' + lang + suffix;")
        expect(html).toContain("window.location.replace(target);")
    })
})
