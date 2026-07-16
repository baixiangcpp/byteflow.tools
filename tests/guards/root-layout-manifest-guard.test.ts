import fs from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import { buildThemeManifestBootstrapScript, readRuntimeScriptConfig } from "../../scripts/generators/generate-runtime-scripts.js"
import {
    PWA_INSTALL_INSTALLED_KEY,
    PWA_INSTALL_PROMPT_CHANGE_EVENT,
    PWA_INSTALL_PROMPT_SLOT,
    PWA_INSTALL_SESSION_PROMPTED_KEY,
} from "@/core/pwa/install-prompt-store"

describe("root layout localized manifest guard", () => {
    it("has a static manifest fallback and updates it during head parsing", () => {
        const layoutSource = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8")
        const runtimeSource = fs.readFileSync(path.join(process.cwd(), "public/runtime/theme-manifest-bootstrap.js"), "utf8")

        expect(layoutSource).toContain('<link rel="manifest" id="app-manifest" href="/manifest.json" />')
        expect(layoutSource).toContain('<script src="/runtime/theme-manifest-bootstrap.js" />')
        expect(runtimeSource).toContain('var manifestLink = document.getElementById("app-manifest");')
        expect(runtimeSource).toContain("if (!manifestLink) {")
        expect(runtimeSource).toContain('manifestLink = document.createElement("link");')
        expect(runtimeSource).toContain('manifestLink.id = "app-manifest";')
        expect(runtimeSource).toContain('manifestLink.rel = "manifest";')
        expect(runtimeSource).toContain("manifestLink.href = manifestHref;")
        expect(runtimeSource).toContain("currentScript.parentNode.insertBefore(manifestLink, currentScript.nextSibling);")
    })

    it("owns install prompt events before hydration without resetting the session gate", () => {
        const runtimeScript = buildThemeManifestBootstrapScript(readRuntimeScriptConfig())
        const promptWindow = window as unknown as Record<string, unknown>
        const promptChange = vi.fn()
        window.addEventListener(PWA_INSTALL_PROMPT_CHANGE_EVENT, promptChange)
        window.localStorage.setItem(PWA_INSTALL_INSTALLED_KEY, "1")
        window.sessionStorage.setItem(PWA_INSTALL_SESSION_PROMPTED_KEY, "1")

        try {
            Function(runtimeScript)()
            const installPrompt = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
                prompt: vi.fn().mockResolvedValue(undefined),
                userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
            })
            window.dispatchEvent(installPrompt)

            expect(installPrompt.defaultPrevented).toBe(true)
            expect(promptWindow[PWA_INSTALL_PROMPT_SLOT]).toBe(installPrompt)
            expect(window.localStorage.getItem(PWA_INSTALL_INSTALLED_KEY)).toBeNull()
            expect(window.sessionStorage.getItem(PWA_INSTALL_SESSION_PROMPTED_KEY)).toBe("1")

            window.dispatchEvent(new Event("appinstalled"))
            expect(promptWindow[PWA_INSTALL_PROMPT_SLOT]).toBeNull()
            expect(window.localStorage.getItem(PWA_INSTALL_INSTALLED_KEY)).toBe("1")
            expect(promptChange).toHaveBeenCalledTimes(2)
        } finally {
            window.removeEventListener(PWA_INSTALL_PROMPT_CHANGE_EVENT, promptChange)
            window.localStorage.clear()
            window.sessionStorage.clear()
            promptWindow[PWA_INSTALL_PROMPT_SLOT] = null
        }
    })

    it("falls back to the theme cookie when storage access is blocked", () => {
        const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage")
        document.head.innerHTML = '<link rel="manifest" id="app-manifest" href="/manifest.json"><meta name="theme-color" content="#0a0a1a">'
        document.documentElement.className = "dark"
        document.documentElement.style.colorScheme = "dark"
        document.cookie = "theme=light;path=/"
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            get() {
                throw new DOMException("Storage blocked", "SecurityError")
            },
        })

        try {
            Function(buildThemeManifestBootstrapScript(readRuntimeScriptConfig()))()
            expect(document.documentElement).toHaveClass("light")
            expect(document.documentElement.style.colorScheme).toBe("light")
            expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", "#f6f8fa")
            expect(document.getElementById("app-manifest")).toHaveAttribute("href", "/manifest.json")
        } finally {
            if (localStorageDescriptor) {
                Object.defineProperty(window, "localStorage", localStorageDescriptor)
            } else {
                delete (window as unknown as Record<string, unknown>).localStorage
            }
            document.cookie = "theme=;path=/;max-age=0"
        }
    })
})
