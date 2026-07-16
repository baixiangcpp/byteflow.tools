import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    capturePwaInstallPrompt,
    consumePwaInstallPrompt,
    getPwaInstallPromptSnapshot,
    PWA_INSTALL_INSTALLED_KEY,
    PWA_INSTALL_PROMPT_CHANGE_EVENT,
    PWA_INSTALL_PROMPT_SLOT,
    PWA_INSTALL_SESSION_PROMPTED_KEY,
    subscribePwaInstallPrompt,
} from "@/core/pwa/install-prompt-store"

function createInstallPrompt() {
    return Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" as const, platform: "web" }),
    })
}

describe("PWA install prompt store", () => {
    beforeEach(() => {
        consumePwaInstallPrompt()
        window.localStorage.clear()
        window.sessionStorage.clear()
    })

    it("does not let a stale async consumer clear a newer prompt", () => {
        const firstPrompt = capturePwaInstallPrompt(createInstallPrompt())
        const secondPrompt = capturePwaInstallPrompt(createInstallPrompt())

        expect(consumePwaInstallPrompt(firstPrompt)).toBe(false)
        expect(getPwaInstallPromptSnapshot()).toBe(secondPrompt)
        expect(consumePwaInstallPrompt(secondPrompt)).toBe(true)
        expect(getPwaInstallPromptSnapshot()).toBeNull()
    })

    it("does not let a null hydration snapshot clear a newly captured prompt", () => {
        const prompt = capturePwaInstallPrompt(createInstallPrompt())

        expect(consumePwaInstallPrompt(null)).toBe(false)
        expect(getPwaInstallPromptSnapshot()).toBe(prompt)
    })

    it("preserves the session prompt gate when a fresh browser prompt invalidates installed state", () => {
        window.localStorage.setItem(PWA_INSTALL_INSTALLED_KEY, "1")
        window.sessionStorage.setItem(PWA_INSTALL_SESSION_PROMPTED_KEY, "1")

        capturePwaInstallPrompt(createInstallPrompt())

        expect(window.localStorage.getItem(PWA_INSTALL_INSTALLED_KEY)).toBeNull()
        expect(window.sessionStorage.getItem(PWA_INSTALL_SESSION_PROMPTED_KEY)).toBe("1")
    })

    it("adopts and consumes the parser bootstrap window slot", () => {
        const prompt = createInstallPrompt()
        const listener = vi.fn()
        const unsubscribe = subscribePwaInstallPrompt(listener)

        const promptWindow = window as unknown as Record<string, unknown>
        promptWindow[PWA_INSTALL_PROMPT_SLOT] = prompt
        window.dispatchEvent(new CustomEvent(PWA_INSTALL_PROMPT_CHANGE_EVENT))

        expect(listener).toHaveBeenCalledTimes(1)
        expect(getPwaInstallPromptSnapshot()).toBe(prompt)
        expect(consumePwaInstallPrompt(prompt)).toBe(true)
        expect(promptWindow[PWA_INSTALL_PROMPT_SLOT]).toBeNull()
        unsubscribe()
    })
})
