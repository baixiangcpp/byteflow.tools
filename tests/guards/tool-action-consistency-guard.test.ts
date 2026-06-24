import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("tool action consistency guard", () => {
    it("documents shared Sample, Clear, Reset, disabled, and destructive action semantics", () => {
        const designSystem = read("docs/specs/design-system.md")

        expect(designSystem).toContain("Sample loads safe example input")
        expect(designSystem).toContain("Clear removes current input, output, transient errors, selected files, and sensitive fields")
        expect(designSystem).toContain("Reset restores documented defaults")
        expect(designSystem).toContain("Copy, Download, and Export operate only on current valid output")
        expect(designSystem).toContain("Destructive Clear and Reset actions use destructive styling")
    })

    it("keeps audited tool pages on the shared action bar path", () => {
        const auditedFiles = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/regex-generator/page.tsx",
            "src/features/tools/regex-tester/page.tsx",
            "src/features/tools/uuid-generator/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
        ]

        for (const file of auditedFiles) {
            expect(read(file), file).toContain("ToolActionBar")
        }
    })

    it("keeps JSON downloads as JSON files with stale output clearing", () => {
        const page = read("src/features/tools/json-formatter/page.tsx")
        const browserActions = read("src/features/tools/json-formatter/browser-actions.ts")

        expect(page).toContain('"formatted.json"')
        expect(page).toContain('"minified.json"')
        expect(page).toContain("download_disabled_invalid")
        expect(page).toContain("setOutput(\"\")")
        expect(browserActions).toContain('type: "application/json;charset=utf-8"')
        expect(browserActions).toContain("anchor.download = filename")
    })

    it("keeps HMAC secrets masked, clearable, and out of persistent storage", () => {
        const hashPage = read("src/features/tools/hash-generator/page.tsx")
        const storageAudit = read("tests/guards/sensitive-storage-audit.test.ts")

        expect(hashPage).toContain('type={secretVisible ? "text" : "password"}')
        expect(hashPage).toContain('autoComplete="off"')
        expect(hashPage).toContain("aria-pressed={secretVisible}")
        expect(hashPage).toContain("setSecret(\"\")")
        expect(hashPage).toContain("setSecretVisible(false)")
        expect(hashPage).not.toMatch(/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/)
        expect(storageAudit).toContain('"hash-generator"')
    })

    it("keeps the HTTP request builder as code generation only", () => {
        const page = read("src/features/tools/http-request-builder/page.tsx")
        const template = read("src/core/seo/components/tool-content-template-modules/top-templates.ts")

        expect(page).toContain("no_send_title")
        expect(page).toContain("no_send_desc")
        expect(page).not.toMatch(/\bfetch\s*\(|\bXMLHttpRequest\b/)
        expect(template).toContain("Does this builder send the HTTP request?")
    })

    it("keeps Log Scrubber manual review and category summary visible", () => {
        const page = read("src/features/tools/log-scrubber/page.tsx")
        const translations = read("src/core/i18n/translations/en.json")

        expect(page).toContain("manual_review_note")
        expect(page).toContain("summary_title")
        expect(page).toContain("Object.entries(summary)")
        expect(translations).toContain("Automated redaction is a safety layer, not a guarantee")
    })
})
