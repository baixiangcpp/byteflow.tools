import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AllToolsDiscovery } from "@/features/tool-discovery/all-tools-discovery"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

const labels = {
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
    noFavorites: "No favorites yet.",
    noRecentTools: "Open a tool to see recents.",
    open: "Open",
    popularTags: "Popular tags",
    removeFilter: "Remove filter",
    showFilters: "Show filters",
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

const groups = [
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
                searchKeywords: ["pretty json", "format payload"],
                localizedAliases: ["JSON 格式化"],
                tags: ["json", "data-formats"],
                capabilities: ["browser-local", "file-input", "offline-capable", "pipeline-ready"],
            },
            {
                key: "base64_encode_decode",
                slug: "base64-encode-decode",
                title: "Base64 Encode/Decode",
                description: "Encode and decode Base64.",
                family: "encoders-decoders",
                familyLabel: "Encoders",
                searchKeywords: ["base 64", "decode base64"],
                tags: ["base64"],
                capabilities: ["browser-local", "offline-capable", "pipeline-ready"],
            },
        ],
    },
    {
        key: "web_api_network",
        title: "Web, API & Network",
        description: "Inspect URLs and requests.",
        href: "/web-api-network",
        tools: [
            {
                key: "url_parser",
                slug: "url-parser",
                title: "URL Parser",
                description: "Parse URLs and query strings.",
                family: "network-http",
                familyLabel: "Network",
                tags: ["url", "http"],
                capabilities: ["browser-local", "offline-capable"],
            },
        ],
    },
    {
        key: "social_metadata",
        title: "Social & Metadata",
        description: "Preview social assets.",
        href: "/social-metadata",
        tools: [
            {
                key: "thumbnail_grabber",
                slug: "youtube-thumbnail-grabber",
                title: "YouTube Thumbnail Grabber",
                description: "Preview public thumbnails.",
                family: "social-metadata",
                familyLabel: "Social",
                tags: ["image", "social-metadata"],
                capabilities: ["external-request", "visual-output"],
            },
        ],
    },
]

