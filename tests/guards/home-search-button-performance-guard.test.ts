import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("home search button performance guard", () => {
    it("keeps the hero search button server-rendered and on the shared trigger contract", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/search-button.tsx"), "utf8")

        expect(source).not.toContain('"use client"')
        expect(source).not.toContain("useShortcutModifier")
        expect(source).toContain("data-command-palette-trigger")
        expect(source).toContain("Cmd/Ctrl")
    })
})
