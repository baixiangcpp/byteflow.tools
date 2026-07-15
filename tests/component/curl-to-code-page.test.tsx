import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { CurlToCodePage } from "@/features/tools/curl-to-code/page"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/curl-to-code",
}))

vi.mock("@/core/seo/components/related-tools", () => ({
    RelatedTools: () => null,
}))

vi.mock("@/features/tool-shell/tool-action-feedback", () => ({
    copyTextWithToolFeedback: vi.fn(),
}))

function renderPage() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <CurlToCodePage />
        </LangProvider>,
    )
}

describe("CurlToCodePage", () => {
    it("renders the complete sample JSON body without a diagnostic", () => {
        renderPage()

        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
        expect(screen.getByLabelText("Output")).toHaveTextContent('"enabled": true')
        expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled()
    })

    it("shows unsupported syntax diagnostics and disables copy", () => {
        renderPage()

        fireEvent.change(screen.getByPlaceholderText("curl -X GET https://api.example.com"), {
            target: { value: "curl https://api.example.com --compressed" },
        })

        const alert = screen.getByRole("alert")
        expect(alert).toHaveTextContent("Unsupported cURL option \"--compressed\"")
        expect(alert).toHaveTextContent("Character 30")
        expect(screen.getByRole("button", { name: /Copy/ })).toBeDisabled()
    })

    it("shows a warning while generating deterministic duplicate-header output", () => {
        renderPage()

        fireEvent.change(screen.getByPlaceholderText("curl -X GET https://api.example.com"), {
            target: {
                value: "curl https://api.example.com -H 'X-Test: first' -H 'x-test: second'",
            },
        })

        expect(screen.getByRole("status")).toHaveTextContent("Header \"x-test\" is repeated")
        expect(screen.getByLabelText("Output")).toHaveTextContent('"x-test": "second"')
        expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled()
    })
})
