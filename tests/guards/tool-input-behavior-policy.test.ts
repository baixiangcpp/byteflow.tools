import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const TOOLS_ROOT = path.join(process.cwd(), "src/features/tools")
const SAMPLE_STATE_INITIALIZER = /(?:React\.)?useState(?:<[^>]+>)?\(\s*((?:SAMPLE|[A-Z0-9_]*SAMPLE|DEFAULT_[A-Z0-9_]*(?:INPUT|TEXT|VALUE))[\w.]*)\s*\)/g

function sampleSeededPages() {
    return fs.readdirSync(TOOLS_ROOT, { withFileTypes: true }).flatMap((entry) => {
        if (!entry.isDirectory()) return []
        const pagePath = path.join(TOOLS_ROOT, entry.name, "page.tsx")
        if (!fs.existsSync(pagePath)) return []
        const source = fs.readFileSync(pagePath, "utf8")
        const initializers = Array.from(source.matchAll(SAMPLE_STATE_INITIALIZER), (match) => match[1])
        return initializers.length > 0 ? [{ slug: entry.name, initializers }] : []
    })
}

function initializerIsEmpty(slug: string, initializer: string) {
    const escaped = initializer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const emptyDeclaration = new RegExp(`(?:export\\s+)?const\\s+${escaped}\\s*=\\s*(["'])\\1`)
    const toolDir = path.join(TOOLS_ROOT, slug)
    return fs.readdirSync(toolDir, { withFileTypes: true }).some((entry) => {
        if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) return false
        return emptyDeclaration.test(fs.readFileSync(path.join(toolDir, entry.name), "utf8"))
    })
}

describe("tool input ownership policy", () => {
    it("requires every sample-seeded editable page to declare explicit-sample behavior", () => {
        const manifests = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.slug, tool]))
        const offenders = sampleSeededPages().flatMap(({ slug, initializers }) => {
            const behavior = manifests.get(slug)?.inputBehavior
            return behavior === "explicit-sample" || behavior === "generator-default"
                ? []
                : behavior === "empty-first" && initializers.every((initializer) => initializerIsEmpty(slug, initializer))
                    ? []
                    : [`${slug}: ${initializers.join(", ")} (${behavior || "unclassified"})`]
        })

        expect(offenders).toEqual([])
    })

    it("keeps representative transformation tools empty-first and tester samples explicit", () => {
        const manifests = new Map((TOOL_MANIFESTS as readonly ToolMeta[]).map((tool) => [tool.key, tool]))

        for (const key of ["qr_code_generator", "base64_encode_decode", "json_formatter", "csv_json_converter", "jwt_decoder"]) {
            expect(manifests.get(key)?.inputBehavior, key).toBe("empty-first")
        }
        expect(manifests.get("regex_tester")?.inputBehavior).toBe("explicit-sample")
    })
})
