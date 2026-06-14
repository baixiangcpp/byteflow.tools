import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("root layout performance guard", () => {
    it("keeps the root layout wired to the deferred toaster wrapper", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8")

        expect(source).toContain('import { DeferredToaster } from "@/components/ui/deferred-toaster";')
        expect(source).toContain("<DeferredToaster />")
        expect(source).not.toContain('import { Toaster } from "@/components/ui/sonner";')
        expect(source).not.toContain('import { ThemeProvider } from "@/components/theme-provider";')
        expect(source).not.toContain("<ThemeProvider")
    })

    it("loads the sonner toaster lazily after idle time or first interaction", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/components/ui/deferred-toaster.tsx"), "utf8")

        expect(source).toContain('import dynamic from "next/dynamic"')
        expect(source).toContain('import("./sonner")')
        expect(source).toContain("{ ssr: false }")
        expect(source).toContain('useDeferredMount({ delayMs: 2000, activateOnInteraction: true })')
    })
})
