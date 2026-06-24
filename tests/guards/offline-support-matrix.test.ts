import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("BF-032 offline support matrix", () => {
    it("keeps the offline support matrix linked from install and rendered in Trust Center", () => {
        const installPage = read("src/app/[lang]/install-app/page.tsx")
        const installClient = read("src/features/install-app/components/install-app-client.tsx")
        const trustCenter = read("src/app/[lang]/trust-center/page.tsx")

        expect(installPage).toContain("trust_center_offline_matrix_install_desc")
        expect(installClient).toContain("/trust-center#offline-support-matrix")
        expect(trustCenter).toContain('id="offline-support-matrix"')
        expect(trustCenter).toContain("trust_center_offline_matrix_local_type")
        expect(trustCenter).toContain("trust_center_offline_matrix_file_type")
        expect(trustCenter).toContain("trust_center_offline_matrix_pipeline_type")
        expect(trustCenter).toContain("trust_center_offline_matrix_external_type")
    })

    it("keeps localized matrix copy complete for every supported locale", () => {
        const requiredPageKeys = [
            "trust_center_offline_matrix_title",
            "trust_center_offline_matrix_desc",
            "trust_center_offline_matrix_install_desc",
            "trust_center_offline_matrix_link",
            "trust_center_offline_matrix_col_type",
            "trust_center_offline_matrix_col_behavior",
            "trust_center_offline_matrix_col_cache",
            "trust_center_offline_matrix_local_type",
            "trust_center_offline_matrix_file_type",
            "trust_center_offline_matrix_pipeline_type",
            "trust_center_offline_matrix_external_type",
        ]

        for (const locale of LOCALES) {
            const pages = getTranslation(locale).pages as Record<string, string>
            for (const key of requiredPageKeys) {
                expect(pages[key], `${locale}.${key}`).toBeTruthy()
            }
        }
    })

    it("keeps external-request media actions guarded by offline messaging", () => {
        const helper = read("src/features/tool-shell/external-request-offline.ts")
        const files = [
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/vimeo-thumbnail-grabber/page.tsx",
            "src/features/tools/instagram-photo-downloader/page.tsx",
        ]

        expect(helper).toContain("navigator.onLine === false")
        for (const file of files) {
            const source = read(file)
            expect(source, file).toContain("isBrowserOffline()")
            expect(source, file).toContain("external_network_notice.offline_required")
        }
    })
})
