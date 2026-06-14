import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("jwt workbench performance guard", () => {
    it("keeps page-level button and toast dependencies lazily loaded in the feature page", () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/jwt-workbench/page.tsx"),
            "utf8",
        )

        expect(source).not.toContain('from "sonner"')
        expect(source).not.toContain('from "@/components/ui/button"')
        expect(source).toContain('await import("sonner")')
        expect(source).toContain('const ICON_BUTTON_CLASS =')
    })
})
