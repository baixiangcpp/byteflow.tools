import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import CsvDiffPage from "@/app/[lang]/csv-diff/page"
import OpenApiMockPage from "@/app/[lang]/openapi-mock/page"
import { LangProvider } from "@/core/i18n/lang-provider"
import { countNonEmptyLines, formatByteLimit, isOverUtf8Budget, TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"
import { getTranslation } from "@/core/i18n/translations/catalog"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/csv-diff",
}))

function renderWithEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

describe("phase 6 quality governance", () => {
    it("measures local input budgets without fully scanning after the limit", () => {
        expect(formatByteLimit(1024 * 1024)).toBe("1 MB")
        expect(isOverUtf8Budget("A".repeat(20), 10)).toBe(true)
        expect(countNonEmptyLines("a\n\nb\nc", 2)).toEqual({ lines: 3, exceeded: true })
    })

    it("shows a CSV Diff budget error instead of parsing oversized input", () => {
        renderWithEnglish(<CsvDiffPage />)

        const [left] = screen.getAllByRole("textbox")
        fireEvent.change(left, { target: { value: "A".repeat(TOOL_RUNTIME_BUDGETS.maxDiffInputBytes + 1) } })

        expect(screen.getByText(/Input is too large for local processing/i)).toBeInTheDocument()
    })

    it("shows an OpenAPI Mock budget error before JSON parsing oversized input", () => {
        renderWithEnglish(<OpenApiMockPage />)

        fireEvent.change(screen.getByRole("textbox"), {
            target: { value: "A".repeat(TOOL_RUNTIME_BUDGETS.maxOpenApiSpecBytes + 1) },
        })

        expect(screen.getByText(/Input is too large for local processing/i)).toBeInTheDocument()
    })
})

