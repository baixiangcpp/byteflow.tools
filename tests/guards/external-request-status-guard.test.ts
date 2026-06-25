import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("external request status guard", () => {
    it("keeps media external-request tools on the shared status component and explicit request boundary", () => {
        const component = read("src/features/tool-shell/external-request-status.tsx")
        expect(component).toContain("data-external-request-status")
        expect(component).toContain("next_step_label")
        expect(component).toContain("consent_required_message")

        const mediaTools = [
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/vimeo-thumbnail-grabber/page.tsx",
            "src/features/tools/instagram-photo-downloader/page.tsx",
        ]

        for (const file of mediaTools) {
            const source = read(file)
            expect(source, file).toContain("ExternalRequestStatus")
            expect(source, file).toContain("ExternalRequestConfirmation")
            expect(source, file).toContain("isBrowserOffline")
            expect(source, file).toContain("useBrowserOnlineStatus")
            expect(source, file).toContain("next_step_reconnect")
            expect(source, file).toContain("notifyToolActionFailure")
        }
    })
})
