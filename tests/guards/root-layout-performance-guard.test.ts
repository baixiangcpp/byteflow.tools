import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("root layout performance guard", () => {
    it("starts loading the toast subscriber without waiting for idle time or interaction", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8")
        const toasterSource = fs.readFileSync(path.join(process.cwd(), "src/components/ui/app-toaster.tsx"), "utf8")

        expect(source).toContain('import { AppToaster } from "@/components/ui/app-toaster";')
        expect(source).toContain("<AppToaster />")
        expect(toasterSource).toContain('import dynamic from "next/dynamic"')
        expect(toasterSource).toContain('import("./sonner")')
        expect(toasterSource).toContain("{ ssr: false }")
        expect(toasterSource).toContain("return <Toaster />")
        expect(toasterSource).not.toContain("useDeferredMount")
        expect(toasterSource).not.toContain("delayMs")
        expect(source).not.toContain('import { ThemeProvider } from "@/components/theme-provider";')
        expect(source).not.toContain("<ThemeProvider")
    })
})
