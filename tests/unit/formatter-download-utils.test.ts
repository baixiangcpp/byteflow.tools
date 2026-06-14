import { describe, expect, it } from "vitest"
import { buildFormatterDownloadConfig } from "@/core/files/formatter-download-utils"

describe("formatter-download-utils", () => {
    it("builds HTML download config for formatted output", () => {
        const config = buildFormatterDownloadConfig({
            mode: "html",
            lastAction: "format",
            content: "<div>hello</div>",
        })

        expect(config).toEqual({
            filename: "markup.formatted.html",
            mimeType: "text/html;charset=utf-8",
            content: "<div>hello</div>",
        })
    })

    it("builds CSS download config for minified output", () => {
        const config = buildFormatterDownloadConfig({
            mode: "css",
            lastAction: "minify",
            content: "body{color:red}",
        })

        expect(config).toEqual({
            filename: "style.min.css",
            mimeType: "text/css;charset=utf-8",
            content: "body{color:red}",
        })
    })

    it("returns null when content is empty", () => {
        const config = buildFormatterDownloadConfig({
            mode: "html",
            lastAction: "format",
            content: "",
        })

        expect(config).toBeNull()
    })
})
