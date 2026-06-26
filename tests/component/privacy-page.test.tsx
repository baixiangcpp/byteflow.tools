import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import PrivacyPage from "@/app/[lang]/privacy/page"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
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
            key: (index: number) => Array.from(store.keys())[index] ?? null,
            get length() {
                return store.size
            },
        },
    })
}

describe("PrivacyPage", () => {
    beforeEach(() => {
        installMemoryStorage()
    })

    it("renders the manifest-generated external request tool list", () => {
        render(
            <LangProvider lang="en" translations={getTranslation("en")}>
                <PrivacyPage />
            </LangProvider>,
        )

        expect(screen.getByText("External request tools")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Privacy and Trust Center" })).toHaveAttribute("href", "/en/trust-center")
        expect(screen.getByText("YouTube Thumbnail Grabber")).toBeInTheDocument()
        expect(screen.getByText("Vimeo Thumbnail Grabber")).toBeInTheDocument()
        expect(screen.getByText("Instagram Photo Downloader")).toBeInTheDocument()
        expect(screen.getByText("youtube.com, youtube-nocookie.com, youtu.be, i.ytimg.com")).toBeInTheDocument()
        expect(screen.getByText("instagram.com")).toBeInTheDocument()
        expect(screen.getAllByText("Hosts").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Purpose").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Data sent").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Generate and preview public thumbnail image URLs derived from the video link you enter.").length).toBeGreaterThan(0)
        expect(screen.getByText("Download media from a URL you provide after you confirm you are allowed to use it.")).toBeInTheDocument()
        expect(screen.getAllByText("A derived public asset URL may be requested by your browser.").length).toBeGreaterThan(0)
        expect(screen.getByText("The URL you provide may be requested by your browser.")).toBeInTheDocument()
        expect(screen.getAllByText("Network access starts only after you choose the external-request action.").length).toBeGreaterThan(0)
    })

    it("shows analytics status and stores a local opt-out preference", () => {
        render(
            <LangProvider lang="en" translations={getTranslation("en")}>
                <PrivacyPage />
            </LangProvider>,
        )

        expect(screen.getByRole("heading", { name: "Analytics status and controls" })).toBeInTheDocument()
        expect(screen.getByText("Disabled by default")).toBeInTheDocument()
        expect(screen.getByText(/Allowed events: tool_loaded/)).toBeInTheDocument()
        expect(screen.getByText(/Tool inputs, outputs, payloads, tokens/)).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/en/privacy")
        expect(screen.getAllByRole("link", { name: "Trust Center" })[0]).toHaveAttribute("href", "/en/trust-center")

        fireEvent.click(screen.getByLabelText("Opt out of analytics on this browser"))

        expect(window.localStorage.getItem("byteflow:analytics:opt-out")).toBe("1")
        expect(screen.getByText("Locally opted out")).toBeInTheDocument()
        expect(screen.getByText("Analytics opt-out saved on this browser.")).toBeInTheDocument()
    })
})
