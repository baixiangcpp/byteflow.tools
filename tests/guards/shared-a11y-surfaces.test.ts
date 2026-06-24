import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PROJECT_ROOT = process.cwd()

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8")
}

describe("shared accessibility surfaces", () => {
    it("keeps the All Tools mobile filters trapped, restorable, and announced", () => {
        const source = readSource("src/features/tool-discovery/all-tools-discovery.tsx")

        expect(source).toContain("MOBILE_FILTER_FOCUSABLE_SELECTOR")
        expect(source).toContain("mobileFilterPreviousFocusRef")
        expect(source).toContain("event.key === \"Escape\"")
        expect(source).toContain("aria-live=\"polite\"")
        expect(source).toContain("role=\"dialog\"")
        expect(source).toContain("aria-modal=\"true\"")
    })

    it("keeps the shared tool action bar named and described", () => {
        const source = readSource("src/features/tool-shell/tool-action-bar.tsx")

        expect(source).toContain("role=\"toolbar\"")
        expect(source).toContain("aria-label={t.common.tool_actions}")
        expect(source).toContain("aria-describedby={disabledDescriptionId}")
        expect(source).toContain("aria-describedby={handoffDisabledDescriptionId}")
    })

    it("keeps Pipeline Builder run status available to assistive tech", () => {
        const source = readSource("src/features/tools/pipeline-builder/pipeline-run-log.tsx")

        expect(source).toContain("role=\"status\"")
        expect(source).toContain("aria-live=\"polite\"")
        expect(source).toContain("aria-label={text(\"run_log\")}")
        expect(source).toContain("role=\"alert\"")
    })
})
