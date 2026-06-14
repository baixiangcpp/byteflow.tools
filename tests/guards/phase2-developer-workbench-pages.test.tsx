import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import HarViewerSanitizerPage from "@/app/[lang]/har-viewer-sanitizer/page"
import StructuredDataVisualizerPage from "@/app/[lang]/structured-data-visualizer/page"
import YqPlaygroundPage from "@/app/[lang]/yq-playground/page"
import { getTranslation } from "@/core/i18n/translations/catalog"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/yq-playground",
}))

function renderWithEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

describe("phase 2 developer workbench pages", () => {
    it("renders yq playground query controls", () => {
        renderWithEnglish(<YqPlaygroundPage />)

        expect(screen.getByRole("heading", { name: "yq Playground" })).toBeInTheDocument()
        expect(screen.getByText("Query")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Paste YAML or JSON to query locally...")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Run query/i })).toBeInTheDocument()
    })

    it("renders structured data visualizer controls", () => {
        renderWithEnglish(<StructuredDataVisualizerPage />)

        expect(screen.getByRole("heading", { name: "Structured Data Visualizer" })).toBeInTheDocument()
        expect(screen.getByText("Format")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Paste JSON, YAML, or XML...")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Visualize/i })).toBeInTheDocument()
    })

    it("renders structured data truncation warning for large inputs", () => {
        renderWithEnglish(<StructuredDataVisualizerPage />)

        fireEvent.change(screen.getByPlaceholderText("Paste JSON, YAML, or XML..."), {
            target: { value: JSON.stringify(Array.from({ length: 5010 }, (_, index) => index)) },
        })
        fireEvent.click(screen.getByRole("button", { name: /Visualize/i }))

        expect(screen.getByText(/Tree truncated for performance/i)).toBeInTheDocument()
    })

    it("renders HAR viewer sanitizer controls", () => {
        renderWithEnglish(<HarViewerSanitizerPage />)

        expect(screen.getByRole("heading", { name: "HAR Viewer / Sanitizer" })).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Paste a HAR JSON export...")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Parse HAR/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Sanitize/i })).toBeInTheDocument()
    })
})
