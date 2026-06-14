import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("lazy tool catalog source guard", () => {
    it("does not depend on the removed tool icon map", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/features/home/components/lazy-tool-catalog.tsx"), "utf8")

        expect(source).not.toContain("tool-icon-map")
        expect(source).toContain("getToolLogoToken(tool.key)")
    })
})
