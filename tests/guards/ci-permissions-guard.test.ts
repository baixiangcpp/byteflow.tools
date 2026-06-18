import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("ci permissions guard", () => {
    it("keeps GitHub Actions default token permissions read-only", () => {
        const source = fs.readFileSync(path.join(process.cwd(), ".github", "workflows", "ci.yml"), "utf8")

        expect(source).toContain("permissions:\n  contents: read")
    })
})
