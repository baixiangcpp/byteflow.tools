import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

function listFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry)
        return statSync(path).isDirectory() ? listFiles(path) : [path]
    })
}

describe("tool action consistency guard", () => {
    it("prevents shared ToolAction handlers from hiding async work behind void wrappers", () => {
        const files = listFiles("src/features")
            .filter((file) => file.endsWith(".tsx"))
            .filter((file) => read(file).includes("ToolAction"))

        for (const file of files) {
            const source = read(file)
            expect(source, file).not.toMatch(/onClick:\s*\(\)\s*=>\s*void\s+[A-Za-z_$][\w$]*\s*\(/)
            expect(source, file).not.toMatch(/onClick:\s*\(\)\s*=>\s*\{\s*void\s+[A-Za-z_$][\w$]*\s*\(/)
        }
    })

    it("documents shared Sample, Clear, Reset, disabled, and destructive action semantics", () => {
        const designSystem = read("docs/specs/design-system.md")

        expect(designSystem).toContain("Sample loads safe example input")
        expect(designSystem).toContain("Clear removes current input, output, transient errors, selected files, and sensitive fields")
        expect(designSystem).toContain("Reset restores documented defaults")
        expect(designSystem).toContain("Copy, Download, and Export operate only on current valid output")
        expect(designSystem).toContain("Destructive Clear and Reset actions use destructive styling")
        expect(designSystem).toContain("Shared tool actions should appear in this order")
    })

    it("keeps audited tool pages on the shared action bar path", () => {
        const auditedFiles = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/jwt-decoder/page.tsx",
            "src/features/tools/regex-generator/page.tsx",
            "src/features/tools/regex-tester/page.tsx",
            "src/features/tools/uuid-generator/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/pipeline-builder/page.tsx",
            "src/features/tools/http-request-builder/page.tsx",
            "src/features/tools/log-scrubber/page.tsx",
        ]

        for (const file of auditedFiles) {
            expect(read(file), file).toContain("ToolActionBar")
        }
    })

    it("keeps shared toolbar sample actions named Sample instead of Try Example", () => {
        const auditedFiles = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/jwt-decoder/page.tsx",
            "src/features/tools/regex-generator/page.tsx",
            "src/features/tools/regex-tester/page.tsx",
            "src/features/tools/uuid-generator/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/pipeline-builder/page.tsx",
            "src/features/tools/http-request-builder/page.tsx",
            "src/features/tools/log-scrubber/page.tsx",
        ]

        for (const file of auditedFiles) {
            const source = read(file)
            expect(source, file).not.toMatch(/id:\s*"sample"[\s\S]{0,160}label:\s*t\.common\.try_example/)
            if (source.includes('id: "sample"')) {
                expect(source, file).toContain("label: t.common.sample")
            }
        }
    })

    it("keeps copy/download feedback exposed through an accessible live region", () => {
        const toaster = read("src/components/ui/sonner.tsx")
        const toasterTest = read("tests/component/toaster-live-region.test.tsx")

        expect(toaster).toContain("Toaster as Sonner")
        expect(toaster).not.toContain("useSonner")
        expect(toaster).not.toContain("data-toast-live-region")
        expect(toasterTest).toContain("announces the latest toast title and description")
        expect(toasterTest).toContain('section[aria-live=\"polite\"]')
        expect(toasterTest).toContain('querySelector("[data-toast-live-region]")')
    })

    it("keeps audited copy, download, and share actions on visible success/failure feedback paths", () => {
        const auditedFeedbackFiles = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/uuid-generator/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
        ]

        const sharedFeedbackTools = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/vimeo-thumbnail-grabber/page.tsx",
            "src/features/tools/instagram-photo-downloader/page.tsx",
            "src/features/tools/open-graph-meta-generator/page.tsx",
            "src/features/tools/curl-to-code/page.tsx",
            "src/features/tools/url-parser/page.tsx",
            "src/features/tools/pipeline-builder/page.tsx",
            "src/features/tools/jwt-decoder/page.tsx",
            "src/features/tools/markdown-preview/page.tsx",
            "src/features/tools/crontab-generator/page.tsx",
            "src/features/tools/qr-code-generator/page.tsx",
            "src/features/tools/csv-json-converter/page.tsx",
            "src/features/tools/list-randomizer/page.tsx",
        ]

        expect(read("src/features/tool-shell/tool-action-feedback.ts")).toContain("copyTextWithToolFeedback")
        expect(read("src/features/tool-shell/tool-action-bar.tsx")).toContain("data-tool-action-status")
        expect(read("src/features/tool-shell/tool-action-bar.tsx")).toContain("action_status_pending")

        for (const file of sharedFeedbackTools) {
            const source = read(file)
            expect(source, file).toMatch(/copyTextWith(?:Lazy)?ToolFeedback|downloadedFileFeedback|notifyToolAction(Failure|Success)/)
        }

        const lazyFeedbackTools = [
            "src/features/tools/jwt-decoder/page.tsx",
            "src/features/tools/markdown-preview/page.tsx",
            "src/features/tools/crontab-generator/page.tsx",
            "src/features/tools/qr-code-generator/page.tsx",
            "src/features/tools/csv-json-converter/page.tsx",
            "src/features/tools/list-randomizer/page.tsx",
        ]
        for (const file of lazyFeedbackTools) {
            const source = read(file)
            expect(source, file).toContain("copyTextWithLazyToolFeedback")
            expect(source, file).not.toContain('from "@/features/tool-shell/tool-action-feedback"')
        }

        for (const file of lazyFeedbackTools) {
            const source = read(file)
            expect(source, file).toContain("useInlineToolActionFeedback")
            expect(source, file).toContain("<InlineToolActionFeedback")
        }

        for (const file of [
            "src/features/tools/qr-code-generator/page.tsx",
            "src/features/tools/list-randomizer/page.tsx",
        ]) {
            expect(read(file), file).toContain("result.announce ? { ...result, announce: false } : result")
        }

        for (const file of auditedFeedbackFiles) {
            const source = read(file)
            if (source.includes('id: "copy') || source.includes("id: \"copy_")) {
                expect(source, file).toMatch(/copyTextWith(?:Lazy)?ToolFeedback|safeClipboardWrite/)
                expect(source, file).toMatch(/copy_failed|copyTextWith(?:Lazy)?ToolFeedback/)
            }
            if (source.includes('id: "download') || source.includes("id: \"download_")) {
                expect(source, file).toMatch(/downloaded|downloadedFileFeedback/)
            }
        }

        const base64 = read("src/features/tools/base64-encode-decode/page.tsx")
        expect(base64).toContain('id: "share"')
        expect(base64).toContain("navigator.share")
        expect(base64).toContain("link_copied")
    })

    it("keeps audited disabled actions explainable and destructive actions visually distinct", () => {
        const auditedFiles = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/uuid-generator/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/http-request-builder/page.tsx",
            "src/features/tools/log-scrubber/page.tsx",
        ]

        for (const file of auditedFiles) {
            const source = read(file)
            expect(source, file).toContain("disabledReason")
        }

        const destructiveFiles = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/base64-encode-decode/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/youtube-thumbnail-grabber/page.tsx",
            "src/features/tools/jwt-decoder/page.tsx",
            "src/features/tools/http-request-builder/page.tsx",
            "src/features/tools/log-scrubber/page.tsx",
        ]
        for (const file of destructiveFiles) {
            expect(read(file), file).toContain("destructive: true")
        }

        const componentTest = read("tests/component/tool-action-bar.test.tsx")
        expect(componentTest).toContain("orders common actions")
        expect(componentTest).toContain("marks clear and reset style actions as destructive")
        expect(componentTest).toContain("falls back to a generic disabled reason")
        expect(componentTest).toContain("describes disabled handoff actions")
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
