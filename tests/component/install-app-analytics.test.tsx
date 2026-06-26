import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { InstallAppClient } from "@/features/install-app/components/install-app-client"
import { getInstallPageCopy } from "@/core/utils/install-app-copy"

const trackPwaInstalledMock = vi.hoisted(() => vi.fn())

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
    trackPwaInstalled: trackPwaInstalledMock,
}))

function installMatchMedia() {
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

describe("install app analytics", () => {
    beforeEach(() => {
        trackPwaInstalledMock.mockReset()
        installMatchMedia()
    })

    it("tracks install success only once when acceptance is followed by appinstalled", async () => {
        const copy = getInstallPageCopy("en")
        const prompt = vi.fn().mockResolvedValue(undefined)
        const beforeInstallPromptEvent = Object.assign(new Event("beforeinstallprompt"), {
            prompt,
            userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
        })

        render(
            <InstallAppClient
                locale="en"
                copy={copy}
                allToolsLabel="All tools"
                trustCenterLabel="Trust Center"
                localDataControlsLabel="Local data controls"
                offlineMatrixTitle="Offline support matrix"
                offlineMatrixDescription="Review which workflows keep running after cache warm-up."
                offlineMatrixLink="Offline matrix"
            />,
        )

        await act(async () => {
            window.dispatchEvent(beforeInstallPromptEvent as Event)
        })

        const installButtons = await screen.findAllByRole("button", { name: copy.installNow })
        fireEvent.click(installButtons[0])

        await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1))
        await act(async () => {
            window.dispatchEvent(new Event("appinstalled"))
        })

        await waitFor(() => {
            const successCalls = trackPwaInstalledMock.mock.calls.filter(([language]) => language === "en")
            expect(successCalls).toHaveLength(1)
        })
    })
})
