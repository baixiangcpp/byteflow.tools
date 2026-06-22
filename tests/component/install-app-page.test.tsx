import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { InstallAppClient } from "@/features/install-app/components/install-app-client"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import { getInstallPageCopy } from "@/core/utils/install-app-copy"

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

vi.mock("@/core/analytics/analytics", () => ({
    trackPwaInstalled: vi.fn(),
}))

describe("install app page", () => {
    beforeEach(() => {
        if (!window.matchMedia) {
            Object.defineProperty(window, "matchMedia", {
                writable: true,
                value: vi.fn().mockImplementation(() => ({
                    matches: false,
                    media: "",
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })),
            })
        }
    })

    it("uses all-tools anchor for the browse tools CTA in english locale", () => {
        render(
            <InstallAppClient
                locale="en"
                copy={getInstallPageCopy("en")}
                allToolsLabel="All tools"
                trustCenterLabel="Trust Center"
            />,
        )

        const browseLink = screen.getByRole("link", { name: "All tools" })
        expect(browseLink).toHaveAttribute("href", getAllToolsHref("en"))
        expect(browseLink).not.toHaveAttribute("href", "/en/format-validate")
        expect(screen.getByRole("link", { name: "Trust Center" })).toHaveAttribute("href", "/en/trust-center")
        expect(screen.getByRole("button", { name: "Clear cached app files" })).toBeInTheDocument()
    })

    it("uses localized all-tools label and localized image alt in zh-CN locale", () => {
        const copy = getInstallPageCopy("zh-CN")
        render(
            <InstallAppClient
                locale="zh-CN"
                copy={copy}
                allToolsLabel="所有工具"
                trustCenterLabel="信任中心"
            />,
        )

        const browseLink = screen.getByRole("link", { name: "所有工具" })
        expect(browseLink).toHaveAttribute("href", getAllToolsHref("zh-CN"))
        expect(browseLink).not.toHaveAttribute("href", "/zh-CN/format-validate")
        expect(screen.getByRole("link", { name: "信任中心" })).toHaveAttribute("href", "/zh-CN/trust-center")

        const previewImage = screen.getByTestId("mock-next-image")
        expect(previewImage).toHaveAttribute("aria-label", `${copy.guides.chrome_desktop.label} ${copy.guidePreviewLabel}`)
    })

    it("clears only byteflow PWA cache buckets from the install page", async () => {
        const deleteCache = vi.fn().mockResolvedValue(true)
        Object.defineProperty(window, "caches", {
            configurable: true,
            value: {
                keys: vi.fn().mockResolvedValue([
                    "byteflow-app-shell-vtest",
                    "byteflow-tool-chunks-vtest",
                    "third-party-cache",
                ]),
                delete: deleteCache,
            },
        })

        render(
            <InstallAppClient
                locale="en"
                copy={getInstallPageCopy("en")}
                allToolsLabel="All tools"
                trustCenterLabel="Trust Center"
            />,
        )

        fireEvent.click(screen.getByRole("button", { name: "Clear cached app files" }))

        await waitFor(() => {
            expect(deleteCache).toHaveBeenCalledWith("byteflow-app-shell-vtest")
            expect(deleteCache).toHaveBeenCalledWith("byteflow-tool-chunks-vtest")
        })
        expect(deleteCache).not.toHaveBeenCalledWith("third-party-cache")
        expect(await screen.findByText("Cached app files cleared.")).toBeInTheDocument()
    })
})