function renderDiscovery() {
    return render(
        <AllToolsDiscovery
            capabilityLabels={capabilityLabels}
            groups={groups}
            labels={labels}
            locale="en"
            tags={["json", "base64", "http", "image", "pipeline-ready"]}
            totalTools={4}
            workflows={[{ id: "api", title: "API payload cleanup", href: "/en/pipeline-builder", tags: ["json", "pipeline-ready"] }]}
        />,
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

describe("AllToolsDiscovery", () => {
    beforeEach(() => {
        installMemoryStorage()
        window.history.replaceState(null, "", "/en/all-tools")
    })

    it("groups filters, shows active filters, and filters cards", async () => {
        renderDiscovery()

        expect(screen.getByRole("group", { name: "Category" })).toBeInTheDocument()
        expect(screen.getByRole("group", { name: "Input type" })).toBeInTheDocument()
        expect(screen.getByRole("group", { name: "Execution" })).toBeInTheDocument()
        expect(screen.getByRole("group", { name: "Use case" })).toBeInTheDocument()
        expect(screen.getByRole("status")).toHaveTextContent("4 tools")

        fireEvent.click(screen.getAllByRole("button", { name: "File" })[0])
        expect(screen.getByText("Active filters")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Remove filter: File" })).toBeInTheDocument()
        expect(screen.getByText("JSON Formatter")).toBeInTheDocument()
        expect(screen.queryByText("URL Parser")).not.toBeInTheDocument()
        expect(window.location.search).toContain("input=file")

        fireEvent.click(screen.getAllByRole("button", { name: "External request" })[0])
        expect(screen.getByText("No results")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "API payload cleanup" })).toHaveAttribute("href", "/en/pipeline-builder")

        fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0])
        expect(screen.getByRole("status")).toHaveTextContent("4 tools")
        expect(window.location.search).toBe("")
    })

    it("reads URL filter params without persisting free-text search", () => {
        window.history.replaceState(null, "", "/en/all-tools?category=web_api_network&execution=browser-local&tag=http")
        renderDiscovery()

        expect(screen.getByText("URL Parser")).toBeInTheDocument()
        expect(screen.queryByText("JSON Formatter")).not.toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Remove filter: Web, API & Network" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Remove filter: Browser-local" })).toBeInTheDocument()

        fireEvent.change(screen.getByRole("textbox", { name: "Search tools" }), { target: { value: "url" } })
        expect(screen.getByText("URL Parser")).toBeInTheDocument()
        expect(window.location.search).not.toContain("url")
        expect(window.location.search).not.toContain("query")
    })

    it("keeps tool cards compact with only key badges", () => {
        renderDiscovery()

        const card = screen.getByRole("link", { name: /JSON Formatter/ })
        expect(card.closest("article")).toContainElement(screen.getByRole("button", { name: "Add to favorites: JSON Formatter" }))
        const badges = within(card).getAllByText(/Data formats|Browser-local|File input|Offline capable|Pipeline ready/)
        expect(badges.length).toBeLessThanOrEqual(3)
    })

    it("uses a mobile filter drawer with counts, close, clear, and focus restoration", async () => {
        renderDiscovery()

        const trigger = screen.getByRole("button", { name: /Show filters/ })
        trigger.focus()
        fireEvent.click(trigger)

        const drawer = screen.getByRole("dialog", { name: "Show filters" })
        await waitFor(() => expect(drawer).toContainElement(document.activeElement as HTMLElement))
        expect(drawer).toHaveAccessibleDescription("4 tools - 0 Active filters")
        expect(within(drawer).getByText(/4 tools/)).toBeInTheDocument()
        fireEvent.click(within(drawer).getAllByRole("button", { name: "File" })[0])
        expect(within(drawer).getByText(/1 tools/)).toBeInTheDocument()

        fireEvent.click(within(drawer).getByRole("button", { name: "Clear filters" }))
        expect(within(drawer).getByText(/4 tools/)).toBeInTheDocument()

        const doneButtons = within(drawer).getAllByRole("button", { name: "Done" })
        fireEvent.click(doneButtons[doneButtons.length - 1])
        expect(screen.queryByRole("dialog", { name: "Show filters" })).not.toBeInTheDocument()
        await waitFor(() => expect(trigger).toHaveFocus())
    })

    it("closes the mobile filter drawer with Escape and wraps Tab focus", async () => {
        renderDiscovery()

        const trigger = screen.getByRole("button", { name: /Show filters/ })
        trigger.focus()
        fireEvent.click(trigger)

        const drawer = screen.getByRole("dialog", { name: "Show filters" })
        const doneButtons = within(drawer).getAllByRole("button", { name: "Done" })
        const firstButton = doneButtons[0]
        const lastButton = doneButtons[doneButtons.length - 1]

        await waitFor(() => expect(firstButton).toHaveFocus())
        fireEvent.keyDown(document, { key: "Tab", shiftKey: true })
        expect(lastButton).toHaveFocus()

        fireEvent.keyDown(document, { key: "Escape" })
        expect(screen.queryByRole("dialog", { name: "Show filters" })).not.toBeInTheDocument()
        await waitFor(() => expect(trigger).toHaveFocus())
    })

    it("favorites and clears tools using only local tool IDs", () => {
        renderDiscovery()

        fireEvent.click(screen.getByRole("button", { name: "Add to favorites: JSON Formatter" }))

        expect(screen.getByRole("button", { name: "Remove from favorites: JSON Formatter" })).toBeInTheDocument()
        expect(screen.getAllByRole("link", { name: "JSON Formatter" }).some((link) => link.getAttribute("href") === "/en/json-formatter")).toBe(true)

        const raw = window.localStorage.getItem("byteflow:tools:favorites") ?? ""
        expect(JSON.parse(raw)).toEqual([
            expect.objectContaining({ toolKey: "json_formatter", updatedAt: expect.any(String) }),
        ])
        expect(raw).not.toMatch(/input|output|payload|secret|token|file|log|url/i)

        fireEvent.click(screen.getByRole("button", { name: "Clear favorites" }))
        expect(JSON.parse(window.localStorage.getItem("byteflow:tools:favorites") ?? "[]")).toEqual([])
    })

    it("matches localized and task search aliases without persisting search text", () => {
        renderDiscovery()

        fireEvent.change(screen.getByRole("textbox", { name: "Search tools" }), { target: { value: "JSON 格式化" } })
        expect(screen.getByText("JSON Formatter")).toBeInTheDocument()
        expect(screen.queryByText("Base64 Encode/Decode")).not.toBeInTheDocument()
        expect(window.location.search).toBe("")

        fireEvent.change(screen.getByRole("textbox", { name: "Search tools" }), { target: { value: "format payload" } })
        expect(screen.getByText("JSON Formatter")).toBeInTheDocument()
    })
})
