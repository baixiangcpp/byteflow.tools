import { describe, expect, it } from "vitest"
import { buildPwaManifest, getPwaManifestFilename } from "../../scripts/lib/pwa-manifest-lib.js"

describe("pwa manifest generation", () => {
    it("emits localized shortcut copy and localized start URLs", () => {
        const manifest = buildPwaManifest("zh-CN")

        expect(manifest.lang).toBe("zh-CN")
        expect(manifest.start_url).toBe("/zh-CN?utm_source=pwa")
        expect(manifest.description).toContain("本地运行")
        expect(manifest.shortcuts[0]).toMatchObject({
            name: "JSON 格式化工具",
            url: "/zh-CN/json-formatter",
        })
    })

    it("keeps english manifest on the legacy manifest.json path", () => {
        expect(getPwaManifestFilename("en")).toBe("manifest.json")
        expect(getPwaManifestFilename("ja")).toBe("manifest.ja.json")
    })
})
