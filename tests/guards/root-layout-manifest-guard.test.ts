import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildThemeManifestBootstrapScript, readRuntimeScriptConfig } from "../../scripts/generators/generate-runtime-scripts.js"

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
