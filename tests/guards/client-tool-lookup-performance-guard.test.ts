import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const CLIENT_FILES = [
    "src/core/seo/components/related-tools.tsx",
    "src/components/layout/command-palette.tsx",
    "src/components/layout/tool-groups.ts",
    "src/features/tool-shell/tool-action-bar.tsx",
    "src/components/layout/route-page-chrome.tsx",
    "src/core/analytics/components/route-analytics.tsx",
    "src/core/routing/route-context.ts",
]

describe("client tool lookup performance guard", () => {
    it("keeps client components on the lightweight tool lookup", () => {
        for (const file of CLIENT_FILES) {
            const source = fs.readFileSync(path.join(process.cwd(), file), "utf8")
            expect(source).toContain('@/generated/client-tool-lookup')
            expect(source).not.toContain('@/core/registry/tool-meta"')
            expect(source).not.toContain('@/core/registry/tool-meta\'')
            expect(source).not.toContain('@/core/registry/menu-groups"')
            expect(source).not.toContain('@/core/registry/menu-groups\'')
        }
    })

    it("keeps hub surface components on the server", () => {
        for (const file of ["src/core/seo/components/category-hub.tsx", "src/core/seo/components/menu-group-hub.tsx"]) {
            const source = fs.readFileSync(path.join(process.cwd(), file), "utf8")
            expect(source).not.toContain('"use client"')
            expect(source).not.toContain("useLang()")
        }
    })
})
