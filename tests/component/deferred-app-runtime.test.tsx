import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DeferredAppRuntime } from "@/components/layout/deferred-app-runtime"
import {
    PWA_INSTALL_INSTALLED_KEY,
    PWA_INSTALL_PROMPT_CHANGE_EVENT,
    PWA_INSTALL_PROMPT_SLOT,
    PWA_INSTALL_SESSION_PROMPTED_KEY,
    consumePwaInstallPrompt,
    getPwaInstallPromptSnapshot,
} from "@/core/pwa/install-prompt-store"

const runtime = vi.hoisted(() => ({ mounted: false }))

function publishInstallPrompt(installPrompt: Event) {
    installPrompt.preventDefault()
    window.localStorage.removeItem(PWA_INSTALL_INSTALLED_KEY)
    const promptWindow = window as unknown as Record<string, unknown>
    promptWindow[PWA_INSTALL_PROMPT_SLOT] = installPrompt
    window.dispatchEvent(new CustomEvent(PWA_INSTALL_PROMPT_CHANGE_EVENT))
}

function publishAppInstalled() {
    window.localStorage.setItem(PWA_INSTALL_INSTALLED_KEY, "1")
    const promptWindow = window as unknown as Record<string, unknown>
    promptWindow[PWA_INSTALL_PROMPT_SLOT] = null
    window.dispatchEvent(new CustomEvent(PWA_INSTALL_PROMPT_CHANGE_EVENT))
}

vi.mock("@/hooks/use-deferred-mount", () => ({
    useDeferredMount: () => runtime.mounted,
}))

vi.mock("next/dynamic", () => ({
    default: () => function MockAppRuntime({
        capturedInstallPrompt,
        onInstallPromptConsumed,
    }: {
        capturedInstallPrompt?: Event | null
        onInstallPromptConsumed?: () => void
    }) {
        return (
            <button
                type="button"
                data-testid="deferred-runtime"
                data-has-install-prompt={capturedInstallPrompt ? "true" : "false"}
                onClick={onInstallPromptConsumed}
            >
                Runtime
            </button>
        )
    },
}))

describe("deferred app runtime install prompt capture", () => {
    beforeEach(() => {
        consumePwaInstallPrompt()
        window.localStorage.clear()
        window.sessionStorage.clear()
        runtime.mounted = false
    })

    it("adopts a prompt captured before hydration and before the deferred UI mounts", async () => {
        const installPrompt = new Event("beforeinstallprompt", { cancelable: true })
        publishInstallPrompt(installPrompt)
        const view = render(<DeferredAppRuntime pathname="/en/json-formatter" />)

        expect(installPrompt.defaultPrevented).toBe(true)
        expect(screen.queryByTestId("deferred-runtime")).not.toBeInTheDocument()

        runtime.mounted = true
        view.rerender(<DeferredAppRuntime pathname="/en/json-formatter" />)

        expect(screen.getByTestId("deferred-runtime")).toHaveAttribute("data-has-install-prompt", "true")
        fireEvent.click(screen.getByTestId("deferred-runtime"))
        expect(screen.getByTestId("deferred-runtime")).toHaveAttribute("data-has-install-prompt", "false")
    })

    it("drops a captured prompt when installation completes before UI mount", async () => {
        const view = render(<DeferredAppRuntime pathname="/en" />)

        await act(async () => {
            publishInstallPrompt(new Event("beforeinstallprompt", { cancelable: true }))
            publishAppInstalled()
        })

        runtime.mounted = true
        view.rerender(<DeferredAppRuntime pathname="/en" />)

        expect(screen.getByTestId("deferred-runtime")).toHaveAttribute("data-has-install-prompt", "false")
        expect(window.localStorage.getItem(PWA_INSTALL_INSTALLED_KEY)).toBe("1")
    })

    it("updates the layout subscriber when another install surface consumes the prompt", async () => {
        runtime.mounted = true
        render(<DeferredAppRuntime pathname="/en/install-app" />)
        const installPrompt = new Event("beforeinstallprompt", { cancelable: true })

        await act(async () => {
            publishInstallPrompt(installPrompt)
        })
        expect(screen.getByTestId("deferred-runtime")).toHaveAttribute("data-has-install-prompt", "true")

        await act(async () => {
            consumePwaInstallPrompt(getPwaInstallPromptSnapshot())
        })
        expect(screen.getByTestId("deferred-runtime")).toHaveAttribute("data-has-install-prompt", "false")
    })

    it("clears stale installed state without resetting the once-per-session prompt gate", async () => {
        window.localStorage.setItem(PWA_INSTALL_INSTALLED_KEY, "1")
        window.sessionStorage.setItem(PWA_INSTALL_SESSION_PROMPTED_KEY, "1")
        runtime.mounted = true
        render(<DeferredAppRuntime pathname="/en" />)
        const installPrompt = new Event("beforeinstallprompt", { cancelable: true })

        await act(async () => {
            publishInstallPrompt(installPrompt)
        })

        expect(installPrompt.defaultPrevented).toBe(true)
        expect(window.localStorage.getItem(PWA_INSTALL_INSTALLED_KEY)).toBeNull()
        expect(window.sessionStorage.getItem(PWA_INSTALL_SESSION_PROMPTED_KEY)).toBe("1")
        expect(screen.getByTestId("deferred-runtime")).toHaveAttribute("data-has-install-prompt", "true")
    })
})
