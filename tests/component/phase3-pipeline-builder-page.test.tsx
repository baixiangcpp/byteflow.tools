import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import PipelineBuilderPage from "@/app/[lang]/pipeline-builder/page"
import { getTranslation } from "@/core/i18n/translations/catalog"
import type { Locale } from "@/core/i18n/i18n"
import { PipelineStepList } from "@/features/tools/pipeline-builder/pipeline-step-list"

const trackPipelineTemplateOpenedMock = vi.hoisted(() => vi.fn())
const clipboardWriteMock = vi.hoisted(() => vi.fn())
const downloadTextMock = vi.hoisted(() => vi.fn())
const toastSuccessMock = vi.hoisted(() => vi.fn())
const toastErrorMock = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/pipeline-builder",
}))

vi.mock("@/core/analytics/analytics", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/core/analytics/analytics")>()
    return {
        ...actual,
        trackPipelineTemplateOpened: trackPipelineTemplateOpenedMock,
    }
})

vi.mock("@/core/clipboard/clipboard", () => ({
    safeClipboardWrite: (value: string) => clipboardWriteMock(value),
}))

vi.mock("@/features/tools/pipeline-builder/browser-actions", () => ({
    downloadText: (filename: string, content: string, type?: string) => downloadTextMock(filename, content, type),
}))

