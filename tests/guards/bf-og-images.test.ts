import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { getJpegDimensions, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "../../scripts/lib/og-tool-images-lib.js"

const ROOT = process.cwd()
const TOP_TOOL_SLUGS = [
    "json-formatter",
    "jwt-decoder",
    "base64-encode-decode",
    "hash-generator",
    "url-encode-decode",
    "uuid-generator",
    "regex-tester",
    "markdown-preview",
    "json-diff-viewer",
    "json-to-typescript",
    "yaml-json-converter",
    "jwt-verifier",
    "oauth-jwks-workbench",
    "certificate-decoder",
    "log-scrubber",
    "har-viewer-sanitizer",
    "image-resizer",
    "image-cropper",
    "image-filters",
    "photo-censor",
    "svg-optimizer",
    "svg-to-png-converter",
    "qr-code-generator",
    "barcode-generator",
    "http-request-builder",
    "curl-to-code",
    "json-schema-workbench",
    "openapi-diff",
    "graphql-workbench",
    "gzip-brotli-lab",
]

const PAGE_SLUGS = [
    "images-svg-css",
    "encoding-crypto",
    "web-api-network",
    "workflows/api-payload-cleanup",
    "workflows/security-token-review",
    "workflows/log-scrub-before-sharing",
    "workflows/image-resize-social-export",
    "compare/byteflow-vs-cyberchef",
    "compare/byteflow-vs-jwt-io",
    "compare/json-formatter-vs-json-validator",
    "compare/base64-encoding-vs-encryption",
    "compare/har-sanitizer-vs-log-scrubber",
    "compare/curl-to-code-vs-http-request-builder",
    "compare/svg-optimizer-vs-svg-converter",
    "alternatives/json-formatter-privacy-first",
    "json-vs-json5-differences",
    "image-optimization-for-web-complete-workflow",
]

function expectJpeg(relativePath: string) {
    const absolutePath = path.join(ROOT, relativePath)
    expect(fs.existsSync(absolutePath), relativePath).toBe(true)
    expect(getJpegDimensions(absolutePath), relativePath).toEqual({
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
    })
}

describe("BF-041 Open Graph image coverage", () => {
    it("ships unique localized OG images for at least the top 30 tools", () => {
        for (const slug of TOP_TOOL_SLUGS) {
            expectJpeg(`public/og/tools/en/${slug}.jpg`)
        }
        expect(new Set(TOP_TOOL_SLUGS).size).toBeGreaterThanOrEqual(30)
    })

    it("ships page-specific OG images for category, workflow, comparison, and guide pages", () => {
        for (const slug of PAGE_SLUGS) {
            expectJpeg(`public/og/pages/en/${slug}.jpg`)
        }
    })

    it("documents social preview regeneration and cache behavior", () => {
        const docs = fs.readFileSync(path.join(ROOT, "docs/social-preview-cache.md"), "utf8")
        expect(docs).toContain("npm run generate:og-tool-images")
        expect(docs).toContain("1200x630")
        expect(docs).toContain("Social preview caches")
    })
})
