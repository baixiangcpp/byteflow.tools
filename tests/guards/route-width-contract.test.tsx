import fs from "node:fs"
import path from "node:path"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
    CatalogPageContainer,
    StaticPageContainer,
    ToolPageContainer,
    WideToolPageContainer,
} from "@/components/layout/page-container"
import {
    REPRESENTATIVE_ROUTE_CONTAINER_INTENTS,
    getRouteContainerIntent,
} from "@/components/layout/route-container-contract"

type WidthInventory = {
    summary: {
        toolSurfaces: number
        standardTools: number
        wideTools: number
    }
    toolSurfaces: Array<{
        slug: string
        intent: "tool" | "wide-tool"
        roots: string[]
    }>
    centeredMaxWidthExceptions: Array<{
        file: string
        reason: string
        maxWidthTokens: string[]
    }>
}

function read(relativePath: string) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

const INVENTORY = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "src/generated/route-width-inventory.json"), "utf8"),
) as WidthInventory

describe("route width contracts", () => {
    it("declares representative standard, wide, static, and catalog route intents", () => {
        expect(REPRESENTATIVE_ROUTE_CONTAINER_INTENTS).toEqual(expect.objectContaining({
            "all-tools": "catalog",
            "install-app": "static",
            "json-formatter": "wide-tool",
            "pipeline-builder": "wide-tool",
            "qr-code-generator": "tool",
            support: "static",
        }))
        expect(getRouteContainerIntent({ routeType: "hub", slug: "data-code-formats" })).toBe("catalog")
        expect(getRouteContainerIntent({ routeType: "content", slug: "about" })).toBe("static")
    })

    it("emits stable data contracts for page boundary assertions", () => {
        const { container } = render(
            <>
                <ToolPageContainer>tool</ToolPageContainer>
                <WideToolPageContainer>wide</WideToolPageContainer>
                <StaticPageContainer>static</StaticPageContainer>
                <CatalogPageContainer>catalog</CatalogPageContainer>
            </>,
        )

        expect([...container.querySelectorAll("[data-page-container]")].map((node) => (
            [node.getAttribute("data-page-container"), node.getAttribute("data-route-container-intent")]
        ))).toEqual([
            ["tool", "tool"],
            ["wide-tool", "wide-tool"],
            ["static", "static"],
            ["catalog", "catalog"],
        ])
    })

    it("keeps every generated tool surface on its declared primitive", () => {
        expect(INVENTORY.summary.toolSurfaces).toBe(INVENTORY.toolSurfaces.length)
        expect(INVENTORY.summary.standardTools + INVENTORY.summary.wideTools).toBe(INVENTORY.toolSurfaces.length)
        expect(INVENTORY.toolSurfaces.every((surface) => surface.roots.length === 1)).toBe(true)
        for (const surface of INVENTORY.toolSurfaces) {
            expect(surface.roots).toEqual([
                surface.intent === "wide-tool" ? "WideToolPageContainer" : "ToolPageContainer",
            ])
        }
    })

    it("keeps centered max-width exceptions explicit and centrally allowlisted", () => {
        expect(INVENTORY.centeredMaxWidthExceptions.length).toBeGreaterThan(0)
        expect(INVENTORY.centeredMaxWidthExceptions.every((entry) => (
            entry.reason.length > 0 && entry.maxWidthTokens.length > 0
        ))).toBe(true)

        const generator = read("scripts/generators/generate-route-width-inventory.js")
        expect(generator).toContain("CENTERED_MAX_WIDTH_ALLOWLIST")
        expect(generator).toContain("centered ${token} wrapper is not explicitly allowlisted")
        expect(generator).toContain("must import ${expectedElement} from @/components/layout/page-container without aliasing")
    })

    it("does not nest route viewports or page containers in shared route surfaces", () => {
        for (const routeSurface of ["src/app/[lang]/error.tsx", "src/app/[lang]/loading.tsx"]) {
            expect(read(routeSurface)).not.toContain("RouteViewportContainer")
        }
        expect(read("src/app/[lang]/error.tsx")).not.toContain("StaticPageContainer")
        expect(read("src/features/tool-templates/single-hash-tool-page.tsx")).not.toContain("ToolPageContainer")
        expect(read("src/features/tool-templates/html-css-beautifier-tool.tsx")).not.toContain("WideToolPageContainer")
    })

    it("requires representative route chrome and related tools to align in browser checks", () => {
        const matrix = read("scripts/e2e/run-route-width-matrix.js")
        expect(matrix).toContain('requiredChromeParts: ["intent", "tool-meta", "install"]')
        expect(matrix).toContain("requireRelatedTools: true")
        expect(matrix).toContain("is missing required ${part} route chrome")
        expect(matrix).toContain("assertAligned(relatedBox, shellBox")
    })
})
