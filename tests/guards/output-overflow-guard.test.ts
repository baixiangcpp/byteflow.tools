import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("output overflow guard", () => {
    it("keeps long text and code outputs on shared wrap/scroll controls", () => {
        expect(read("src/features/tool-shell/text-output-panel.tsx")).toContain("data-output-overflow-mode")
        expect(read("src/features/tool-shell/text-output-panel.tsx")).toContain("OutputWrapModeControl")

        const sharedPanelTools = [
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/curl-to-code/page.tsx",
            "src/features/tools/url-parser/page.tsx",
            "src/features/tools/open-graph-meta-generator/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/vimeo-thumbnail-grabber/page.tsx",
            "src/features/tools/instagram-photo-downloader/page.tsx",
        ]

        for (const file of sharedPanelTools) {
            expect(read(file), file).toContain("TextOutputPanel")
        }

        const monacoWrapTools = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/text-diff-checker/page.tsx",
            "src/features/tools/json-diff-viewer/page.tsx",
        ]

        for (const file of monacoWrapTools) {
            const source = read(file)
            expect(source, file).toMatch(/OutputWrapModeControl|JsonOutputToolbar/)
            expect(source, file).toContain('wordWrap: ')
            expect(source, file).toContain('"off"')
        }

        const headerDiff = read("src/features/tools/header-diff/page.tsx")
        expect(headerDiff).toContain("OutputWrapModeControl")
        expect(headerDiff).toContain("whitespace-pre")
    })
})
