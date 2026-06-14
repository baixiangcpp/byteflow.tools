import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".json"])
const IGNORED_DIRS = new Set([".git", ".next", "node_modules", "out", "output"])
const LEGACY_TEST_DIR = "__" + "tests__"
const LEGACY_TOOL_COMPONENT_DIR = "src/components/" + "tools"
const LEGACY_TOOL_COMPONENT_IMPORT = "@/components/" + "tools/"
const LEGACY_TOOL_INDEX_PATH = "data/" + "tool-index.json"
const REMOVED_TOOLING_DIRS = [
    "." + "agent",
    "." + "agents",
    "." + "codex",
    "." + "superpowers",
    "." + "vscode",
    "docs/" + "superpowers",
]
const REMOVED_DOC_DIRS = [
    "docs/" + "archive",
    "docs/" + "audits",
    "docs/" + "operations",
    "docs/" + "planning",
    "docs/" + "research",
    "docs/" + "roadmap",
    "docs/" + "reports",
    "docs/" + "tasks",
]
const REMOVED_SCRIPT_DIRS = ["scripts/" + "audits", "scripts/" + "maintenance", "scripts/" + "reports", "scripts/" + "seo"]
const REMOVED_REPORT_DIRS = ["generated/" + "reports"]
const ALLOWED_SRC_LIB_FILES = [
    "src/lib/all-tools-route.ts",
    "src/lib/analytics.ts",
    "src/lib/asn1-der-inspector-utils.ts",
    "src/lib/barcode-utils.ts",
    "src/lib/base64-utils.ts",
    "src/lib/cidr-utils.ts",
    "src/lib/clipboard.ts",
    "src/lib/code-to-image-utils.ts",
    "src/lib/color-generator-utils.ts",
    "src/lib/color-utils.ts",
    "src/lib/commands/registry.tsx",
    "src/lib/commands/types.ts",
    "src/lib/css-formatter-utils.ts",
    "src/lib/css-generator-utils.ts",
    "src/lib/docker-compose-utils.ts",
    "src/lib/fake-iban-utils.ts",
    "src/lib/formatter-download-utils.ts",
    "src/lib/gzip-brotli-utils.ts",
    "src/lib/har-viewer-sanitizer-utils.ts",
    "src/lib/hash-utils.ts",
    "src/lib/hex-bytes-workbench-utils.ts",
    "src/lib/html-entity-utils.ts",
    "src/lib/html-minifier-utils.ts",
    "src/lib/html-to-markdown.ts",
    "src/lib/i18n.ts",
    "src/lib/ia-stability-baseline.json",
    "src/lib/image-base64.ts",
    "src/lib/image-canvas-utils.ts",
    "src/lib/image-censor-utils.ts",
    "src/lib/image-color-utils.ts",
    "src/lib/image-edit-utils.ts",
    "src/lib/image-resize-utils.ts",
    "src/lib/instagram-tool-utils.ts",
    "src/lib/install-app-copy.ts",
    "src/lib/invisible-chars-utils.ts",
    "src/lib/javascript-formatter-utils.ts",
    "src/lib/javascript-minifier-utils.ts",
    "src/lib/jq-examples.ts",
    "src/lib/jq-utils.ts",
    "src/lib/json-formatter-error-utils.ts",
    "src/lib/legacy-input-limits.ts",
    "src/lib/legacy-tool-redirect.ts",
    "src/lib/letter-counter-utils.ts",
    "src/lib/list-randomizer-utils.ts",
    "src/lib/localized-articles.ts",
    "src/lib/localized-meta-copy.ts",
    "src/lib/log-parser-utils.ts",
    "src/lib/log-scrubber-utils.ts",
    "src/lib/lorem-ipsum-utils.ts",
    "src/lib/menu-groups.ts",
    "src/lib/monaco-theme.ts",
    "src/lib/open-graph-utils.ts",
    "src/lib/openapi-mock-utils.ts",
    "src/lib/pages-api-response.ts",
    "src/lib/password-utils.ts",
    "src/lib/phase4-inspector-limits.ts",
    "src/lib/pipeline/adapter-registry.ts",
    "src/lib/pipeline/executor.ts",
    "src/lib/pipeline/recipe-codec.ts",
    "src/lib/pipeline/recipe-import-export.ts",
    "src/lib/pipeline/recipe-store.ts",
    "src/lib/pipeline/recipe-templates.ts",
    "src/lib/pipeline/recipe-types.ts",
    "src/lib/regex-generator.ts",
    "src/lib/robots-txt-utils.ts",
    "src/lib/route-context.ts",
    "src/lib/route-intent-copy.ts",
    "src/lib/saml-decoder-utils.ts",
    "src/lib/scanned-pdf-utils.ts",
    "src/lib/security-header-analyzer.ts",
    "src/lib/seeded-random.ts",
    "src/lib/seo.ts",
    "src/lib/shims/empty-node-module.ts",
    "src/lib/sitemap-lastmod.json",
    "src/lib/sitemap-route-groups.json",
    "src/lib/slug-case-utils.ts",
    "src/lib/social-media-utils.ts",
    "src/lib/structured-data-visualizer-utils.ts",
    "src/lib/svg-blob-utils.ts",
    "src/lib/svg-pattern-utils.ts",
    "src/lib/svg-raster-utils.ts",
    "src/lib/svg-stroke-fill-utils.ts",
    "src/lib/text-content-hub-copy.ts",
    "src/lib/text-file-import.ts",
    "src/lib/thumbnail-grabber-utils.ts",
    "src/lib/tool-aliases.ts",
    "src/lib/tool-discovery-state.ts",
    "src/lib/tool-handoff.ts",
    "src/lib/tool-meta-helpers.ts",
    "src/lib/tool-meta.ts",
    "src/lib/tool-meta/client.ts",
    "src/lib/tool-meta/formatters.ts",
    "src/lib/tool-meta/generators.ts",
    "src/lib/tool-meta/network-web.ts",
    "src/lib/tool-meta/registry.ts",
    "src/lib/tool-meta/text-string.ts",
    "src/lib/tool-meta/types.ts",
    "src/lib/tool-persistence.ts",
    "src/lib/twitter-revenue-utils.ts",
    "src/lib/unicode-inspector-utils.ts",
    "src/lib/unix-timestamp-utils.ts",
    "src/lib/url-codec-utils.ts",
    "src/lib/utils.ts",
    "src/lib/whitespace-utils.ts",
    "src/lib/yaml-merge-patch-utils.ts",
    "src/lib/yq-playground-utils.ts",
]
const ALLOWED_CORE_UTIL_FILES = [
    "src/core/utils/base64-utils.ts",
    "src/core/utils/color-generator-utils.ts",
    "src/core/utils/color-utils.ts",
    "src/core/utils/css-formatter-utils.ts",
    "src/core/utils/css-generator-utils.ts",
    "src/core/utils/hash-utils.ts",
    "src/core/utils/image-canvas-utils.ts",
    "src/core/utils/image-color-utils.ts",
    "src/core/utils/image-edit-utils.ts",
    "src/core/utils/instagram-tool-utils.ts",
    "src/core/utils/install-app-copy.ts",
    "src/core/utils/invisible-chars-utils.ts",
    "src/core/utils/legacy-input-limits.ts",
    "src/core/utils/log-scrubber-utils.ts",
    "src/core/utils/monaco-theme.ts",
    "src/core/utils/pages-api-response.ts",
    "src/core/utils/phase4-inspector-limits.ts",
    "src/core/utils/seeded-random.ts",
    "src/core/utils/shims/empty-node-module.ts",
    "src/core/utils/social-media-utils.ts",
    "src/core/utils/thumbnail-grabber-utils.ts",
    "src/core/utils/url-codec-utils.ts",
    "src/core/utils/utils.ts",
    "src/core/utils/whitespace-utils.ts",
]

