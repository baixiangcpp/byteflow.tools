import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { ToolPrivacyFooter } from "@/features/tool-shell/tool-privacy-footer"

const mocks = vi.hoisted(() => ({
    pathname: "/en/json-formatter",
}))

vi.mock("next/navigation", () => ({
    usePathname: () => mocks.pathname,
}))

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

function renderFooter() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <ToolPrivacyFooter />
        </LangProvider>,
    )
}

describe("ToolPrivacyFooter", () => {
    beforeEach(() => {
        mocks.pathname = "/en/json-formatter"
    })

    it("links regular tool pages to their feature source file", () => {
        renderFooter()

        const sourceLink = screen.getByRole("link", { name: "Verify on GitHub" })
        expect(sourceLink).toHaveAttribute(
            "href",
            "https://github.com/baixiangcpp/byteflow.tools/blob/main/src/features/tools/json-formatter/page.tsx",
        )
    })

    it("links route-backed hash tools to their route source file", () => {
        mocks.pathname = "/zh-CN/sha256-digest-generator"

        renderFooter()

        const sourceLink = screen.getByRole("link", { name: "Verify on GitHub" })
        expect(sourceLink).toHaveAttribute(
            "href",
            "https://github.com/baixiangcpp/byteflow.tools/blob/main/src/app/%5Blang%5D/sha256-digest-generator/page.tsx",
        )
    })

    it("does not render on non-tool pages", () => {
        mocks.pathname = "/en/privacy"

        const { container } = renderFooter()

        expect(container).toBeEmptyDOMElement()
    })
})
