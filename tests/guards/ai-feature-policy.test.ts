import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("AI feature policy", () => {
    it("documents local-first and external AI boundaries before new AI-assisted tools are added", () => {
        const policy = read("docs/privacy/ai-feature-policy.md")

        expect(policy).toContain("browser-local by default")
        expect(policy).toContain("New remote AI tools are not approved")
        expect(policy).toContain("Never send tool input")
        expect(policy).toContain("must be treated as an external request")
        expect(policy).toContain("destination domain, purpose, data sent")
        expect(policy).toContain("Responses must not be cached by default")
    })

    it("keeps the existing AI-adjacent palette tool browser-local and network-free", () => {
        const manifests = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))
        const tool = manifests.get("ai_color_palette_generator")
        const source = read("src/features/tools/ai-color-palette-generator/page.tsx")

        expect(tool?.privacy.executionMode).toBe("browser-local")
        expect(tool?.privacy.offlineCapable).toBe(true)
        expect(tool?.privacy.externalRequest.required).toBe(false)
        expect(source).not.toContain("fetch(")
        expect(source).not.toContain("openai")
        expect(source).not.toContain("apiKey")
    })
})
