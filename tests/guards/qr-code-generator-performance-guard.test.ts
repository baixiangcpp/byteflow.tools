import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("qr code generator performance guard", () => {
    it("keeps qrcode, button, and toast dependencies lazy after feature-local splitting", () => {
        const pageSource = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/qr-code-generator/page.tsx"),
            "utf8",
        )
        const browserActionsSource = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/qr-code-generator/browser-actions.ts"),
            "utf8",
        )

        expect(pageSource).not.toContain('from "qrcode"')
        expect(pageSource).not.toContain('from "sonner"')
        expect(pageSource).not.toContain('from "@/components/ui/button"')
        expect(browserActionsSource).toContain('import("qrcode")')
        expect(browserActionsSource).toContain('import("sonner")')
        expect(pageSource).toContain("function InlineButton(")
    })
})
