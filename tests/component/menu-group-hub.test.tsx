import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MenuGroupHub } from "@/core/seo/components/menu-group-hub"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

describe("menu group hub", () => {
    it("renders richer text-content hub sections with featured workflow links", () => {
        render(<MenuGroupHub lang="en" groupKey="text_content" />)

        expect(screen.getByRole("heading", { name: "Popular text workflows" })).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "Suggested review flow" })).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "Text workflow FAQ" })).toBeInTheDocument()

        const workflowLink = screen.getByText("Count words and characters").closest("a")
        expect(workflowLink).toHaveAttribute("href", "/en/letter-counter")
    })

    it("does not render text-content-specific SEO sections for other hub groups", () => {
        render(<MenuGroupHub lang="en" groupKey="web_api" />)

        expect(screen.queryByRole("heading", { name: "Popular text workflows" })).not.toBeInTheDocument()
        expect(screen.queryByRole("heading", { name: "Text workflow FAQ" })).not.toBeInTheDocument()
    })
})
