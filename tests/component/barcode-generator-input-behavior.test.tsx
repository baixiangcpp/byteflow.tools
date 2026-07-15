import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { BarcodeGeneratorPage } from "@/features/tools/barcode-generator/page"

vi.mock("jsbarcode", () => ({ default: vi.fn() }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("next/navigation", () => ({ usePathname: () => "/en/barcode-generator" }))
vi.mock("@/core/seo/components/related-tools", () => ({ RelatedTools: () => null }))

function renderPage() {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            <BarcodeGeneratorPage />
        </LangProvider>,
    )
}

describe("BarcodeGeneratorPage input behavior", () => {
    it("starts empty and keeps samples, clear, reset, and format changes explicit", () => {
        renderPage()
        const input = screen.getByRole("textbox", { name: "Input" }) as HTMLInputElement

        expect(input).toHaveValue("")
        expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled()

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))
        expect(input).toHaveValue("BYTEFLOW-2026")

        fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        expect(input).toHaveValue("")

        fireEvent.change(input, { target: { value: "custom-value" } })
        fireEvent.click(screen.getByRole("button", { name: "EAN13" }))
        expect(input).toHaveValue("custom-value")

        fireEvent.click(screen.getByRole("button", { name: "Reset" }))
        expect(input).toHaveValue("")
    })
})
