import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const SRC_ROOT = path.join(process.cwd(), "src")
const TEXT_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/
const DANGEROUS_HTML_CALL = "dangerouslySetInnerHTML"

const ALLOWED_DANGEROUS_HTML_FILES = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/core/seo/components/json-ld-script.tsx",
    "src/core/seo/components/legacy-tool-redirect-page.tsx",
    "src/features/tools/svg-optimizer/page.tsx",
]

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

    it("sanitizes user-provided SVG output before previewing it as HTML", () => {
        const source = readSource("src/features/tools/svg-optimizer/page.tsx")

        expect(source).toContain("import DOMPurify from \"isomorphic-dompurify\"")
        expect(source).toContain("dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(output) }}")
        expect(countMatches(source, /dangerouslySetInnerHTML=\{\{/g)).toBe(1)
    })

    it("embeds dynamic redirect and runtime script data with JSON serialization only", () => {
        const rootPageSource = readSource("src/app/page.tsx")
        const legacyRedirectSource = readSource("src/core/seo/components/legacy-tool-redirect-page.tsx")
        const layoutSource = readSource("src/app/layout.tsx")

        expect(rootPageSource).toContain("var supported = ${JSON.stringify(LOCALES)};")
        expect(countMatches(rootPageSource, /dangerouslySetInnerHTML=\{\{/g)).toBe(1)

        expect(legacyRedirectSource).toContain("const escapedHref = JSON.stringify(href)")
        expect(legacyRedirectSource).toContain("var target = ${escapedHref};")
        expect(countMatches(legacyRedirectSource, /dangerouslySetInnerHTML=\{\{/g)).toBe(1)

        expect(layoutSource).toContain("var locales = ${JSON.stringify(LOCALES)};")
        expect(countMatches(layoutSource, /dangerouslySetInnerHTML=\{\{/g)).toBe(1)
    })
})
