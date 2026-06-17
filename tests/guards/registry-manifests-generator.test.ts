import { describe, expect, it } from "vitest"
import { buildRegistryManifestSource } from "../../scripts/generators/generate-registry-manifests.js"

describe("registry manifests generator", () => {
    it("generates the checked-in runtime manifest aggregator from tool order", () => {
        const source = buildRegistryManifestSource()

        expect(source).toContain('import { toolManifest as jsonFormatterManifest } from "@/features/tools/json-formatter/manifest"')
        expect(source).toContain('import { toolManifest as unicodeInspectorManifest } from "@/features/tools/unicode-inspector/manifest"')
        expect(source).toContain("export const TOOL_MANIFESTS = [")
        expect(source).toContain("    jsonFormatterManifest,")
        expect(source).toContain("    unicodeInspectorManifest,")
        expect(source).toContain("] satisfies ToolMeta[]")
    })
})
