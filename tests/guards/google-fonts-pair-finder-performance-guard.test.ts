import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("google fonts pair finder performance guard", () => {
    it("keeps page-level button and toast dependencies lazily loaded in the feature page", () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/google-fonts-pair-finder/page.tsx"),
            "utf8",
        )

        expect(source).not.toContain('from "sonner"')
        expect(source).not.toContain('from "@/components/ui/button"')
        expect(source).toContain('import("sonner")')
        expect(source).toContain("const FILTER_BUTTON_BASE_CLASS =")
    })
})
