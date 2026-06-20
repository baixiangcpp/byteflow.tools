import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const CLIENT_LOOKUP_BOUNDARIES = [
    {
        file: "src/core/seo/components/related-tools.tsx",
        importPath: "@/generated/discovery-tool-index",
    },
    {
        file: "src/components/layout/command-palette.tsx",
        importPath: "@/generated/command-search-index",
    },
    {
        file: "src/components/layout/tool-groups.ts",
        importPath: "@/generated/discovery-tool-index",
    },
    {
        file: "src/features/tool-shell/tool-action-bar.tsx",
        importPath: "@/generated/route-tool-lookup",
    },
    {
        file: "src/features/tool-shell/tool-privacy-footer.tsx",
        importPath: "@/generated/route-tool-lookup",
    },
    {
        file: "src/features/tool-shell/tool-trust-header.tsx",
        importPath: "@/core/registry/types",
    },
    {
        file: "src/components/layout/route-page-chrome.tsx",
        importPath: "@/generated/route-tool-lookup",
    },
    {
        file: "src/core/analytics/components/route-analytics.tsx",
        importPath: "@/generated/route-tool-lookup",
    },
    {
        file: "src/core/routing/route-context.ts",
        importPath: "@/generated/route-tool-lookup",
    },
]

describe("client tool lookup performance guard", () => {
    it("keeps client components on the smallest generated lookup boundary they need", () => {
        for (const { file, importPath } of CLIENT_LOOKUP_BOUNDARIES) {
            const source = fs.readFileSync(path.join(process.cwd(), file), "utf8")
            expect(source).toContain(importPath)
            expect(source).not.toContain('@/generated/client-tool-lookup')
            expect(source).not.toContain('@/core/registry/tool-meta"')
            expect(source).not.toContain('@/core/registry/tool-meta\'')
            expect(source).not.toContain('@/core/registry/menu-groups"')
            expect(source).not.toContain('@/core/registry/menu-groups\'')
        }
    })

    it("keeps generated lookup outputs split by route, command search, and discovery needs", () => {
        const generatorSource = fs.readFileSync(path.join(process.cwd(), "scripts/generators/generate-client-tool-lookup.js"), "utf8")
        const expectedGeneratedFiles = [
            "src/generated/client-tool-lookup.ts",
            "src/generated/route-tool-lookup.ts",
            "src/generated/command-search-index.ts",
            "src/generated/discovery-tool-index.ts",
        ]

        for (const file of expectedGeneratedFiles) {
            expect(fs.existsSync(path.join(process.cwd(), file)), file).toBe(true)
        }

        expect(generatorSource).toContain("ROUTE_OUTPUT_PATH")
        expect(generatorSource).toContain("COMMAND_SEARCH_OUTPUT_PATH")
        expect(generatorSource).toContain("DISCOVERY_OUTPUT_PATH")
        expect(generatorSource).toContain("buildRouteLookupSource")
        expect(generatorSource).toContain("buildCommandSearchIndexSource")
        expect(generatorSource).toContain("buildDiscoveryToolIndexSource")
    })

    it("keeps hub surface components on the server", () => {
        for (const file of ["src/core/seo/components/category-hub.tsx", "src/core/seo/components/menu-group-hub.tsx"]) {
            const source = fs.readFileSync(path.join(process.cwd(), file), "utf8")
            expect(source).not.toContain('"use client"')
            expect(source).not.toContain("useLang()")
        }
    })
})
