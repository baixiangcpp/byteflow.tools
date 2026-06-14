import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("app layout performance guard", () => {
    it("keeps the app layout wired to the deferred command palette wrapper", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/components/layout/app-layout.tsx"), "utf8")

        expect(source).toContain('import dynamic from "next/dynamic"')
        expect(source).toContain('import { DeferredCommandPalette } from "./deferred-command-palette"')
        expect(source).toContain('import { DeferredAppRuntime } from "./deferred-app-runtime"')
        expect(source).toContain('import { DeferredAnalytics } from "@/core/analytics/components/deferred-analytics"')
        expect(source).toContain('import { DeferredNewsletterCTA } from "./deferred-newsletter-cta"')
        expect(source).toContain('const RoutePageChrome = dynamic(')
        expect(source).toContain('import("./route-page-chrome")')
        expect(source).toContain("<DeferredAppRuntime pathname={pathname} />")
        expect(source).toContain("<DeferredAnalytics />")
        expect(source).toContain("<DeferredCommandPalette />")
        expect(source).toContain("<DeferredNewsletterCTA />")
        expect(source).toContain("{header}")
        expect(source).toContain("{footer}")
        expect(source).not.toContain('import { CommandPalette } from "./command-palette"')
        expect(source).not.toContain('import { Navbar } from "./navbar"')
        expect(source).not.toContain('import { Footer } from "./footer"')
        expect(source).not.toContain('import { NewsletterCTA } from "@/features/newsletter/components/newsletter-cta"')
        expect(source).not.toContain('import { DeferredFeedbackCTA } from "./deferred-feedback-cta"')
        expect(source).not.toContain('import { RouteAnalytics } from "@/core/analytics/components/route-analytics"')
        expect(source).not.toContain('import { WebVitalsAnalytics } from "@/core/analytics/components/web-vitals-analytics"')
        expect(source).not.toContain('import { RelatedTools } from "@/core/seo/components/related-tools"')
        expect(source).not.toContain('import { getToolBySlug } from "@/core/registry/tool-meta"')
        expect(source).not.toContain('import { getRouteContext } from "@/core/routing/route-context"')
        expect(source).not.toContain('import { recordRecentToolKey } from "@/core/storage/tool-discovery-state"')
        expect(source).not.toContain("document.querySelector")
        expect(source).not.toContain("MutationObserver")
        expect(source).not.toContain("hasInlineRelatedTools")
        expect(source).not.toContain("beforeinstallprompt")
        expect(source).not.toContain('navigator.serviceWorker.register("/sw.js")')
    })

    it("loads the command palette lazily on first shortcut intent", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/components/layout/deferred-command-palette.tsx"), "utf8")

        expect(source).toContain('import dynamic from "next/dynamic"')
        expect(source).toContain('const CommandPalette = dynamic(')
        expect(source).toContain('import("./command-palette")')
        expect(source).toContain('const COMMAND_PALETTE_TRIGGER_SELECTOR = "[data-command-palette-trigger]"')
        expect(source).toContain("setIsMounted(true)")
        expect(source).toContain("enableShortcut={false}")
        expect(source).toContain('document.addEventListener("click", click)')
    })

    it("defers non-critical layout sidecars until after idle time", () => {
        const newsletterSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/deferred-newsletter-cta.tsx"), "utf8")
        const hookSource = fs.readFileSync(path.join(process.cwd(), "src/hooks/use-deferred-mount.ts"), "utf8")

        expect(newsletterSource).toContain('import("@/features/newsletter/components/newsletter-cta")')
        expect(newsletterSource).toContain('useDeferredMount({ delayMs: 2000 })')

        expect(hookSource).toContain('window.addEventListener("pointerdown", mount, POINTER_EVENT_OPTIONS)')
        expect(hookSource).toContain('window.addEventListener("keydown", mount, KEY_EVENT_OPTIONS)')
        expect(hookSource).toContain("globalThis.setTimeout(mount, delayMs)")
    })

    it("defers analytics sidecars out of the initial shell", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/core/analytics/components/deferred-analytics.tsx"), "utf8")

        expect(source).toContain('import("./route-analytics")')
        expect(source).toContain('import("./web-vitals-analytics")')
        expect(source).toContain('useDeferredMount({ delayMs: 1500, activateOnInteraction: true })')
    })

    it("defers app runtime sidecars out of the initial shell", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/components/layout/deferred-app-runtime.tsx"), "utf8")
        const runtimeSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/app-runtime.tsx"), "utf8")

        expect(source).toContain('const AppRuntime = dynamic(')
        expect(source).toContain('import("./app-runtime")')
        expect(source).toContain('useDeferredMount({ delayMs: 1800, activateOnInteraction: true })')

        expect(runtimeSource).toContain("beforeinstallprompt")
        expect(runtimeSource).toContain('navigator.serviceWorker.register("/sw.js")')
    })

    it("isolates non-home route chrome behind a split client module", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/components/layout/route-page-chrome.tsx"), "utf8")
        const inlineSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/inline-related-tools-tool-slugs.ts"), "utf8")
        const relatedToolsSource = fs.readFileSync(path.join(process.cwd(), "src/core/seo/components/related-tools.tsx"), "utf8")

        expect(source).toContain('import { RelatedTools } from "@/core/seo/components/related-tools"')
        expect(source).toContain('import { INLINE_RELATED_TOOLS_TOOL_SLUGS } from "./inline-related-tools-tool-slugs"')
        expect(source).toContain('import { getClientToolBySlug } from "@/generated/client-tool-lookup"')
        expect(source).not.toContain('import { getToolBySlug } from "@/core/registry/tool-meta"')
        expect(source).toContain('import { getRouteContext } from "@/core/routing/route-context"')
        expect(source).toContain('import { recordRecentToolKey } from "@/core/storage/tool-discovery-state"')
        expect(source).toContain("<RelatedTools toolKey={activeTool.key} source=\"fallback\" />")
        expect(source).toContain("!INLINE_RELATED_TOOLS_TOOL_SLUGS.has(activeTool?.slug ?? \"\")")

        expect(inlineSource).toContain('"openapi-mock"')
        expect(inlineSource).toContain('"url-parser"')
        expect(inlineSource).toContain('"certificate-decoder"')

        expect(relatedToolsSource).not.toContain("useRegisterInlineRelatedTools")
    })
})
