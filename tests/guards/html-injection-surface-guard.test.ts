import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { PWA_THEME_COLOR, PWA_THEME_COLOR_LIGHT } from "@/core/pwa/constants"
import { INLINE_SCRIPT_POLICY } from "@/core/security/inline-script-policy"

const SRC_ROOT = path.join(process.cwd(), "src")
const TEXT_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/
const DANGEROUS_HTML_CALL = "dangerouslySetInnerHTML"

const ALLOWED_DANGEROUS_HTML_FILES = [
    ...INLINE_SCRIPT_POLICY.map((entry) => entry.file),
].filter((file) => INLINE_SCRIPT_POLICY.some((entry) => entry.file === file && entry.requiresUnsafeInline) || !INLINE_SCRIPT_POLICY.some((entry) => entry.file === file))

function walk(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...walk(fullPath))
            continue
        }
        if (entry.isFile() && TEXT_FILE_PATTERN.test(entry.name)) {
            files.push(fullPath)
        }
    }

    return files
}

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

function countMatches(source: string, pattern: RegExp): number {
    return Array.from(source.matchAll(pattern)).length
}

function jsonArrayPattern(values: readonly string[]): RegExp {
    const escapedValues = values.map((value) => `"${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`)
    return new RegExp(`\\[\\s*${escapedValues.join("\\s*,\\s*")}\\s*\\]`)
}

describe("HTML injection surface guard", () => {
    it("keeps React HTML injection callsites on an explicit security-reviewed allowlist", () => {
        const hits = walk(SRC_ROOT)
            .filter((file) => fs.readFileSync(file, "utf8").includes(DANGEROUS_HTML_CALL))
            .map((file) => path.relative(process.cwd(), file).replace(/\\/g, "/"))
            .sort()

        expect(hits).toEqual([...ALLOWED_DANGEROUS_HTML_FILES].sort())
    })

    it("routes JSON-LD through the shared serializer that escapes script-breaking characters", () => {
        const source = readSource("src/core/seo/components/json-ld-script.tsx")

        expect(source).toContain("export function serializeJsonLd(jsonLd: unknown): string")
        expect(source).toContain("JSON.stringify(jsonLd).replace(/</g, \"\\\\u003c\")")
        expect(countMatches(source, /dangerouslySetInnerHTML=\{\{/g)).toBe(1)
        expect(source).toContain("dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}")
    })

    it("sanitizes user-provided SVG output before previewing it as an isolated image", () => {
        const pageSource = readSource("src/features/tools/svg-optimizer/page.tsx")
        const logicSource = readSource("src/features/tools/svg-optimizer/logic.ts")
        const sanitizerSource = readSource("src/core/security/sanitize.ts")

        expect(logicSource).toContain("import { sanitizeSvg } from \"@/core/security/sanitize\"")
        expect(sanitizerSource).toContain("import DOMPurify from \"dompurify\"")
        expect(sanitizerSource).not.toContain("isomorphic-dompurify")
        expect(sanitizerSource).not.toContain("rehype-sanitize")
        expect(sanitizerSource).toContain("export function sanitizeSvg(svg: string): string")
        expect(sanitizerSource).toContain("export function sanitizeSvgForPreview(svg: string): string")
        expect(sanitizerSource).toContain("DOMPurify.sanitize(svg")
        expect(sanitizerSource).toContain("FORBID_TAGS")
        expect(pageSource).toContain("runSvgOptimizeTask({ svg: input }")
        expect(pageSource).toContain("setOutput(sanitizeOptimizedSvg(result.optimized))")
        expect(pageSource).toContain("encodeURIComponent(output)")
        expect(pageSource).toContain("src={outputDataUri}")
        expect(countMatches(pageSource, /dangerouslySetInnerHTML=\{\{/g)).toBe(0)
    })

    it("keeps Markdown export and SVG conversion tools on the shared sanitizer", () => {
        const markdownPageSource = readSource("src/features/tools/markdown-preview/page.tsx")
        const markdownRendererSource = readSource("src/features/tool-templates/markdown-preview-renderer.tsx")
        const markdownExportSource = readSource("src/features/tools/markdown-preview/export.ts")
        const markdownSchemaSource = readSource("src/core/security/markdown-sanitize-schema.ts")
        const svgRasterSource = readSource("src/features/tools/svg-to-png-converter/utils.ts")
        const svgStrokeSource = readSource("src/features/tools/svg-stroke-to-fill-converter/utils.ts")

        expect(markdownPageSource).toContain("sanitizeMarkdownPreviewHtml(previewHtml)")
        expect(markdownPageSource).toContain("buildMarkdownExportDocument({")
        expect(markdownExportSource).toContain("import { sanitizeMarkdownHtml } from \"@/core/security/sanitize\"")
        expect(markdownExportSource).toContain("export function sanitizeMarkdownPreviewHtml")
        expect(markdownExportSource).toContain("const safeHtml = sanitizeMarkdownPreviewHtml(previewHtml)")
        expect(markdownRendererSource).toContain("import { MARKDOWN_SANITIZE_SCHEMA } from \"@/core/security/markdown-sanitize-schema\"")
        expect(markdownRendererSource).toContain("[rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA]")
        expect(markdownSchemaSource).toContain("from \"rehype-sanitize\"")
        expect(svgRasterSource).toContain("import { sanitizeSvgForPreview } from \"@/core/security/sanitize\"")
        expect(svgStrokeSource).toContain("import { sanitizeSvgForPreview } from \"@/core/security/sanitize\"")
    })

    it("embeds dynamic redirect and runtime script data with JSON serialization only", () => {
        const rootPageSource = readSource("src/app/page.tsx")
        const layoutSource = readSource("src/app/layout.tsx")
        const themeScript = readSource("public/runtime/theme-manifest-bootstrap.js")

        expect(rootPageSource).not.toContain("root-locale-redirect.js")
        expect(rootPageSource).not.toContain("window.location.replace")
        expect(countMatches(rootPageSource, /dangerouslySetInnerHTML=\{\{/g)).toBe(0)

        expect(layoutSource).not.toContain("next/script")
        expect(layoutSource).toContain("<script src=\"/runtime/theme-manifest-bootstrap.js\" />")
        expect(countMatches(layoutSource, /dangerouslySetInnerHTML=\{\{/g)).toBe(0)
        expect(themeScript).toMatch(new RegExp(`var locales = ${jsonArrayPattern(LOCALES).source};`))
        expect(themeScript).toContain(`var themeColor = t === "light" ? "${PWA_THEME_COLOR_LIGHT}" : "${PWA_THEME_COLOR}";`)
    })

    it("documents each remaining inline runtime script with a CSP migration path", () => {
        expect(INLINE_SCRIPT_POLICY).toHaveLength(2)

        for (const entry of INLINE_SCRIPT_POLICY) {
            expect(fs.existsSync(path.join(process.cwd(), entry.file)), entry.file).toBe(true)
            expect(entry.purpose).toMatch(/\S/)
            expect(entry.migrationPath).toMatch(/\S/)
            if (entry.id === "json-ld-structured-data") {
                expect(entry.requiresUnsafeInline).toBe(true)
            } else {
                expect(entry.requiresUnsafeInline).toBe(false)
                expect(entry.externalScript).toMatch(/^\/runtime\/.+\.js$/)
                expect(fs.existsSync(path.join(process.cwd(), "public", entry.externalScript!.slice(1))), entry.externalScript).toBe(true)
            }
        }
    })
})
