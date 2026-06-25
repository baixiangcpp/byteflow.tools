import axe from "axe-core"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { AllToolsDiscovery } from "@/features/tool-discovery/all-tools-discovery"
import { JsonFormatterPage } from "@/features/tools/json-formatter/page"
import PipelineBuilderPage from "@/app/[lang]/pipeline-builder/page"
import { YouTubeThumbnailGrabberPage } from "@/features/tools/youtube-thumbnail-grabber/page"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/json-formatter",
}))

vi.mock("@/features/tools/json-formatter/browser-actions", () => ({
    downloadJsonOutput: vi.fn(),
}))

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        info: vi.fn(),
        success: vi.fn(),
    },
}))

const axeOptions: axe.RunOptions = {
    rules: {
        // JSDOM does not calculate contrast from the Tailwind theme variables reliably.
        "color-contrast": { enabled: false },
    },
}

async function expectNoAxeViolations(container: HTMLElement) {
    const result = await axe.run(container, axeOptions)
    expect(result.violations).toEqual([])
}

function renderEnglish(ui: React.ReactNode) {
    return render(
        <LangProvider lang="en" translations={getTranslation("en")}>
            {ui}
        </LangProvider>,
    )
}

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
            key: (index: number) => [...store.keys()][index] ?? null,
            get length() {
                return store.size
            },
        },
    })
}

function installMobileMatchMedia() {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn(() => ({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    })
}

const discoveryLabels = {
    activeFilters: "Active filters",
    allFamilies: "All families",
    clearFilters: "Clear filters",
    clearFavorites: "Clear favorites",
    commonWorkflows: "Common workflows",
    favorites: "Favorites",
    filterByCategory: "Category",
    filterByExecution: "Execution",
    filterByInputType: "Input type",
    filterByUseCase: "Use case",
    filterSearch: "Search tools",
    inputFile: "File",
    inputImage: "Image",
    inputSvg: "SVG",
    inputText: "Text",
    inputUrlDomain: "URL/domain",
    noResults: "No results",
    noResultsSuggestion: "Try another keyword.",
    requestTool: "Request a tool",
    requestToolPrivacy: "Use sanitized examples only.",
    voteOnRequests: "Vote on existing requests",
    noFavorites: "No favorites yet.",
    noRecentTools: "Open a tool to see recents.",
    open: "Open",
    popularTags: "Popular tags",
    removeFilter: "Remove filter",
    showFilters: "Show filters",
    showFewerTools: "Show fewer",
    showMoreTools: "Show more",
    closeFilters: "Done",
    clearRecentTools: "Clear recent tools",
    recentTools: "Recent tools",
    recentToolsPrivacy: "Stored locally.",
    addFavorite: "Add to favorites",
    removeFavorite: "Remove from favorites",
    favoritesPrivacy: "Stored locally.",
    searchPlaceholder: "Search tools...",
    toolsLabel: "tools",
    useCaseEncode: "Encode/decode",
    useCaseFormat: "Format/validate",
    useCaseImage: "Image/design",
    useCaseSecurity: "Security",
    useCaseWorkflow: "Workflow",
}

const capabilityLabels = {
    "browser-local": "Browser-local",
    "external-request": "External request",
    "file-input": "File input",
    "offline-capable": "Offline capable",
    "pipeline-ready": "Pipeline ready",
    "sensitive-input": "Sensitive input",
    "visual-output": "Visual output",
}

const discoveryGroups = [
    {
        key: "data_code_formats",
        title: "Data & Code Formats",
        description: "Format structured data.",
        href: "/data-code-formats",
        tools: [
            {
                key: "json_formatter",
                slug: "json-formatter",
                title: "JSON Formatter",
                description: "Format and validate JSON.",
                family: "data-formats",
                familyLabel: "Data formats",
                tags: ["json", "data-formats"],
                capabilities: ["browser-local", "file-input", "offline-capable", "pipeline-ready"],
            },
        ],
    },
]

describe("representative axe accessibility checks", () => {
    beforeEach(() => {
        installMemoryStorage()
        installMobileMatchMedia()
        window.history.replaceState(null, "", "/en/json-formatter")
    })

    it("passes axe for JSON Formatter with error association and disabled action descriptions", async () => {
        const { container } = renderEnglish(<JsonFormatterPage />)

        fireEvent.change(screen.getByRole("textbox", { name: "Input" }), { target: { value: "{\"ok\":}" } })
        fireEvent.click(screen.getByRole("button", { name: "Format" }))

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(/Invalid JSON|Unexpected token|Expected/)
        })
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveAttribute("aria-invalid", "true")
        expect(screen.getByRole("textbox", { name: "Input" })).toHaveAccessibleDescription(/Invalid JSON|Unexpected token|Expected/)
        expect(screen.getByRole("button", {
            name: "Download JSON",
            description: "Fix invalid JSON before downloading.",
        })).toBeDisabled()

        await expectNoAxeViolations(container)
    })

    it("passes axe for All Tools search, live result count, and mobile filter dialog", async () => {
        const { container } = render(
            <AllToolsDiscovery
                capabilityLabels={capabilityLabels}
                groups={discoveryGroups}
                labels={discoveryLabels}
                locale="en"
                tags={["json", "pipeline-ready"]}
                totalTools={1}
                workflows={[{ id: "api", title: "API payload cleanup", href: "/en/pipeline-builder", tags: ["json"] }]}
            />,
        )

        fireEvent.click(screen.getByRole("button", { name: /Show filters/ }))
        await waitFor(() => expect(screen.getByRole("dialog", { name: "Show filters" })).toBeInTheDocument())
        expect(screen.getByRole("textbox", { name: "Search tools" })).toHaveAccessibleDescription("1 tools")
        expect(screen.getByRole("status")).toHaveTextContent("1 tools")

        await expectNoAxeViolations(container)
    })

    it("passes axe for Pipeline Builder run status and output labeling", async () => {
        const { container } = renderEnglish(<PipelineBuilderPage />)

        fireEvent.click(screen.getByRole("button", { name: /^Sample$/i }))
        fireEvent.click(screen.getByRole("button", { name: /Run Recipe/i }))

        await waitFor(() => {
            expect(document.querySelector("#pipeline-run-log-status")).toHaveTextContent(/OK: .*Run log/)
        })
        expect(screen.getByLabelText("Final output")).toHaveAccessibleDescription(/Run log/)
        expect(screen.getByRole("table", { name: "Run log" })).toBeInTheDocument()

        await expectNoAxeViolations(container)
    })

    it("passes axe for an external-request confirmation flow before preview", async () => {
        const { container } = renderEnglish(<YouTubeThumbnailGrabberPage />)

        fireEvent.click(screen.getByRole("button", { name: "Sample" }))

        expect(screen.getByRole("heading", { name: "Confirm external request" })).toBeInTheDocument()
        expect(screen.getByRole("button", {
            name: "Preview",
            description: "Confirm the external request before previewing or downloading.",
        })).toBeDisabled()

        await expectNoAxeViolations(container)
    })
})
