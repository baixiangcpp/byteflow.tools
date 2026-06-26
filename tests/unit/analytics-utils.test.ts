import { beforeEach, describe, expect, it } from "vitest"
import { buildAnalyticsPayload, detectInteractionAnalyticsAction, getAnalyticsPreference, isAnalyticsOptedOut, setAnalyticsOptOut, shouldTrackAnalyticsEvent } from "@/core/analytics/analytics"

function installMemoryStorage() {
    const store = new Map<string, string>()
    Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
            setItem: (key: string, value: string) => {
                store.set(key, value)
            },
            removeItem: (key: string) => {
                store.delete(key)
            },
        },
    })
}

describe("analytics interaction detection", () => {
    beforeEach(() => {
        installMemoryStorage()
    })

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

    it("drops parameters that are not allowed for an event", () => {
        expect(buildAnalyticsPayload("search_performed", {
            language: "en",
            results_count: 4,
            query_length_bucket: "medium",
            tool_id: "json_formatter",
        })).toEqual({
            language: "en",
            results_count: 4,
            query_length_bucket: "medium",
        })
    })

    it("stores a local opt-out preference and blocks future provider dispatch", () => {
        expect(getAnalyticsPreference()).toBe("default")
        expect(isAnalyticsOptedOut()).toBe(false)
        expect(shouldTrackAnalyticsEvent(true, false)).toBe(true)

        setAnalyticsOptOut(true)

        expect(getAnalyticsPreference()).toBe("opted_out")
        expect(isAnalyticsOptedOut()).toBe(true)
        expect(shouldTrackAnalyticsEvent(true, true)).toBe(false)

        setAnalyticsOptOut(false)

        expect(getAnalyticsPreference()).toBe("default")
        expect(isAnalyticsOptedOut()).toBe(false)
    })
})
