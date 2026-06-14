import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("env parser layout guard", () => {
    it("keeps the editor and export panes stacked on mobile and prevents long output overflow", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/features/tools/env-parser/page.tsx"), "utf8")

        expect(source).toContain('className="flex min-h-0 flex-1 flex-col md:flex-row"')
        expect(source).toContain('className="flex w-full min-h-[260px] flex-col border-b md:min-h-0 md:w-[40%] md:border-b-0 md:border-r"')
        expect(source).toContain('className="flex w-full min-w-0 flex-col md:w-[60%]"')
        expect(source).toContain("whitespace-pre-wrap break-words")
    })
})
