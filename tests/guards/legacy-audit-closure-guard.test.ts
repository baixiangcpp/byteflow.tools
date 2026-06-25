import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("legacy audit closure guard", () => {
    it("keeps the old image, sitemap, regex, workflow, and All Tools audit items covered by enforceable tests", () => {
        const imageSafety = read("tests/component/bf-025-bf-031-image-file-safety.test.tsx")
        const fileSafety = read("tests/guards/file-input-safety-guard.test.ts")
        const heavyWorkers = read("tests/guards/bf-heavy-worker-safeguards.test.ts")
        const sitemapAudit = read("tests/guards/sitemap-audit.test.ts")
        const sitemap = read("tests/guards/sitemap.test.ts")
        const regexActions = read("tests/component/bf-016-tool-action-semantics.test.tsx")
        const workflowHubs = read("tests/guards/workflow-hubs.test.tsx")
        const allTools = read("tests/component/all-tools-discovery.test.tsx")

        expect(imageSafety).toContain("File is too large. Max supported size is 12 MB.")
        expect(imageSafety).toContain("Image is too large for local processing. Max supported resolution is 24 MP.")
        expect(fileSafety).toContain("requires every file input to declare an accept policy")
        expect(heavyWorkers).toContain("keeps shared upload status announced with accessible progress")
        expect(sitemapAudit).toContain("parameterized URL")
        expect(sitemapAudit).toContain("legacy taxonomy URL")
        expect(sitemap).toContain("excludes noindex legacy taxonomy hubs from sitemap output")
        expect(regexActions).toContain("keeps Regex Tester Sample and Clear deterministic")
        expect(workflowHubs).toContain("Open in Pipeline Builder")
        expect(workflowHubs).toContain("Structure-only template; no runtime input in the URL.")
        expect(allTools).toContain("keeps a 300-tool inventory within default and filtered render budgets")
        expect(allTools).toContain("offers privacy-safe request and voting links from empty search results")
    })

    it("keeps planning, mobile locale/theme, pricing, and representative keyboard audit coverage discoverable", () => {
        const layoutComponents = read("tests/component/layout-components.test.tsx")
        const publicPlanning = read("tests/guards/public-planning-docs.test.ts")
        const pricing = read("tests/guards/pricing-positioning.test.ts")
        const a11y = read("tests/guards/shared-a11y-surfaces.test.ts")
        const installApp = read("tests/component/install-app-page.test.tsx")
        const smoke = read("scripts/e2e/run-playwright-smoke.js")

        expect(layoutComponents).toContain("exposes language and theme controls inside the mobile navigation sheet")
        expect(publicPlanning).toContain("Extension and desktop research")
        expect(publicPlanning).toContain("Vote on launcher demand")
        expect(publicPlanning).toContain("issues/new?template=feature_request.yml")
        expect(pricing).toContain("self_hosting_title")
        expect(pricing).toContain("pricing_internal_deployment_cta")
        expect(pricing).toContain("no server-side tool payload processing")
        expect(a11y).toContain("keeps the shared tool action bar named and described")
        expect(smoke).toContain("assertHeaderKeyboardPaths")
        expect(smoke).toContain("assertMobileNavigationKeyboardPath")
        expect(smoke).toContain("assertMobileAllTools")
        expect(installApp).toContain("Extension and desktop research")
    })
})
