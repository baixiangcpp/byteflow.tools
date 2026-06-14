import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("csv json converter performance guard", () => {
    it("keeps page-level button and toast dependencies lazily loaded in the feature module", () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/csv-json-converter/page.tsx"),
            "utf8",
        )
        const componentsSource = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/csv-json-converter/components.tsx"),
            "utf8",
        )

        expect(source).not.toContain('from "sonner"')
        expect(source).not.toContain('from "@/components/ui/button"')
        expect(componentsSource).not.toContain('from "@/components/ui/button"')
        expect(source).toContain('await import("sonner")')
        expect(componentsSource).toContain("function InlineButton(")
    })
})
