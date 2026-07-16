import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { toolGroups } from "@/components/layout/tool-groups"
import { Navbar } from "@/components/layout/navbar"
import { NavbarMobileMenu } from "@/components/layout/navbar-mobile-menu"
import { Sidebar } from "@/components/layout/sidebar"
import { Footer } from "@/components/layout/footer"
import { CommandPalette } from "@/components/layout/command-palette"
import { AppRuntime } from "@/components/layout/app-runtime"
import { getAllToolsHref } from "@/core/routing/all-tools-route"

const mocks = vi.hoisted(() => ({
    pathname: "/en",
    push: vi.fn(),
    langValue: {
        lang: "en",
        t: {},
        englishToolSearchAliases: {},
    } as {
        lang: string
        t: Record<string, unknown>
        englishToolSearchAliases?: Record<string, { title?: string; description?: string }>
    },
}))

function createMockLangValue(lang: string) {
    const nav: Record<string, string> = {
        all_tools: "All tools",
        search: "Search",
        navigation: "Navigation",
        home: "Home",
        related_tools: "Related tools",
    }

    for (const group of MENU_GROUP_DEFS) {
        nav[group.navKey] = group.navKey
    }

    for (const group of toolGroups) {
        nav[group.navKey] = nav[group.navKey] || group.navKey
    }
    nav.language = "Language"

    const pages: Record<string, string> = {
        about_title: "About",
        pricing_title: "Pricing",
        contact_title: "Contact",
        privacy_title: "Privacy",
        trust_center_title: "Trust Center",
        terms_title: "Terms",
    }

    const common: Record<string, string> = {
        all_tools: "All tools",
        install_app_label: "Install app",
        install: "Install",
        install_guide: "Install guide",
        later: "Later",
        install_prompt_message: "Install byteflow.tools for quicker access and offline usage.",
        update_available: "New version available",
        reload: "Refresh",
        back_to_top: "Back to top",
        offline_banner_title: "You are offline",
        offline_banner_message: "Cached browser-local tools may keep working after warm-up. External-request actions need network access.",
        offline_banner_action: "View offline support",
        footer_copyright: "Copyright {year} byteflow.tools. All rights reserved.",
        no_results: "No results",
        favorites: "Favorites",
        recent_tools: "Recent tools",
        no_favorites: "No favorites yet.",
        no_recent_tools: "No recent tools yet.",
        command_clear_history: "Clear Tool History",
        command_actions: "Actions",
        command_action_badge: "[ACTION]",
        command_recommended_tools: "Recommended tools",
        common_workflows: "Common workflows",
        no_results_suggestion: "Try another keyword.",
        request_tool: "Request a tool",
        capability_browser_local: "Browser-local",
        capability_external_request: "External request",
        capability_file_input: "File input",
        capability_pipeline_ready: "Pipeline ready",
        workflow_api_payload_cleanup: "API payload cleanup",
        workflow_security_token_review: "Security token review",
        workflow_image_social_export: "Image and social export",
        add_favorite: "Add to favorites",
        remove_favorite: "Remove from favorites",
        theme: "Theme",
        theme_toggle: "Toggle theme",
        theme_light: "Light",
        theme_dark: "Dark",
        theme_system: "System",
        copy: "Copy",
    }

    const tools: Record<string, { title: string; description: string }> = {}
    const englishToolSearchAliases: Record<string, { title: string; description: string }> = {}
    for (const group of toolGroups) {
        for (const item of group.items) {
            tools[item.key] = { title: `title-${item.key}`, description: `desc-${item.key}` }
            englishToolSearchAliases[item.key] = {
                title: item.key === "json_formatter" ? "JSON Formatter" : `en-title-${item.key}`,
                description: item.key === "json_formatter" ? "Format JSON" : `en-desc-${item.key}`,
            }
        }
    }

    return {
        lang,
        englishToolSearchAliases,
        t: {
            nav,
            pages,
            common,
            tools,
            site: {
                description: "Privacy-first tools.",
            },
        },
    }
}

