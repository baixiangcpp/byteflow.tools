import { describe, expect, it } from "vitest"
import { detectInteractionAnalyticsAction } from "@/core/analytics/analytics"

describe("analytics interaction detection", () => {
    it("detects copy interactions across localized labels", () => {
        expect(detectInteractionAnalyticsAction("Copy output")).toBe("copy_output")
        expect(detectInteractionAnalyticsAction("复制输出")).toBe("copy_output")
        expect(detectInteractionAnalyticsAction("出力をコピー")).toBe("copy_output")
    })

    it("detects download interactions across localized labels and download-only buttons", () => {
        expect(detectInteractionAnalyticsAction("Download report")).toBe("download_output")
        expect(detectInteractionAnalyticsAction("Télécharger HTML")).toBe("download_output")
        expect(detectInteractionAnalyticsAction("下载 PNG")).toBe("download_output")
        expect(detectInteractionAnalyticsAction("Save file", { hasDownloadAttribute: true })).toBe("download_output")
        expect(detectInteractionAnalyticsAction("PNG")).toBe("download_output")
    })

    it("ignores unrelated signals", () => {
        expect(detectInteractionAnalyticsAction("Run tool")).toBeNull()
        expect(detectInteractionAnalyticsAction("")).toBeNull()
    })
})
