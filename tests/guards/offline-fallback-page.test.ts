import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

describe("offline fallback page", () => {
    it("keeps the public offline shell out of search indexing", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "offline.html"), "utf8")

        expect(source).toContain("<title>Offline | byteflow.tools</title>")
        expect(source).toContain('name="description"')
        expect(source).toContain('name="robots" content="noindex, nofollow"')
        expect(source).toContain('rel="canonical" href="https://byteflow.tools/offline.html"')
    })
})