function exists(relativePath: string) {
    return fs.existsSync(path.join(ROOT, relativePath))
}

function walkFiles(relativeDir: string): string[] {
    const rootDir = path.join(ROOT, relativeDir)
    if (!fs.existsSync(rootDir)) return []

    const files: string[] = []
    const stack = [rootDir]
    while (stack.length > 0) {
        const current = stack.pop()
        if (!current) continue

        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (IGNORED_DIRS.has(entry.name)) continue
            const fullPath = path.join(current, entry.name)
            if (entry.isDirectory()) {
                stack.push(fullPath)
                continue
            }
            if (entry.isFile()) {
                if (entry.name.startsWith(".tmp-")) continue
                files.push(path.relative(ROOT, fullPath).replace(/\\/g, "/"))
            }
        }
    }

    return files.sort()
}

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("directory boundaries", () => {
    it("keeps retired root directories and generated legacy data out of the repository", () => {
        for (const dir of [...REMOVED_TOOLING_DIRS, ...REMOVED_DOC_DIRS, ...REMOVED_SCRIPT_DIRS, ...REMOVED_REPORT_DIRS]) {
            expect(exists(dir)).toBe(false)
        }
        expect(exists(LEGACY_TEST_DIR)).toBe(false)
        expect(exists("plans")).toBe(false)
        expect(exists("data")).toBe(false)
        expect(exists("generated")).toBe(false)
        expect(exists("reports")).toBe(false)
        expect(exists(LEGACY_TOOL_COMPONENT_DIR)).toBe(false)
        expect(exists(LEGACY_TOOL_INDEX_PATH)).toBe(false)
        expect(exists("src/generated/tool-index.json")).toBe(true)
    })

    it("keeps scripts grouped under responsibility folders", () => {
        const rootScripts = fs
            .readdirSync(path.join(ROOT, "scripts"), { withFileTypes: true })
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name)

        expect(rootScripts).toEqual([])
    })

    it("does not reference removed tool, report, root test, plan, or archive paths from source files", () => {
        const removedPathFragments = [
            LEGACY_TOOL_COMPONENT_IMPORT,
            LEGACY_TOOL_COMPONENT_DIR,
            LEGACY_TOOL_INDEX_PATH,
            LEGACY_TEST_DIR,
            "plans/",
            ...REMOVED_DOC_DIRS.map((dir) => `${dir}/`),
            ...REMOVED_SCRIPT_DIRS.map((dir) => `${dir}/`),
            ...REMOVED_REPORT_DIRS.map((dir) => `${dir}/`),
        ]
        const offenders = walkFiles(".")
            .filter((file) => file !== "tests/guards/directory-boundaries.test.ts")
            .filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)))
            .filter((file) => {
                const source = read(file)
                return removedPathFragments.some((fragment) => source.includes(fragment))
            })

        expect(offenders).toEqual([])
    })

    it("keeps moved src/lib compatibility entries as re-export shims", () => {
        const shimFiles = walkFiles("src/lib").filter((file) => [".ts", ".tsx"].includes(path.extname(file)))

        for (const file of shimFiles) {
            const source = read(file).trim()
            expect(source).toMatch(/^export \* from "@\/(?:core|features|generated)\//)
        }
    })

    it("keeps src/lib compatibility layer from growing silently", () => {
        const libFiles = walkFiles("src/lib")
        expect(libFiles).toEqual(ALLOWED_SRC_LIB_FILES)
    })

    it("keeps src/core/utils limited to retained shared utilities", () => {
        const coreUtilsFiles = walkFiles("src/core/utils")
        expect(coreUtilsFiles).toEqual(ALLOWED_CORE_UTIL_FILES)
    })

    it("keeps generated client lookup out of the legacy src/lib source tree", () => {
        expect(exists("src/generated/client-tool-lookup.ts")).toBe(true)
        expect(read("src/lib/tool-meta/client.ts").trim()).toBe('export * from "@/generated/client-tool-lookup"')
    })

    it("keeps internal code off legacy @/lib imports except checked-in sitemap manifests", () => {
        const allowedImports = new Set([
            '@/lib/sitemap-lastmod.json',
            '@/lib/sitemap-route-groups.json',
            "@/lib/sitemap-lastmod.json",
            "@/lib/sitemap-route-groups.json",
        ])
        const offenders = ["src", "tests", "scripts"].flatMap((root) =>
            walkFiles(root)
                .filter((file) => file !== "tests/guards/directory-boundaries.test.ts")
                .filter((file) => [".ts", ".tsx", ".js", ".mjs"].includes(path.extname(file)))
                .flatMap((file) => {
                    const source = read(file)
                    const matches = source.matchAll(/from\s+["'](@\/lib\/[^"']+)["']/g)
                    return Array.from(matches)
                        .map((match) => match[1])
                        .filter((importPath) => !allowedImports.has(importPath))
                        .map((importPath) => `${file}: ${importPath}`)
                }),
        )

        expect(offenders).toEqual([])
    })
})