function installMatchMedia(matches = false) {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn((media: string) => ({
            matches,
            media,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    })
}

vi.mock("next/navigation", () => ({
    usePathname: () => mocks.pathname,
    useRouter: () => ({ push: mocks.push, replace: mocks.push }),
    useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

vi.mock("next/image", () => ({
    default: ({ src, alt }: { src: string; alt?: string }) => (
        <span data-testid="mock-next-image" data-src={src} aria-label={alt ?? ""} />
    ),
}))

vi.mock("@/core/i18n/lang-provider", () => ({
    useLang: () => mocks.langValue,
}))

vi.mock("@/components/layout/theme-toggle", () => ({
    ThemeToggle: () => <button type="button">Theme</button>,
}))

vi.mock("@/components/layout/language-switcher", () => ({
    LanguageSwitcher: () => <button type="button">Language</button>,
}))

vi.mock("@/components/layout/verification-mode-panel", () => ({
    VerificationModePanel: () => null,
}))

vi.mock("sonner", () => ({
    toast: vi.fn(),
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/sheet", () => ({
    Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetClose: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/accordion", () => ({
    Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AccordionItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AccordionTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/command", () => ({
    CommandDialog: ({
        open,
        children,
        filter,
    }: {
        open: boolean
        children: React.ReactNode
        filter?: unknown
    }) =>
        open ? <div data-testid="command-dialog" data-has-filter={typeof filter === "function" ? "true" : "false"}>{children}</div> : null,
    CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CommandGroup: ({ heading, children }: { heading: string; children: React.ReactNode }) => (
        <section>
            <h3>{heading}</h3>
            {children}
        </section>
    ),
    CommandInput: ({
        placeholder,
        onValueChange,
        value,
        ...props
    }: {
        placeholder: string
        onValueChange?: (value: string) => void
        value?: string
    } & React.InputHTMLAttributes<HTMLInputElement>) => (
        <input
            {...props}
            placeholder={placeholder}
            value={value ?? ""}
            onChange={(event) => onValueChange?.(event.target.value)}
        />
    ),
    CommandItem: ({ children, onSelect, value }: { children: React.ReactNode; onSelect?: () => void; value?: string }) => (
        <button type="button" data-value={value ?? ""} onClick={() => onSelect?.()}>
            {children}
        </button>
    ),
    CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CommandSeparator: () => <hr />,
}))

function getCommandButtonByValue(label: RegExp | string): HTMLElement {
    const button = screen.getAllByRole("button", { name: label }).find((button) => {
        const value = button.getAttribute("data-value") || ""
        return value.length > 0
    })
    if (!button) {
        throw new Error(`Unable to find command button for ${String(label)}`)
    }
    return button
}

describe("layout components", () => {
    beforeEach(() => {
        mocks.pathname = "/en"
        mocks.push.mockReset()
        mocks.langValue = createMockLangValue("en")
        window.localStorage.clear()
        window.sessionStorage.clear()
        installMatchMedia()
    })

    it("renders navbar search triggers with the command-palette data contract", () => {
        render(
            <Navbar
                lang="en"
                labels={{
                    allTools: "All tools",
                    openNavigation: "Open Navigation",
                    pipelineBuilder: "Pipeline Builder",
                    search: "Search",
                }}
            />,
        )

        expect(screen.getByRole("link", { name: "byteflow.tools" })).toHaveAttribute("href", "/")
        expect(screen.getByRole("link", { name: "Pipeline Builder" })).toHaveAttribute("href", "/en/pipeline-builder")
        expect(screen.getByRole("link", { name: "All tools" })).toHaveAttribute("href", getAllToolsHref("en"))
        expect(screen.getByLabelText("Search")).toHaveAttribute("data-command-palette-trigger")
        expect(document.querySelector("[data-navbar-language-footprint]")).toHaveTextContent("English")
        expect(document.querySelector("[data-navbar-theme-footprint]")).toBeInTheDocument()
        expect(document.querySelector("[data-navbar-controls-footprint]")).toHaveTextContent("English")
    })

    it("exposes language and theme controls inside the mobile navigation sheet", () => {
        render(<NavbarMobileMenu open={true} onOpenChange={vi.fn()} />)

        expect(screen.getByRole("heading", { name: "Language" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-current", "true")
        expect(screen.getByRole("button", { name: "Français" })).toBeInTheDocument()
        expect(screen.getByRole("radiogroup", { name: "Toggle theme" })).toBeInTheDocument()
        expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument()
        expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument()
        expect(screen.getByRole("radio", { name: "System" })).toBeInTheDocument()
    })

    it("renders sidebar links with locale-aware href and active state", () => {
        mocks.pathname = "/en/json-formatter"

        render(<Sidebar />)

        const activeLink = document.querySelector('a[href="/en/json-formatter"]')
        expect(activeLink).toBeInTheDocument()
        expect(activeLink).toHaveClass("text-primary")
    })

    it("renders footer category and navigation links with locale prefix", () => {
        render(<Footer />)

        expect(screen.getByRole("link", { name: "byteflow.tools" })).toHaveAttribute("href", "/")
        expect(screen.getByRole("link", { name: "data_code_formats" })).toHaveAttribute("href", "/en/data-code-formats")
        expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/en/about")
        expect(screen.getByRole("link", { name: "Trust Center" })).toHaveAttribute("href", "/en/trust-center")
        expect(screen.queryByRole("link", { name: "json_formatter" })).not.toBeInTheDocument()
    })

    it("opens command palette with ctrl+k and navigates when selecting a command", { timeout: 10_000 }, async () => {
        render(<CommandPalette />)

        expect(screen.queryByTestId("command-dialog")).not.toBeInTheDocument()

        fireEvent.keyDown(document, { key: "k", ctrlKey: true })
        expect(screen.getByTestId("command-dialog")).toBeInTheDocument()
        expect(screen.getByTestId("command-dialog")).toHaveAttribute("data-has-filter", "true")
        expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Home" }))

        await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/"))
        await waitFor(() => expect(screen.queryByTestId("command-dialog")).not.toBeInTheDocument())
    })

    it("indexes description and metadata terms in command item search value", { timeout: 10_000 }, () => {
        render(<CommandPalette />)

        fireEvent.keyDown(document, { key: "k", ctrlKey: true })
        const jsonFormatterItem = getCommandButtonByValue(/title-json_formatter/)
        const searchValue = jsonFormatterItem.getAttribute("data-value") || ""

        expect(searchValue).toContain("desc-json_formatter")
        expect(searchValue).toContain("json-formatter")
        expect(searchValue).toContain("data-formats")
        expect(searchValue).toContain("pipeline-ready")
        expect(jsonFormatterItem).toHaveTextContent("Browser-local")
        expect(jsonFormatterItem).toHaveTextContent("File input")
        expect(jsonFormatterItem).toHaveTextContent("Pipeline ready")
    })

    it("searches navigation, category hubs, static pages, and workflow templates", { timeout: 10_000 }, () => {
        render(<CommandPalette />)

        fireEvent.keyDown(document, { key: "k", ctrlKey: true })

        const allToolsItem = screen.getByRole("button", { name: "All tools" })
        expect(allToolsItem).toHaveAttribute("data-value", expect.stringContaining("directory"))

        const categoryItem = screen.getByRole("button", { name: "data_code_formats" })
        expect(categoryItem).toHaveAttribute("data-value", expect.stringContaining("category"))

        const workflowItem = screen.getByRole("button", { name: /API payload cleanup/ })
        expect(workflowItem).toHaveAttribute("data-value", expect.stringContaining("workflow"))
        fireEvent.click(workflowItem)
        expect(mocks.push).toHaveBeenLastCalledWith("/en/pipeline-builder")
    })

    it("keeps English tool names as search aliases without replacing localized labels", { timeout: 10_000 }, () => {
        const localizedValue = createMockLangValue("fr")
        localizedValue.t.tools.json_formatter = {
            title: "Formateur JSON",
            description: "Mettre en forme JSON",
        }
        mocks.langValue = localizedValue

        render(<CommandPalette />)

        fireEvent.keyDown(document, { key: "k", ctrlKey: true })

        const jsonFormatterItem = getCommandButtonByValue(/Formateur JSON/)
        const searchValue = jsonFormatterItem.getAttribute("data-value") || ""

        expect(searchValue).toContain("JSON Formatter")
        expect(screen.queryByRole("button", { name: "JSON Formatter" })).not.toBeInTheDocument()
    })

    it("uses command namespaces when rendering system action labels", () => {
        render(<CommandPalette />)

        fireEvent.keyDown(document, { key: "k", ctrlKey: true })
        fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: ">" } })

        expect(screen.getByRole("button", { name: /Clear Tool History/ })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Home/ })).toBeInTheDocument()
    })

    it("does not open command palette while typing in an input", () => {
        render(
            <>
                <input aria-label="Editor input" />
                <CommandPalette />
            </>,
        )

        fireEvent.keyDown(screen.getByRole("textbox", { name: "Editor input" }), {
            key: "k",
            ctrlKey: true,
        })

        expect(screen.queryByTestId("command-dialog")).not.toBeInTheDocument()
    })

    it("shows an offline support banner while the browser is offline", async () => {
        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: false,
        })

        render(<AppRuntime pathname="/en/json-formatter" />)

        expect(await screen.findByRole("status")).toHaveTextContent("You are offline")
        expect(screen.getByText(/External-request actions need network access/)).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "View offline support" })).toHaveAttribute(
            "href",
            "/en/trust-center#offline-support-matrix",
        )

        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: true,
        })
        fireEvent(window, new Event("online"))
        await waitFor(() => expect(screen.queryByText("You are offline")).not.toBeInTheDocument())
    })

    it("completes an accepted install when localStorage is denied", async () => {
        const storageRead = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new DOMException("Storage denied", "SecurityError")
        })
        const storageWrite = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("Storage denied", "SecurityError")
        })
        const prompt = vi.fn().mockResolvedValue(undefined)
        const onInstallPromptConsumed = vi.fn()
        const capturedInstallPrompt = Object.assign(new Event("beforeinstallprompt"), {
            prompt,
            userChoice: Promise.resolve({ outcome: "accepted" as const, platform: "web" }),
        })

        try {
            render(
                <AppRuntime
                    pathname="/en/json-formatter"
                    capturedInstallPrompt={capturedInstallPrompt}
                    onInstallPromptConsumed={onInstallPromptConsumed}
                />,
            )

            fireEvent.click(await screen.findByRole("button", { name: "Install" }))
            await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1))
            await waitFor(() => expect(onInstallPromptConsumed).toHaveBeenCalledTimes(1))
        } finally {
            storageRead.mockRestore()
            storageWrite.mockRestore()
        }
    })

    it("shows a captured install prompt only once in memory when storage is denied", async () => {
        const storageRead = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new DOMException("Storage denied", "SecurityError")
        })
        const storageWrite = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("Storage denied", "SecurityError")
        })
        const capturedInstallPrompt = Object.assign(new Event("beforeinstallprompt"), {
            prompt: vi.fn(),
            userChoice: Promise.resolve({ outcome: "dismissed" as const, platform: "web" }),
        })

        try {
            const view = render(
                <AppRuntime pathname="/en/json-formatter" capturedInstallPrompt={capturedInstallPrompt} />,
            )

            fireEvent.click(await screen.findByRole("button", { name: "Later" }))
            expect(screen.queryByRole("button", { name: "Install" })).not.toBeInTheDocument()

            view.rerender(
                <AppRuntime pathname="/en/base64-encode-decode" capturedInstallPrompt={capturedInstallPrompt} />,
            )
            await waitFor(() => {
                expect(screen.queryByRole("button", { name: "Install" })).not.toBeInTheDocument()
            })
        } finally {
            storageRead.mockRestore()
            storageWrite.mockRestore()
        }
    })

    it("consumes a captured install prompt when the app is already installed", async () => {
        installMatchMedia(true)
        const onInstallPromptConsumed = vi.fn()
        const capturedInstallPrompt = Object.assign(new Event("beforeinstallprompt"), {
            prompt: vi.fn(),
            userChoice: Promise.resolve({ outcome: "accepted" as const, platform: "web" }),
        })

        render(
            <AppRuntime
                pathname="/en"
                capturedInstallPrompt={capturedInstallPrompt}
                onInstallPromptConsumed={onInstallPromptConsumed}
            />,
        )

        await waitFor(() => expect(onInstallPromptConsumed).toHaveBeenCalledTimes(1))
    })

    it("fails fast when visible i18n labels are missing", () => {
        const completeValue = createMockLangValue("en")
        mocks.langValue = {
            ...completeValue,
            t: {
                ...completeValue.t,
                nav: {},
                tools: {},
                common: {
                    all_tools: "All tools",
                    no_results: "No results",
                    install_app_label: "Install app",
                },
            },
        }

        expect(() => render(<Sidebar />)).toThrow("[i18n] Missing translation value for nav.")
        expect(() => render(<CommandPalette />)).toThrow("[i18n] Missing translation value for nav.navigation")
    })
})
