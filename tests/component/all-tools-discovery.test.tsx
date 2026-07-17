import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { renderToString } from "react-dom/server"
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
    guideLibrary: "Guide library",
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
    showFiltersWithCount: "Show filters. Active filters: {count}",
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
            {
                key: "json_diff_viewer",
                slug: "json-diff-viewer",
                title: "JSON Diff Viewer",
                description: "Compare JSON documents.",
                family: "data-formats",
                familyLabel: "Data formats",
                tags: ["json"],
                capabilities: ["browser-local", "offline-capable"],
            },
            {
                key: "jsonpath_playground",
                slug: "jsonpath-playground",
                title: "JSONPath Playground",
                description: "Query JSON with JSONPath.",
                family: "data-formats",
                familyLabel: "Data formats",
                tags: ["json"],
                capabilities: ["browser-local", "offline-capable"],
            },
            {
                key: "json_to_typescript",
                slug: "json-to-typescript",
                title: "JSON to TypeScript",
                description: "Generate TypeScript types.",
                family: "data-formats",
                familyLabel: "Data formats",
                tags: ["json"],
                capabilities: ["browser-local", "offline-capable"],
            },
            {
                key: "yaml_json_converter",
                slug: "yaml-json-converter",
                title: "YAML JSON Converter",
                description: "Convert YAML and JSON.",
                family: "data-formats",
                familyLabel: "Data formats",
                tags: ["json"],
                capabilities: ["browser-local", "offline-capable"],
            },
            {
                key: "jq_playground",
                slug: "jq-playground",
                title: "jq Playground",
                description: "Run jq-style examples locally.",
                family: "data-formats",
                familyLabel: "Data formats",
                tags: ["json"],
                capabilities: ["browser-local", "offline-capable"],
            },
            {
                key: "ndjson_formatter",
                slug: "ndjson-formatter",
                title: "NDJSON Formatter",
                description: "Format newline-delimited JSON.",
                family: "data-formats",
                familyLabel: "Data formats",
                tags: ["json"],
                capabilities: ["browser-local", "offline-capable"],
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

const LARGE_INVENTORY_TOOL_COUNT = 300
const LARGE_INVENTORY_CARD_BUDGET = 6
const LARGE_INVENTORY_COMPACT_LINK_BUDGET = LARGE_INVENTORY_TOOL_COUNT - LARGE_INVENTORY_CARD_BUDGET

function createDiscoveryElement() {
    return (
        <AllToolsDiscovery
            capabilityLabels={capabilityLabels}
            groups={groups}
            labels={labels}
            locale="en"
            tags={["json", "base64", "http", "image", "pipeline-ready"]}
            totalTools={10}
            guides={[]}
            workflows={[{ id: "api", title: "API payload cleanup", href: "/en/pipeline-builder", tags: ["json", "pipeline-ready"] }]}
        />
    )
}

function renderDiscovery() {
    return render(createDiscoveryElement())
}

function renderLargeInventoryDiscovery() {
    const largeGroup = {
        key: "data_code_formats",
        title: "Data & Code Formats",
        description: "Large inventory group for render-budget coverage.",
        href: "/data-code-formats",
        tools: Array.from({ length: LARGE_INVENTORY_TOOL_COUNT }, (_, index) => ({
            key: `synthetic_tool_${index}`,
            slug: `synthetic-tool-${index}`,
            title: `Synthetic Tool ${index}`,
            description: `Synthetic local utility ${index}.`,
            family: "synthetic",
            familyLabel: "Synthetic",
            searchKeywords: [`synthetic ${index}`],
            tags: ["bulk", "json"],
            capabilities: ["browser-local", "offline-capable", "pipeline-ready"],
        })),
    }

    return render(
        <AllToolsDiscovery
            capabilityLabels={capabilityLabels}
            groups={[largeGroup]}
            labels={labels}
            locale="en"
            tags={["bulk", "json", "pipeline-ready"]}
            totalTools={LARGE_INVENTORY_TOOL_COUNT}
            guides={[]}
            workflows={[]}
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

    it("renders stable personalization footprints before storage hydration", () => {
        const html = renderToString(createDiscoveryElement())
        const serverDocument = new DOMParser().parseFromString(html, "text/html")
        const panel = serverDocument.querySelector("[data-all-tools-personalization]")

        expect(panel?.getAttribute("aria-busy")).toBe("true")
        expect(panel?.querySelectorAll("[data-all-tools-personalization-slot]")).toHaveLength(2)
        expect(serverDocument.querySelectorAll("button.invisible[disabled][aria-hidden='true']").length).toBeGreaterThan(0)
        expect(panel?.textContent).toContain("Favorites")
        expect(panel?.textContent).toContain("Recent tools")
    })

    it("groups filters, shows active filters, and filters cards", async () => {
        renderDiscovery()

        expect(screen.getByRole("group", { name: "Category" })).toBeInTheDocument()
        expect(screen.getByRole("group", { name: "Input type" })).toBeInTheDocument()
        expect(screen.getByRole("group", { name: "Execution" })).toBeInTheDocument()
        expect(screen.getByRole("group", { name: "Use case" })).toBeInTheDocument()
        expect(screen.getByRole("status")).toHaveTextContent("10 tools")

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
        expect(screen.getByRole("status")).toHaveTextContent("10 tools")
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

        const card = screen.getAllByRole("link", { name: /JSON Formatter/ })
            .find((link) => link.getAttribute("href") === "/en/json-formatter")

        if (!card) throw new Error("JSON Formatter card link was not found")
        expect(card.closest("article")).toContainElement(screen.getByRole("button", { name: "Add to favorites: JSON Formatter" }))
        const badges = within(card).getAllByText(/Data formats|Browser-local|File input|Offline capable|Pipeline ready/)
        expect(badges.length).toBeLessThanOrEqual(3)
    })

    it("progressively discloses large groups while keeping collapsed tools crawlable as lightweight links", () => {
        const { container } = renderDiscovery()

        expect(container.querySelectorAll("[data-all-tools-card='true']")).toHaveLength(8)
        expect(container.querySelectorAll("[data-all-tools-compact-link='true']")).toHaveLength(2)
        expect(screen.getByRole("link", { name: "jq Playground" })).toHaveAttribute("href", "/en/jq-playground")
        expect(screen.getByRole("link", { name: "NDJSON Formatter" })).toHaveAttribute("href", "/en/ndjson-formatter")

        const showMore = screen.getByRole("button", { name: "Show more (2)" })
        expect(showMore).toHaveAttribute("aria-expanded", "false")
        fireEvent.click(showMore)

        expect(container.querySelectorAll("[data-all-tools-card='true']")).toHaveLength(10)
        expect(container.querySelectorAll("[data-all-tools-compact-link='true']")).toHaveLength(0)
        expect(screen.getByRole("button", { name: "Show fewer" })).toHaveAttribute("aria-expanded", "true")
    })

    it("keeps a 300-tool inventory within default and filtered render budgets", { timeout: 10_000 }, () => {
        const { container } = renderLargeInventoryDiscovery()

        expect(screen.getByRole("status")).toHaveTextContent("300 tools")
        expect(container.querySelectorAll("[data-all-tools-card='true']")).toHaveLength(LARGE_INVENTORY_CARD_BUDGET)
        expect(container.querySelectorAll("[data-all-tools-compact-link='true']")).toHaveLength(LARGE_INVENTORY_COMPACT_LINK_BUDGET)
        expect(screen.getByRole("link", { name: "Synthetic Tool 299" })).toHaveAttribute("href", "/en/synthetic-tool-299")

        fireEvent.click(screen.getByRole("button", { name: "bulk" }))

        expect(screen.getByRole("status")).toHaveTextContent("300 tools")
        expect(screen.getByRole("button", { name: "Remove filter: bulk" })).toBeInTheDocument()
        expect(container.querySelectorAll("[data-all-tools-card='true']")).toHaveLength(LARGE_INVENTORY_CARD_BUDGET)
        expect(container.querySelectorAll("[data-all-tools-compact-link='true']")).toHaveLength(LARGE_INVENTORY_COMPACT_LINK_BUDGET)

        fireEvent.change(screen.getByRole("textbox", { name: "Search tools" }), { target: { value: "Synthetic Tool 299" } })

        expect(screen.getByRole("status")).toHaveTextContent("1 tools")
        expect(container.querySelectorAll("[data-all-tools-card='true']")).toHaveLength(1)
        expect(container.querySelectorAll("[data-all-tools-compact-link='true']")).toHaveLength(0)
    })

    it("uses a mobile filter drawer with counts, close, clear, and focus restoration", async () => {
        renderDiscovery()

        const trigger = screen.getByRole("button", { name: /Show filters/ })
        expect(trigger).toHaveAccessibleName("Show filters. Active filters: 0")
        trigger.focus()
        fireEvent.click(trigger)

        const drawer = screen.getByRole("dialog", { name: "Show filters" })
        await waitFor(() => expect(drawer).toContainElement(document.activeElement as HTMLElement))
        expect(drawer).toHaveAccessibleDescription("10 tools - 0 Active filters")
        expect(within(drawer).getByText(/10 tools/)).toBeInTheDocument()
        fireEvent.click(within(drawer).getAllByRole("button", { name: "File" })[0])
        expect(within(drawer).getByText(/1 tools/)).toBeInTheDocument()
        expect(trigger).toHaveAccessibleName("Show filters. Active filters: 1")

        fireEvent.click(within(drawer).getByRole("button", { name: "Clear filters" }))
        expect(within(drawer).getByText(/10 tools/)).toBeInTheDocument()
        expect(trigger).toHaveAccessibleName("Show filters. Active filters: 0")

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

    it("offers privacy-safe request and voting links from empty search results without storing the query", () => {
        renderDiscovery()

        fireEvent.change(screen.getByRole("textbox", { name: "Search tools" }), { target: { value: "nonexistent local tool" } })

        expect(screen.getByText("No results")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Request a tool" })).toHaveAttribute(
            "href",
            "https://github.com/baixiangcpp/byteflow.tools/issues/new?template=feature_request.yml",
        )
        expect(screen.getByRole("link", { name: "Vote on existing requests" })).toHaveAttribute(
            "href",
            "https://github.com/baixiangcpp/byteflow.tools/issues?q=is%3Aissue%20is%3Aopen%20label%3Aenhancement",
        )
        expect(screen.getByText("Use sanitized examples only.")).toBeInTheDocument()
        expect(window.location.search).toBe("")
        expect(window.localStorage.getItem("byteflow:tools:search")).toBeNull()
    })
})
