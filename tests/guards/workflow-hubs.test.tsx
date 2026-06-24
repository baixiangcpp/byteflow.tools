import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { MENU_GROUP_DEFS, getMenuGroupByKey } from "@/core/registry/menu-groups"
import { TOOL_REGISTRY } from "@/core/registry"
import { MenuGroupHub } from "@/core/seo/components/menu-group-hub"
import { WorkflowDetailPage, WorkflowIndexPage } from "@/core/seo/components/workflow-pages"
import {
    WORKFLOW_DEFINITIONS,
    WORKFLOW_ROUTE_SLUGS,
    getWorkflowsForToolKey,
} from "@/core/workflows/workflow-hubs"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

function parseJsonLdScripts(container: HTMLElement) {
    return Array.from(container.querySelectorAll("script[type=\"application/ld+json\"]"))
        .map((script) => JSON.parse(script.textContent || "{}") as Record<string, unknown>)
}

function collectTypes(value: unknown, out = new Set<string>()) {
    if (Array.isArray(value)) {
        for (const item of value) collectTypes(item, out)
        return out
    }

    if (!value || typeof value !== "object") return out

    const record = value as Record<string, unknown>
    const type = record["@type"]
    if (typeof type === "string") out.add(type)
    if (Array.isArray(type)) {
        for (const item of type) {
            if (typeof item === "string") out.add(item)
        }
    }

    for (const child of Object.values(record)) collectTypes(child, out)
    return out
}

describe("BF-027 workflow hubs", () => {
    it("defines five workflow pages with valid tools, tutorials, and route slugs", () => {
        expect(WORKFLOW_DEFINITIONS).toHaveLength(5)
        expect(WORKFLOW_ROUTE_SLUGS).toEqual([
            "workflows/api-payload-cleanup",
            "workflows/security-token-review",
            "workflows/log-scrub-before-sharing",
            "workflows/image-resize-social-export",
            "workflows/json-typescript-contract-review",
        ])

        const toolKeys = new Set(TOOL_REGISTRY.map((tool) => tool.key))
        for (const workflow of WORKFLOW_DEFINITIONS) {
            expect(workflow.relatedToolKeys.length).toBeGreaterThanOrEqual(3)
            expect(workflow.steps.length).toBeGreaterThanOrEqual(4)
            expect(workflow.tutorialSlugs.length).toBeGreaterThanOrEqual(3)
            expect(workflow.faqs.length).toBeGreaterThanOrEqual(3)
            for (const toolKey of workflow.relatedToolKeys) {
                expect(toolKeys.has(toolKey), `${workflow.slug}:${toolKey}`).toBe(true)
            }
            for (const locale of LOCALES) {
                const copy = workflow.localized?.[locale] ?? { title: workflow.title, description: workflow.description }
                expect(copy.title.trim()).not.toBe("")
                expect(copy.description.trim()).not.toBe("")
            }
        }
    })

    it("renders the workflow index and detail pages with CollectionPage, HowTo, and BreadcrumbList JSON-LD", () => {
        const index = render(<WorkflowIndexPage lang="en" />)
        expect(screen.getByRole("heading", { name: "Developer Workflow Hubs" })).toBeInTheDocument()
        expect(index.container.querySelector('a[href="/en/workflows/api-payload-cleanup"]')).not.toBeNull()
        expect([...collectTypes(parseJsonLdScripts(index.container))]).toEqual(expect.arrayContaining(["CollectionPage", "ItemList", "ListItem", "BreadcrumbList"]))
        index.unmount()

        const detail = render(<WorkflowDetailPage lang="en" workflowSlug="api-payload-cleanup" />)
        expect(screen.getByRole("heading", { name: "API payload cleanup" })).toBeInTheDocument()
        expect(detail.container.querySelector('a[href="/en/json-formatter"]')).not.toBeNull()
        expect(detail.container.querySelector('a[href="/en/validate-json-before-api-requests"]')).not.toBeNull()

        const types = collectTypes(parseJsonLdScripts(detail.container))
        expect([...types]).toEqual(expect.arrayContaining(["HowTo", "HowToStep", "BreadcrumbList"]))
    })

    it("enriches all eight primary category hubs with tasks, workflows, tutorials, and FAQ", () => {
        for (const group of MENU_GROUP_DEFS) {
            const menuGroup = getMenuGroupByKey(group.key)
            expect(menuGroup).toBeTruthy()
            const { container, unmount } = render(<MenuGroupHub lang="en" groupKey={group.key} />)
            const types = collectTypes(parseJsonLdScripts(container))

            expect([...types]).toEqual(expect.arrayContaining(["CollectionPage", "ItemList", "ListItem"]))
            expect(container.textContent).toContain("Topic cluster")
            expect(container.textContent).toContain("Common tasks")
            expect(container.textContent).toContain("Related workflows")
            expect(container.textContent).toContain("Tutorials and checklists")
            expect(container.textContent).toContain("Category FAQ")
            expect(container.querySelectorAll('a[href^="/en/workflows/"]').length).toBeGreaterThan(0)
            expect(container.querySelectorAll('a[href^="/en/"]').length).toBeGreaterThan(menuGroup?.items.length ?? 0)

            unmount()
        }
    })

    it("maps workflow pages back to referenced tool pages", () => {
        expect(getWorkflowsForToolKey("json_formatter").map((workflow) => workflow.slug)).toEqual([
            "api-payload-cleanup",
            "json-typescript-contract-review",
        ])
        expect(getWorkflowsForToolKey("jwt_decoder").map((workflow) => workflow.slug)).toEqual([
            "security-token-review",
        ])
        expect(getWorkflowsForToolKey("image_resizer").map((workflow) => workflow.slug)).toEqual([
            "image-resize-social-export",
        ])
    })
})
