import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { getInstallPageCopy } from "@/core/utils/install-app-copy"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("issue #260 PWA install, offline state, cache, and update UX", () => {
    it("distinguishes the required browser and platform install guides", () => {
        const requiredGuideKeys = ["chrome_desktop", "safari_desktop", "edge", "firefox", "android", "ios"]

        for (const locale of LOCALES) {
            const copy = getInstallPageCopy(locale)
            expect(Object.keys(copy.guides).sort(), locale).toEqual([...requiredGuideKeys].sort())
            expect(copy.guides.chrome_desktop.label).toContain("Chrome")
            expect(copy.guides.safari_desktop.label).toContain("Safari")
            expect(copy.guides.edge.label).toContain("Edge")
            expect(copy.guides.firefox.label).toContain("Firefox")
            expect(copy.guides.android.label).toContain("Android")
            expect(copy.guides.ios.label).toContain("iOS")
            expect(copy.manualHint).toBeTruthy()
        }
    })

    it("keeps cache clearing reachable from Install App and Local Data Controls", () => {
        const installClient = read("src/features/install-app/components/install-app-client.tsx")
        const privacyTest = read("tests/component/privacy-page.test.tsx")

        expect(installClient).toContain("clearByteflowPwaCaches")
        expect(installClient).toContain("clearCachedAppButton")
        expect(installClient).toContain("/privacy#local-data-controls")
        expect(privacyTest).toContain("Clear cached app files")
        expect(privacyTest).toContain("/en/install-app")
    })

    it("keeps offline state visible and explains the local versus external-request boundary", () => {
        const appRuntime = read("src/components/layout/app-runtime.tsx")
        const offlineHelper = read("src/features/tool-shell/external-request-offline.ts")
        const youtubeTool = read("src/features/tools/youtube-thumbnail-grabber/page.tsx")

        expect(appRuntime).toContain('window.addEventListener("offline"')
        expect(appRuntime).toContain('window.addEventListener("online"')
        expect(appRuntime).toContain("offline_banner_title")
        expect(appRuntime).toContain("/trust-center#offline-support-matrix")
        expect(offlineHelper).toContain("navigator.onLine === false")
        expect(youtubeTool).toContain("offline_required")
    })

    it("keeps localized offline banner copy complete", () => {
        for (const locale of LOCALES) {
            const common = getTranslation(locale).common as unknown as Record<string, string>
            expect(common.offline_banner_title, `${locale}.offline_banner_title`).toBeTruthy()
            expect(common.offline_banner_message, `${locale}.offline_banner_message`).toBeTruthy()
            expect(common.offline_banner_action, `${locale}.offline_banner_action`).toBeTruthy()
        }
    })

    it("keeps update activation user-triggered so tool input is not discarded silently", () => {
        const appRuntime = read("src/components/layout/app-runtime.tsx")

        expect(appRuntime).toContain("toast(t.common.update_available")
        expect(appRuntime).toContain("registration.waiting?.postMessage({ type: \"SKIP_WAITING\" })")
        expect(appRuntime).toContain('navigator.serviceWorker.addEventListener("controllerchange"')
        expect(appRuntime).toContain("window.location.reload()")
    })

    it("keeps the remaining real-device PWA closure checklist documented", () => {
        const runbook = read("docs/accessibility/audit-23-25-26-manual-closure-runbook.md")

        expect(runbook).toContain("Issue #260")
        expect(runbook).toContain("Chrome Desktop")
        expect(runbook).toContain("Microsoft Edge")
        expect(runbook).toContain("Android Chrome")
        expect(runbook).toContain("iOS Safari")
        expect(runbook).toContain("Add to Home Screen")
        expect(runbook).toContain("Clear cached app files")
        expect(runbook).toContain("Update behavior")
        expect(runbook).toContain("Do not close #260, #262, or #263 from automation alone")
    })
})
