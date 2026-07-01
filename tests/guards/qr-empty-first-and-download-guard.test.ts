import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readRepoFile(filePath: string) {
    return fs.readFileSync(path.join(process.cwd(), filePath), "utf8")
}

describe("QR generator UX regression guard", () => {
    it("keeps QR content empty-first and sample-driven", () => {
        const page = readRepoFile("src/features/tools/qr-code-generator/page.tsx")
        const constants = readRepoFile("src/features/tools/qr-code-generator/constants.ts")

        expect(constants).toContain('export const DEFAULT_QR_TEXT = ""')
        expect(constants).toContain('export const SAMPLE_QR_TEXT = "https://example.com/qr?id=42"')
        expect(page).toContain("React.useState(DEFAULT_QR_TEXT)")
        expect(page).toContain("setText(SAMPLE_QR_TEXT)")
        expect(page).not.toContain('React.useState("https://example.com')
        expect(page).not.toContain("setText(\"https://example.com/r/42\")")
    })

    it("uses robust browser download helpers for QR exports", () => {
        const page = readRepoFile("src/features/tools/qr-code-generator/page.tsx")
        const browserActions = readRepoFile("src/features/tools/qr-code-generator/browser-actions.ts")

        expect(page).toContain("downloadCanvasPng")
        expect(page).not.toContain("downloadDataUrl(dataUrl, \"qr-code.png\")")
        expect(browserActions).toContain("document.body.appendChild(anchor)")
        expect(browserActions).toContain("anchor.remove()")
        expect(browserActions).toContain("window.setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS)")
        expect(browserActions).not.toContain("a.click()\n    URL.revokeObjectURL(url)")
    })
})
