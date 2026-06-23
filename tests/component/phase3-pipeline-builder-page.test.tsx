import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import PipelineBuilderPage from "@/app/[lang]/pipeline-builder/page"
import { getTranslation } from "@/core/i18n/translations/catalog"
import type { Locale } from "@/core/i18n/i18n"
import { PipelineStepList } from "@/features/tools/pipeline-builder/pipeline-step-list"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/pipeline-builder",
}))

function installMemoryStorage() {
    const store = new Map<string, string>()
    Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
            setItem: (key: string, value: string) => {
                store.set(key, value)
            },
            removeItem: (key: string) => {
                store.delete(key)
            },
        },
    })
}

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
    beforeEach(() => {
        installMemoryStorage()
    })

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
        expect(screen.getByRole("heading", { name: "Build a recipe in three moves" })).toBeInTheDocument()
        expect(screen.getByLabelText("Initial input")).toBeInTheDocument()
        expect(screen.getByText("Steps")).toBeInTheDocument()
        expect(screen.getByText("Built-in recipes")).toBeInTheDocument()
        expect(screen.getByText("API payload cleanup")).toBeInTheDocument()
        expect(screen.getByText("Security token review")).toBeInTheDocument()
        expect(screen.getByText("Log scrub before sharing")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Run Recipe/i })).toBeInTheDocument()
        expect(screen.getAllByRole("button", { name: /Export JSON/i }).length).toBeGreaterThan(0)
        expect(screen.getByRole("button", { name: /Share URL/i })).toBeInTheDocument()
    })

    it("persists only onboarding dismissal preference data", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: "Dismiss onboarding" }))

        expect(screen.queryByRole("heading", { name: "Build a recipe in three moves" })).not.toBeInTheDocument()
        expect(window.localStorage.getItem("byteflow:pipeline-builder:onboarding-dismissed")).toBe("1")
        expect(JSON.stringify(window.localStorage)).not.toContain("Initial input")
    })

    it("can add a pipeline step from the adapter list", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Add/i }))

        expect(screen.getAllByText(/JSON Formatter/i).length).toBeGreaterThan(0)
        expect(screen.getByText("Selected step")).toBeInTheDocument()
        expect(screen.getByText("Step options")).toBeInTheDocument()
    })

    it("shows recipe safety settings and adjacent compatibility hints", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        const adapterSelect = screen.getByLabelText("Select tool adapter")
        fireEvent.change(adapterSelect, { target: { value: "base64_encode_decode" } })
        fireEvent.click(screen.getByRole("button", { name: /Add/i }))
        fireEvent.change(adapterSelect, { target: { value: "json_formatter" } })
        fireEvent.click(screen.getByRole("button", { name: /Add/i }))

        expect(screen.getByRole("heading", { name: "Recipe settings" })).toBeInTheDocument()
        expect(screen.getByRole("switch", { name: "Stop on error" })).toBeChecked()
        expect(screen.getByText("Check handoff: text output into json input.")).toBeInTheDocument()
        expect(screen.getByText(/Constant step input is used only for the current run/i)).toBeInTheDocument()
        expect(screen.getByText("text input -> text output")).toBeInTheDocument()
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
        expect(screen.getByText("Minify JSON moved to position 2 of 2.")).toBeInTheDocument()
        expect(container.querySelectorAll("[draggable='true']").length).toBeGreaterThan(0)
        expect(screen.getAllByLabelText("Drag to reorder step").length).toBeGreaterThan(0)

        const removeButtons = screen.getAllByRole("button", { name: "Remove step" })
        fireEvent.click(removeButtons[0])

        expect(screen.getByLabelText("Step label")).toHaveValue("Minify JSON")
        expect(screen.queryByText(/Base64 URL-safe encode/i)).not.toBeInTheDocument()
    })

    it("shows privacy preview before export and confirms structure-only scope", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Try Example/i }))
        fireEvent.click(screen.getAllByRole("button", { name: /^Export JSON$/i })[0])

        expect(screen.getByRole("heading", { name: "Privacy preview" })).toBeInTheDocument()
        expect(screen.getByText("Export a structure-only JSON recipe file.")).toBeInTheDocument()
        expect(screen.getByText("Initial runtime input")).toBeInTheDocument()
        expect(screen.getByText("Final output and intermediate step outputs")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Export structure only" })).toBeInTheDocument()
    })

    it("loads and runs a built-in recipe template", async () => {
        renderWithEnglish(<PipelineBuilderPage />)

        const useTemplateButtons = screen.getAllByRole("button", { name: "Use" })
        fireEvent.click(useTemplateButtons[1])

        expect(screen.getByLabelText("Recipe name")).toHaveValue("URL JSON cleanup")
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

    it("loads the security token review template without putting the sample JWT into recipe JSON", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        const useTemplateButtons = screen.getAllByRole("button", { name: "Use" })
        fireEvent.click(useTemplateButtons[2])

        expect(screen.getByLabelText("Recipe name")).toHaveValue("Security token review")
        expect(screen.getByLabelText("Initial input")).toHaveValue()
        expect((screen.getByLabelText("Initial input") as HTMLTextAreaElement).value).toContain("signature-placeholder")
        expect(screen.getByLabelText("Step label")).toHaveValue("Decode JWT payload")
        expect(screen.getByText("text input -> json output")).toBeInTheDocument()
    })

    it("shows a per-step warning for external-request pipeline adapters", () => {
        render(
            <PipelineStepList
                adapterOptions={[{
                    externalRequestRequired: true,
                    inputKind: "url",
                    outputKind: "json",
                    title: "External Lookup",
                    toolKey: "external_lookup",
                }]}
                compatibilityHints={[]}
                maxSteps={12}
                onAddStep={() => undefined}
                onMoveStep={() => undefined}
                onPendingToolKeyChange={() => undefined}
                onReorderStep={() => undefined}
                onRemoveStep={() => undefined}
                onSelectStep={() => undefined}
                pendingToolKey="external_lookup"
                selectedStepId="lookup"
                steps={[{
                    adapterVersion: 1,
                    id: "lookup",
                    inputMode: "previous_output",
                    options: {},
                    toolKey: "external_lookup",
                }]}
                text={(key) => ({
                    add_step: "Add",
                    adapter_select: "Select tool adapter",
                    external_request_step_notice: "External request step: confirm the network target before running.",
                    move_down: "Move step down",
                    move_up: "Move step up",
                    no_steps: "No steps",
                    remove_step: "Remove step",
                    step_io_hint: "{input} input -> {output} output",
                    steps_title: "Steps",
                }[key] ?? key)}
            />,
        )

        expect(screen.getByText("url input -> json output")).toBeInTheDocument()
        expect(screen.getByText("External request step: confirm the network target before running.")).toBeInTheDocument()
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
