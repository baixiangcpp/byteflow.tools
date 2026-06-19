import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("tool mode selector standardization", () => {
    it("keeps high-traffic mode toggles on the shared ModeSelector", () => {
        const base64Source = read("src/features/tools/base64-encode-decode/page.tsx")
        const hashSource = read("src/features/tools/hash-generator/page.tsx")
        const selectorSource = read("src/features/tool-shell/mode-selector.tsx")

        expect(base64Source).toContain("ModeSelector")
        expect(hashSource).toContain("ModeSelector")
        expect(hashSource).not.toContain("function ModeButton")
        expect(selectorSource).toContain("role=\"tablist\"")
        expect(selectorSource).toContain("aria-selected={active}")
    })
})
