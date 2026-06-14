import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("monaco editors defer source guard", () => {
    it("keeps desktop Monaco loading gated behind first interaction", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/features/tool-shell/monaco-editors.tsx"), "utf8")

        expect(source).toContain("useDesktopMonacoActivation")
        expect(source).toContain("desktopActivation !== \"deferred\"")
        expect(source).toContain("onPointerDown={activateDesktopMonaco}")
        expect(source).toContain("onFocus={activateDesktopMonaco}")
    })
})
