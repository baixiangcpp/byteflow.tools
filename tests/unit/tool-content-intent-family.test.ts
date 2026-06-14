import { describe, expect, it } from "vitest"
import { resolveFallbackIntentFamily } from "@/core/seo/components/tool-content-template-modules/intent-family"

describe("resolveFallbackIntentFamily", () => {
    it("classifies formatter-like tools", () => {
        expect(resolveFallbackIntentFamily("json_formatter", "json-formatter", "formatters")).toBe("formatter")
        expect(resolveFallbackIntentFamily("css_minifier", "css-minifier", "formatters")).toBe("formatter")
    })

    it("classifies generator-like tools", () => {
        expect(resolveFallbackIntentFamily("qr_code_generator", "qr-code-generator", "generators")).toBe("generator")
        expect(resolveFallbackIntentFamily("lorem_ipsum", "lorem-ipsum", "generators")).toBe("generator")
    })

    it("classifies converter-like tools", () => {
        expect(resolveFallbackIntentFamily("csv_json_converter", "csv-json-converter", "formatters")).toBe("converter")
        expect(resolveFallbackIntentFamily("base64_encode_decode", "base64-encode-decode", "formatters")).toBe("converter")
    })

    it("classifies analyzer-like tools", () => {
        expect(resolveFallbackIntentFamily("security_header_analyzer", "security-header-analyzer", "network-web")).toBe("analyzer")
        expect(resolveFallbackIntentFamily("text_diff_checker", "text-diff-checker", "text-string")).toBe("analyzer")
    })
})
