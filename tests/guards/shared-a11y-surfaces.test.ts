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

    it("keeps representative dynamic tools labeled with associated errors and status regions", () => {
        const base64 = readSource("src/features/tools/base64-encode-decode/page.tsx")
        const regex = readSource("src/features/tools/regex-tester/page.tsx")
        const imageResizer = readSource("src/features/tools/image-resizer/page.tsx")
        const youtube = readSource("src/features/tools/youtube-thumbnail-grabber/page.tsx")
        const vimeo = readSource("src/features/tools/vimeo-thumbnail-grabber/page.tsx")
        const instagram = readSource("src/features/tools/instagram-photo-downloader/page.tsx")
        const externalRequestStatus = readSource("src/features/tool-shell/external-request-status.tsx")

        expect(base64).toContain('role="alert"')
        expect(base64).toContain('aria-label={t.common.input}')
        expect(base64).toContain('"aria-describedby": "base64-error"')
        expect(base64).toContain('"aria-invalid": true')
        expect(base64).toContain("{...inputA11yProps}")
        expect(base64).toContain("ariaLabel={t.common.output}")

        expect(regex).toContain('id="regex-pattern"')
        expect(regex).toContain('role="alert"')
        expect(regex).toContain('aria-describedby={error ? "regex-pattern-error" : undefined}')
        expect(regex).toContain('aria-live="polite"')

        expect(imageResizer).toContain('aria-label={uploadPolicy.description}')
        expect(imageResizer).toContain('aria-pressed={lockAspect}')
        expect(imageResizer).toContain('aria-label={t.common.output}')

        for (const source of [youtube, vimeo, instagram]) {
            expect(source).toContain("ExternalRequestStatus")
        }
        expect(externalRequestStatus).toContain('role={role}')
        expect(externalRequestStatus).toContain('aria-live={role === "alert" ? "assertive" : "polite"}')
        expect(externalRequestStatus).toContain("data-external-request-status")
    })
})