vi.mock("sonner", () => ({
    toast: {
        error: (...args: unknown[]) => toastErrorMock(...args),
        info: vi.fn(),
        success: (...args: unknown[]) => toastSuccessMock(...args),
    },
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
        trackPipelineTemplateOpenedMock.mockReset()
        clipboardWriteMock.mockReset()
        downloadTextMock.mockReset()
        toastSuccessMock.mockReset()
        toastErrorMock.mockReset()
        clipboardWriteMock.mockResolvedValue({ ok: true, method: "clipboard-api" })
        downloadTextMock.mockReturnValue(undefined)
        installMemoryStorage()
        window.history.replaceState(null, "", "/en/pipeline-builder")
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
        expect(screen.getByRole("toolbar", { name: "Tool actions" })).toBeInTheDocument()
        expect(screen.getByLabelText("Initial input")).toBeInTheDocument()
        expect(screen.getByLabelText("Final output")).toBeInTheDocument()
        expect(screen.getAllByText("Steps").length).toBeGreaterThan(0)
        expect(screen.getByText("Recipe Gallery")).toBeInTheDocument()
        expect(screen.getByLabelText("Search recipe templates")).toBeInTheDocument()
        expect(screen.getByText("API payload cleanup")).toBeInTheDocument()
        expect(screen.getByText("Security token review")).toBeInTheDocument()
        expect(screen.getByText("Log scrub before sharing")).toBeInTheDocument()
        expect(screen.getByText("JSON TypeScript contract review")).toBeInTheDocument()
        expect(screen.getByText("Image social export manifest")).toBeInTheDocument()
        expect(screen.getByText("Step diagnostics")).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "Pipeline Builder usage guide" })).toBeInTheDocument()
        expect(screen.getByText("Recipes run from top to bottom. Previous output is passed into the next step unless a step is set to Constant input.")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Run Recipe/i })).toBeInTheDocument()
        expect(screen.getAllByRole("button", { name: /Export JSON/i }).length).toBeGreaterThan(0)
        expect(screen.getByRole("button", { name: /Share URL/i })).toBeInTheDocument()
    })

    it("shows a top step-management entry point and keyboard target", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        const editSteps = screen.getByRole("link", { name: "Edit steps" })
        const stepsPanel = document.querySelector("#pipeline-steps")

        expect(editSteps).toHaveAttribute("href", "#pipeline-steps")
        expect(screen.getAllByLabelText("Pipeline step count")[0]).toHaveTextContent("0/12 steps")
        expect(stepsPanel).toBeInTheDocument()
        expect(stepsPanel).toHaveAttribute("tabindex", "-1")
        expect(document.querySelector("#pipeline-steps-title")).toHaveTextContent("Steps")
    })

    it("provides compact mobile jumps for steps, input/output, and the inspector", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        const navigation = screen.getByRole("navigation", { name: "Workspace sections" })
        expect(navigation.querySelector('[data-pipeline-jump="steps"]')).toHaveAttribute("href", "#pipeline-steps")
        expect(navigation.querySelector('[data-pipeline-jump="input-output"]')).toHaveAttribute("href", "#pipeline-input-output")
        expect(navigation.querySelector('[data-pipeline-jump="inspector"]')).toHaveAttribute("href", "#pipeline-inspector")
        expect(document.querySelector("#pipeline-input-output")).toHaveAttribute("tabindex", "-1")
        expect(document.querySelector("#pipeline-inspector")).toHaveAttribute("tabindex", "-1")
    })

    it("tracks template opens with safe template metadata only", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getAllByRole("button", { name: "Use" })[0])

        expect(trackPipelineTemplateOpenedMock).toHaveBeenCalledWith({
            templateId: "api_payload_cleanup",
            language: "en",
            sourcePage: "pipeline_gallery",
            action: "handoff",
        })
        expect(JSON.stringify(trackPipelineTemplateOpenedMock.mock.calls)).not.toContain("alice@example.com")
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
        expect(screen.getByRole("link", { name: "Usage guide" })).toHaveAttribute("href", "#pipeline-usage-guide")
        expect(screen.getByText("What validation checks")).toBeInTheDocument()
        expect(screen.getByText("Current step count: 2/12. The limit keeps browser-only runs responsive and prevents oversized intermediate payloads.")).toBeInTheDocument()
        expect(screen.getByText("Tools may repeat in one recipe when each step has a unique ID and valid options.")).toBeInTheDocument()
        expect(screen.getByText("The executor is linear-only: each step receives the previous output unless that step uses Constant input.")).toBeInTheDocument()
        expect(screen.getByText("Input/output type mismatches are shown as warnings beside affected steps; use Constant input or reorder steps when a handoff is not meaningful.")).toBeInTheDocument()
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

            fireEvent.click(screen.getByRole("button", { name: /^Sample$/i }))

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

        fireEvent.click(screen.getByRole("button", { name: /^Sample$/i }))

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
        expect(screen.getAllByRole("button", { name: "Move step up" }).length).toBeGreaterThan(0)
        expect(screen.getAllByRole("button", { name: "Move step down" }).length).toBeGreaterThan(0)

        const removeButtons = screen.getAllByRole("button", { name: "Remove step" })
        fireEvent.click(removeButtons[0])

        expect(screen.getByLabelText("Step label")).toHaveValue("Minify JSON")
        expect(screen.queryByText(/Base64 URL-safe encode/i)).not.toBeInTheDocument()
    })

    it("preserves constant input while running, switching modes, and reordering", async () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Add/i }))
        fireEvent.click(screen.getByRole("button", { name: "Constant input" }))
        fireEvent.change(screen.getByLabelText("Constant input"), { target: { value: "{\"ok\":true}" } })

        expect(screen.getByText(/Constant input stays with this step/i)).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Previous output" }))
        fireEvent.click(screen.getByRole("button", { name: "Constant input" }))

        expect(screen.getByLabelText("Constant input")).toHaveValue("{\"ok\":true}")

        fireEvent.change(screen.getByLabelText("Select tool adapter"), { target: { value: "base64_encode_decode" } })
        fireEvent.click(screen.getByRole("button", { name: /Add/i }))
        fireEvent.click(screen.getByRole("button", { name: /1\. json formatter/i }))

        const enabledMoveDown = screen
            .getAllByRole("button", { name: "Move step down" })
            .find((button) => !button.hasAttribute("disabled"))
        expect(enabledMoveDown).toBeDefined()
        fireEvent.click(enabledMoveDown!)

        expect(screen.getByLabelText("Constant input")).toHaveValue("{\"ok\":true}")

        fireEvent.click(screen.getByRole("button", { name: /Run Recipe/i }))

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Run the recipe to generate output...")).toHaveValue(`{
  "ok": true
}`)
        })
    }, 20_000)

    it("shows privacy preview before export and confirms structure-only scope", () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Add/i }))
        fireEvent.click(screen.getByRole("button", { name: "Constant input" }))
        fireEvent.change(screen.getByLabelText("Constant input"), { target: { value: "{\"ok\":true}" } })
        fireEvent.click(screen.getAllByRole("button", { name: /^Export JSON$/i })[0])

        expect(screen.getByRole("heading", { name: "Privacy preview" })).toBeInTheDocument()
        expect(screen.getByText("Export a structure-only JSON recipe file.")).toBeInTheDocument()
        expect(screen.getByText("Initial runtime input")).toBeInTheDocument()
        expect(screen.getByText("Final output and intermediate step outputs")).toBeInTheDocument()
        expect(screen.getByText("Constant step inputs, tokens, keys, and payloads")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Export structure only" })).toBeInTheDocument()
    }, 10_000)

    it("restores privacy dialog focus for toolbar and inspector actions", async () => {
        renderWithEnglish(<PipelineBuilderPage />)

        const toolbar = screen.getByRole("toolbar", { name: "Tool actions" })
        const toolbarExport = within(toolbar).getByRole("button", { name: "Export JSON" })
        toolbarExport.focus()
        fireEvent.click(toolbarExport)

        const firstDialog = await screen.findByRole("dialog", { name: "Privacy preview" })
        expect(firstDialog).toHaveAccessibleDescription("Export a structure-only JSON recipe file.")
        const firstDialogScope = within(firstDialog)
        const firstConfirm = firstDialogScope.getByRole("button", { name: "Export structure only" })
        const firstFocusable = firstDialogScope.getByRole("button", { name: "Cancel" })
        const lastFocusable = firstDialogScope.getByRole("button", { name: "Close" })
        await waitFor(() => expect(firstConfirm).toHaveFocus())

        lastFocusable.focus()
        fireEvent.keyDown(lastFocusable, { key: "Tab" })
        expect(firstFocusable).toHaveFocus()
        expect(firstDialog.contains(document.activeElement)).toBe(true)

        firstFocusable.focus()
        fireEvent.keyDown(firstFocusable, { key: "Tab", shiftKey: true })
        expect(lastFocusable).toHaveFocus()
        expect(firstDialog.contains(document.activeElement)).toBe(true)

        fireEvent.keyDown(document, { key: "Escape" })

        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Privacy preview" })).not.toBeInTheDocument())
        await waitFor(() => expect(toolbarExport).toHaveFocus())

        fireEvent.click(toolbarExport)
        const cancelDialog = await screen.findByRole("dialog", { name: "Privacy preview" })
        fireEvent.click(within(cancelDialog).getByRole("button", { name: "Cancel" }))

        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Privacy preview" })).not.toBeInTheDocument())
        await waitFor(() => expect(toolbarExport).toHaveFocus())

        const inspector = screen.getByRole("complementary", { name: "Recipe inspector" })
        const inspectorExport = within(inspector).getByRole("button", { name: "Export JSON" })
        inspectorExport.focus()
        fireEvent.click(inspectorExport)

        const secondDialog = await screen.findByRole("dialog", { name: "Privacy preview" })
        const confirm = within(secondDialog).getByRole("button", { name: "Export structure only" })
        await waitFor(() => expect(confirm).toHaveFocus())
        expect(document.querySelector("[data-pipeline-action-status]")).toHaveTextContent(
            "Privacy preview. Export a structure-only JSON recipe file.",
        )

        fireEvent.click(confirm)

        await waitFor(() => expect(downloadTextMock).toHaveBeenCalled())
        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Privacy preview" })).not.toBeInTheDocument())
        await waitFor(() => expect(inspectorExport).toHaveFocus())
    })

    it("announces Share URL success after privacy confirmation", async () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /Add/i }))
        fireEvent.click(screen.getByRole("button", { name: "Constant input" }))
        fireEvent.change(screen.getByLabelText("Constant input"), { target: { value: "{\"ok\":true}" } })
        fireEvent.click(screen.getByRole("button", { name: /^Share URL$/i }))
        fireEvent.click(screen.getByRole("button", { name: "Copy structure-only URL" }))

        await waitFor(() => {
            expect(clipboardWriteMock).toHaveBeenCalledWith(expect.stringContaining("/en/pipeline-builder?recipe="))
        })
        expect(clipboardWriteMock.mock.calls.at(-1)?.[0]).not.toContain("{\"ok\":true}")
        expect(toastSuccessMock).toHaveBeenCalledWith("Copied to clipboard", {
            description: "Share URL copied without constant step input",
        })
        await waitFor(() => {
            expect(screen.getByText("Copied to clipboard. Share URL copied without constant step input")).toHaveAttribute("data-pipeline-action-status")
        })
    }, 10_000)

    it("announces Export JSON success and downloads structure-only recipe JSON", async () => {
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getAllByRole("button", { name: /^Export JSON$/i })[0])
        fireEvent.click(screen.getByRole("button", { name: "Export structure only" }))

        await waitFor(() => {
            expect(downloadTextMock).toHaveBeenCalledWith("Untitled-pipeline.json", expect.stringContaining('"schemaVersion": 1'), undefined)
        })
        expect(downloadTextMock.mock.calls[0][1]).not.toContain("constantInput")
        expect(toastSuccessMock).toHaveBeenCalledWith("Downloaded Untitled-pipeline.json", {
            description: "Recipe exported",
        })
        await waitFor(() => {
            expect(screen.getByText("Downloaded Untitled-pipeline.json. Recipe exported")).toHaveAttribute("data-pipeline-action-status")
        })
    })

    it("announces Export JSON failure when the browser download cannot start", async () => {
        downloadTextMock.mockImplementationOnce(() => {
            throw new Error("Downloads are blocked")
        })
        renderWithEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getAllByRole("button", { name: /^Export JSON$/i })[0])
        fireEvent.click(screen.getByRole("button", { name: "Export structure only" }))

        await waitFor(() => {
            expect(toastErrorMock).toHaveBeenCalledWith("Recipe export failed", {
                description: "Downloads are blocked",
            })
        })
        await waitFor(() => {
            expect(screen.getByText("Recipe export failed. Downloads are blocked")).toHaveAttribute("data-pipeline-action-status")
        })
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
        expect(screen.getByRole("heading", { name: "Run summary" })).toBeInTheDocument()
        expect(screen.getByText("Review the latest run and jump to a step diagnostic.")).toBeInTheDocument()
        expect(screen.getByText("Total steps")).toBeInTheDocument()
        expect(screen.getByText("Output size")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Step 1: OK" })).toHaveAttribute("href", expect.stringMatching(/^#pipeline-diagnostic-/))
        expect(document.querySelector("#pipeline-run-log-status")).toHaveTextContent("OK: 2 Run log")
        expect(screen.getByRole("table", { name: "Run log" })).toBeInTheDocument()
        expect(screen.getByText("Recipe is valid for the linear MVP executor.")).toBeInTheDocument()
        expect(screen.getAllByText("Input preview").length).toBeGreaterThan(0)
        expect(screen.getAllByText("%7B%22user%22%3A%22alice%40example.com%22%2C%22active%22%3Atrue%7D").length).toBeGreaterThan(0)
        expect(screen.getAllByRole("button", { name: "Copy step input" }).length).toBeGreaterThan(0)
    })

    it("summarizes failed runs and empty-input runs with diagnostic jump links", async () => {
        renderWithEnglish(<PipelineBuilderPage />)

        expect(screen.getByRole("heading", { name: "Run summary" })).toBeInTheDocument()
        expect(screen.getByText("Run the recipe to see status, duration, skipped steps, and output size.")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: /Add/i }))
        fireEvent.change(screen.getByLabelText("Initial input"), { target: { value: "{broken json" } })
        fireEvent.click(screen.getByRole("button", { name: /Run Recipe/i }))

        await waitFor(() => {
            expect(screen.getByRole("link", { name: "Step 1: Failed" })).toBeInTheDocument()
        })
        expect(screen.getByRole("link", { name: "Step 1: Failed" })).toHaveAttribute("href", expect.stringMatching(/^#pipeline-diagnostic-/))
        expect(screen.getByText("Skipped")).toBeInTheDocument()
        expect(screen.getAllByText(/Unexpected token|Expected property name/i).length).toBeGreaterThan(0)

        fireEvent.change(screen.getByLabelText("Select tool adapter"), { target: { value: "base64_encode_decode" } })
        fireEvent.click(screen.getByRole("button", { name: /Add/i }))
        fireEvent.click(screen.getByRole("button", { name: /2\. base64 encode decode/i }))
        fireEvent.click(screen.getByRole("button", { name: "Constant input" }))
        fireEvent.change(screen.getByLabelText("Constant input"), { target: { value: "" } })
        fireEvent.change(screen.getByLabelText("Initial input"), { target: { value: "{}" } })
        fireEvent.click(screen.getByRole("button", { name: /Run Recipe/i }))

        await waitFor(() => {
            expect(screen.getByRole("link", { name: "Step 1: OK" })).toBeInTheDocument()
            expect(screen.getByRole("link", { name: "Step 2: OK" })).toBeInTheDocument()
        })
        expect(screen.getByText("0 bytes")).toBeInTheDocument()
    }, 15_000)

    it.each([
        ["json_typescript_contract_review", "JSON TypeScript contract review", "Generate TypeScript interfaces", "export interface ApiEvent"],
        ["image_resize_social_export", "Image social export manifest", "Generate manifest checksum", /^[a-f0-9]{64}$/],
    ] as const)("loads workflow template %s from the URL without embedding runtime payload in the recipe", async (templateId, recipeName, stepLabel, expectedOutput) => {
        window.history.replaceState(null, "", `/en/pipeline-builder?template=${templateId}`)

        renderWithEnglish(<PipelineBuilderPage />)

        await waitFor(() => {
            expect(screen.getByLabelText("Recipe name")).toHaveValue(recipeName)
        })

        fireEvent.click(screen.getByRole("button", { name: new RegExp(stepLabel) }))
        expect(screen.getByLabelText("Step label")).toHaveValue(stepLabel)
        expect(trackPipelineTemplateOpenedMock).toHaveBeenCalledWith({
            templateId,
            language: "en",
            sourcePage: "workflow_page",
            action: "handoff",
        })
        expect(JSON.stringify(trackPipelineTemplateOpenedMock.mock.calls)).not.toContain("alice@example.com")

        fireEvent.click(screen.getByRole("button", { name: /Run Recipe/i }))

        await waitFor(() => {
            const value = (screen.getByPlaceholderText("Run the recipe to generate output...") as HTMLTextAreaElement).value
            if (typeof expectedOutput === "string") {
                expect(value).toContain(expectedOutput)
            } else {
                expect(value).toMatch(expectedOutput)
            }
        })
        expect(screen.getAllByText("Input preview").length).toBeGreaterThan(0)
        expect(screen.getAllByText(/hero-card\.png|evt_001/).length).toBeGreaterThan(0)
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
        expect(toastSuccessMock).toHaveBeenCalledWith("Recipe imported")
    })

    it("shows actionable feedback for invalid imported recipe JSON", async () => {
        const { container } = renderWithEnglish(<PipelineBuilderPage />)
        const file = new File(["{\"schemaVersion\":"], "broken.json", { type: "application/json" })
        Object.defineProperty(file, "text", {
            value: async () => "{\"schemaVersion\":",
        })
        const input = container.querySelector('input[type="file"]')

        expect(input).toBeInstanceOf(HTMLInputElement)
        fireEvent.change(input!, { target: { files: [file] } })

        await waitFor(() => {
            expect(screen.getAllByText(/Recipe JSON is invalid/i).length).toBeGreaterThanOrEqual(2)
        })
        expect(screen.getByText(/Recipe import failed\. Recipe JSON is invalid/i)).toHaveAttribute("data-pipeline-action-status")
        expect(toastErrorMock).toHaveBeenCalledWith("Recipe import failed", {
            description: expect.stringContaining("Recipe JSON is invalid"),
        })
    })
})
