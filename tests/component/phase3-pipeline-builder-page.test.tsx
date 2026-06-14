import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import PipelineBuilderPage from "@/app/[lang]/pipeline-builder/page"
import { getTranslation } from "@/core/i18n/translations/catalog"
import type { Locale } from "@/core/i18n/i18n"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/pipeline-builder",
}))

function renderWithEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

function renderWithLocale(locale: Locale, ui: React.ReactNode) {
    return render(
        <LangProvider lang={locale} translations={getTranslation(locale)}>
            {ui}
        </LangProvider>,
    )
}

describe("phase 3 pipeline builder page", () => {
    it.each([
        ["en", "Pipeline Builder"],
        ["zh-CN", "管道构建器"],
        ["zh-TW", "管道建構器"],
        ["ja", "パイプラインビルダー"],
        ["ko", "파이프라인 빌더"],
        ["de", "Pipeline-Ersteller"],
        ["fr", "Constructeur de pipeline"],
    ] satisfies Array<[Locale, string]>)("renders the localized page title for %s", (locale, title) => {
        renderWithLocale(locale, <PipelineBuilderPage />)

        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
    })

    it("renders recipe builder controls", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        expect(screen.getByRole("heading", { name: "Pipeline Builder" })).toBeInTheDocument()
        expect(screen.getByLabelText("Initial input")).toBeInTheDocument()
        expect(screen.getByText("Steps")).toBeInTheDocument()
        expect(screen.getByText("Built-in recipes")).toBeInTheDocument()
        expect(screen.getByText("URL decode and pretty-print JSON")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Run Recipe/i })).toBeInTheDocument()
        expect(screen.getAllByRole("button", { name: /Export JSON/i }).length).toBeGreaterThan(0)
        expect(screen.getByRole("button", { name: /Share URL/i })).toBeInTheDocument()
    })

    it("can add a pipeline step from the adapter list", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Add/i }))

        expect(screen.getAllByText(/JSON Formatter/i).length).toBeGreaterThan(0)
        expect(screen.getByText("Selected step")).toBeInTheDocument()
        expect(screen.getByText("Step options")).toBeInTheDocument()
    })

    it("renders without IndexedDB and keeps non-storage actions available", async () => {
        const originalDescriptor = Object.getOwnPropertyDescriptor(window, "indexedDB")
        Object.defineProperty(window, "indexedDB", { configurable: true, value: undefined })

        try {
            renderWithEnglish(<PipelineBuilderPage />)

            await waitFor(() => {
                expect(screen.getByText(/IndexedDB is unavailable/i)).toBeInTheDocument()
            })

            expect(screen.getByRole("button", { name: /^Save$/i })).toBeDisabled()
            expect(screen.getByLabelText("Select saved recipe")).toBeDisabled()
            expect(screen.getByRole("button", { name: /^Share URL$/i })).not.toBeDisabled()
            expect(screen.getAllByRole("button", { name: /^Export JSON$/i })[0]).not.toBeDisabled()

            fireEvent.click(screen.getByRole("button", { name: /Try Example/i }))

            expect(screen.getByRole("button", { name: /Run Recipe/i })).not.toBeDisabled()
        } finally {
            if (originalDescriptor) {
                Object.defineProperty(window, "indexedDB", originalDescriptor)
            } else {
                Reflect.deleteProperty(window, "indexedDB")
            }
        }
    })

    it("uses standalone step action buttons without changing the selected step", () => {
        const { container } = renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Try Example/i }))

        expect(container.querySelectorAll("button button")).toHaveLength(0)
        expect(container.querySelectorAll('[role="button"]')).toHaveLength(0)
        expect(screen.getByLabelText("Step label")).toHaveValue("Minify JSON")

        const enabledMoveDown = screen
            .getAllByRole("button", { name: "Move step down" })
            .find((button) => !button.hasAttribute("disabled"))
        expect(enabledMoveDown).toBeDefined()
        fireEvent.click(enabledMoveDown!)

        expect(screen.getByLabelText("Step label")).toHaveValue("Minify JSON")

        const removeButtons = screen.getAllByRole("button", { name: "Remove step" })
        fireEvent.click(removeButtons[0])

        expect(screen.getByLabelText("Step label")).toHaveValue("Minify JSON")
        expect(screen.queryByText(/Base64 URL-safe encode/i)).not.toBeInTheDocument()
    })

    it("loads and runs a built-in recipe template", async () => {
        renderWithEnglish(<PipelineBuilderPage />)

        const useTemplateButtons = screen.getAllByRole("button", { name: "Use" })
        fireEvent.click(useTemplateButtons[1])

        expect(screen.getByLabelText("Recipe name")).toHaveValue("URL decode and pretty-print JSON")
        expect(screen.getByLabelText("Initial input")).toHaveValue("%7B%22user%22%3A%22alice%40example.com%22%2C%22active%22%3Atrue%7D")
        expect(screen.getByLabelText("Step label")).toHaveValue("URL component decode")

        fireEvent.click(screen.getByRole("button", { name: /Run Recipe/i }))

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Run the recipe to generate output...")).toHaveValue(`{
  "user": "alice@example.com",
  "active": true
}`)
        })
        expect(screen.getByText("Recipe is valid for the linear MVP executor.")).toBeInTheDocument()
    })

    it("imports a valid recipe JSON file", async () => {
        const { container } = renderWithEnglish(<PipelineBuilderPage />)
        const importedRecipe = {
            schemaVersion: 1,
            id: "recipe_imported",
            name: "Imported QA Recipe",
            description: "Imported from a JSON file",
            createdAt: "2026-06-11T00:00:00.000Z",
            updatedAt: "2026-06-11T00:00:00.000Z",
            steps: [
                {
                    id: "step_json",
                    toolKey: "json_formatter",
                    label: "Pretty JSON",
                    adapterVersion: 1,
                    inputMode: "previous_output",
                    options: { mode: "pretty", indent: 2 },
                },
            ],
            edges: [],
            settings: {
                stopOnError: true,
                keepIntermediateOutputs: true,
                maxInputBytes: 2097152,
                maxOutputBytes: 2097152,
                maxSteps: 12,
            },
        }
        const file = new File([JSON.stringify(importedRecipe)], "recipe.json", { type: "application/json" })
        Object.defineProperty(file, "text", {
            value: async () => JSON.stringify(importedRecipe),
        })
        const input = container.querySelector('input[type="file"]')

        expect(input).toBeInstanceOf(HTMLInputElement)
        fireEvent.change(input!, { target: { files: [file] } })

        await waitFor(() => {
            expect(screen.getByLabelText("Recipe name")).toHaveValue("Imported QA Recipe")
        })
        expect(screen.getByLabelText("Description")).toHaveValue("Imported from a JSON file")
        expect(screen.getByLabelText("Step label")).toHaveValue("Pretty JSON")
        expect(screen.queryByText(/Recipe JSON is invalid/i)).not.toBeInTheDocument()
    })
})
