import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import TrustCenterPage from "@/app/[lang]/trust-center/page"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { TOOL_REGISTRY } from "@/core/registry"
import { getExternalRequestToolDisclosures } from "@/core/registry/privacy"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

describe("TrustCenterPage", () => {
    it("renders DevTools verification steps and a manifest-generated external request table", async () => {
        const page = await TrustCenterPage({ params: Promise.resolve({ lang: "en" }) })
        render(page)

        expect(screen.getByRole("heading", { name: "Privacy and Trust Center", level: 1 })).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "Verify local processing in DevTools" })).toBeInTheDocument()
        expect(screen.getByText("Open the tool page, then open DevTools and select the Network panel.")).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "In-app verification mode" })).toBeInTheDocument()
        expect(screen.getByText(/It is an aid only; use browser DevTools and source review/i)).toBeInTheDocument()
        expect(screen.getAllByText(/External-request responses are network-only/i).length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText(/clear cached app files from the install page/i)).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "Offline support matrix" })).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Offline matrix" })).toHaveAttribute("href", "#offline-support-matrix")
        expect(screen.getByRole("link", { name: "Local data controls" })).toHaveAttribute("href", "/en/privacy#local-data-controls")
        expect(screen.getByRole("rowheader", { name: "Browser-local tools" })).toBeInTheDocument()
        expect(screen.getByRole("rowheader", { name: "File-based tools" })).toBeInTheDocument()
        expect(screen.getByRole("rowheader", { name: "Pipeline Builder" })).toBeInTheDocument()
        expect(screen.getByRole("rowheader", { name: "External-request tools" })).toBeInTheDocument()

        const externalTools = getExternalRequestToolDisclosures(TOOL_REGISTRY)
        const toolCopy = getTranslation("en").tools as Record<string, { title?: string }>
        const table = screen.getByRole("table", { name: "External request tools" })

        for (const { tool, hosts } of externalTools) {
            const title = toolCopy[tool.key]?.title ?? tool.slug
            expect(within(table).getByRole("link", { name: title })).toHaveAttribute("href", `/en/${tool.slug}`)
            for (const domain of hosts) {
                expect(within(table).getByText(new RegExp(domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument()
            }
        }
    })

    it("emits WebPage, BreadcrumbList, and FAQPage JSON-LD", async () => {
        const page = await TrustCenterPage({ params: Promise.resolve({ lang: "en" }) })
        const { container } = render(page)

        const script = container.querySelector('script[data-jsonld="trust-center"]')
        expect(script).not.toBeNull()

        const jsonLd = JSON.parse(script?.textContent ?? "{}")
        const graphTypes = new Set(jsonLd["@graph"].map((node: { "@type": string }) => node["@type"]))

        expect(graphTypes).toContain("WebPage")
        expect(graphTypes).toContain("BreadcrumbList")
        expect(graphTypes).toContain("FAQPage")
    })
})
