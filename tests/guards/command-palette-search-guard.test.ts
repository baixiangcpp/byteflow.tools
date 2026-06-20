import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("command palette search guard", () => {
    const source = () => fs.readFileSync(path.join(process.cwd(), "src/components/layout/command-palette.tsx"), "utf8")
    const navbarSource = () => fs.readFileSync(path.join(process.cwd(), "src/components/layout/navbar.tsx"), "utf8")

    it("keeps BF-014 command search surfaces wired into one deferred palette", () => {
        const commandPaletteSource = source()

        expect(commandPaletteSource).toContain("STATIC_PAGES")
        expect(commandPaletteSource).toContain("WORKFLOW_ENTRIES")
        expect(commandPaletteSource).toContain("CAPABILITY_BADGE_ORDER")
        expect(commandPaletteSource).toContain("getAllToolsHref")
        expect(commandPaletteSource).toContain("pipeline-builder")
        expect(commandPaletteSource).toContain("common.request_tool")
        expect(commandPaletteSource).toContain("common.no_results_suggestion")
    })

    it("does not send raw search text to analytics or persistence", () => {
        const commandPaletteSource = source()

        expect(commandPaletteSource).not.toContain("trackEvent(")
        expect(commandPaletteSource).not.toContain("trackToolUsage(")
        expect(commandPaletteSource).not.toContain("localStorage.setItem")
        expect(commandPaletteSource).not.toContain("sessionStorage.setItem")
        expect(commandPaletteSource).not.toContain("searchParams.set")
        expect(commandPaletteSource).not.toContain("URLSearchParams")
    })

    it("keeps the mobile search trigger visually available without duplicating tablet triggers", () => {
        const sourceText = navbarSource()

        expect(sourceText).toContain('className="inline-flex h-11 w-11 rounded-lg sm:hidden"')
        expect(sourceText).toContain('className="relative hidden h-11 w-56 justify-start')
        expect(sourceText).toContain("data-command-palette-trigger")
    })
})
