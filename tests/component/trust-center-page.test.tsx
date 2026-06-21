import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import TrustCenterPage from "@/app/[lang]/trust-center/page"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { TOOL_REGISTRY } from "@/core/registry"

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
        expect(screen.getByText(/External-request responses are network-only/i)).toBeInTheDocument()
        expect(screen.getByText(/clear cached app files from the install page/i)).toBeInTheDocument()

        const externalTools = TOOL_REGISTRY.filter((tool) => tool.privacy.externalRequest.required)
        const toolCopy = getTranslation("en").tools as Record<string, { title?: string }>
        const table = screen.getByRole("table")

        for (const tool of externalTools) {
            const title = toolCopy[tool.key]?.title ?? tool.slug
            expect(within(table).getByRole("link", { name: title })).toHaveAttribute("href", `/en/${tool.slug}`)
            for (const domain of tool.privacy.externalRequest.domains ?? []) {
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
