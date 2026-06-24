import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("external request confirmation guard", () => {
    it("keeps media external actions gated by the shared confirmation component", () => {
        const component = read("src/features/tool-shell/external-request-confirmation.tsx")
        const files = [
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/vimeo-thumbnail-grabber/page.tsx",
            "src/features/tools/instagram-photo-downloader/page.tsx",
        ]

        expect(component).toContain("confirm_title")
        expect(component).toContain("hosts.join")
        expect(component).toContain("confirm_checkbox")
        for (const file of files) {
            const source = read(file)
            expect(source, file).toContain("ExternalRequestConfirmation")
            expect(source, file).toContain("externalRequestConfirmed")
            expect(source, file).toContain("confirm_required")
        }
    })
})
