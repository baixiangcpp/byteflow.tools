import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { JsonLdScript, serializeJsonLd } from "@/core/seo/components/json-ld-script"

describe("JsonLdScript", () => {
    it("escapes script-breaking HTML while preserving valid JSON and unicode", () => {
        const serialized = serializeJsonLd({
            name: "</script><img src=x onerror=alert(1)>",
            text: "你好",
        })

        expect(serialized).toContain("\\u003c/script>")
        expect(serialized).toContain("\\u003cimg")
        expect(serialized).not.toContain("</script>")
        expect(JSON.parse(serialized)).toEqual({
            name: "</script><img src=x onerror=alert(1)>",
            text: "你好",
        })
    })

    it("renders application/ld+json scripts with passthrough attributes", () => {
        const html = renderToStaticMarkup(
            <JsonLdScript data-faq-schema="tool" jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage" }} />,
        )

        expect(html).toContain('type="application/ld+json"')
        expect(html).toContain('data-faq-schema="tool"')
        expect(html).toContain('"@type":"FAQPage"')
    })
})
