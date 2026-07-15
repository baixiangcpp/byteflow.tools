import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SOURCE_ROOTS = ["src/features", "src/core"]
const TEXT_FILE_PATTERN = /\.(ts|tsx)$/

const ALLOWED_RAW_FILE_READERS = new Set([
    "src/core/files/file-input-policy.ts",
    "src/core/utils/image-canvas-utils.ts",
    "src/features/tools/image-resizer/image-resize-task.ts",
    "src/features/tools/scanned-pdf-converter/scan-enhance-task.ts",
])

function walk(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) files.push(...walk(fullPath))
        else if (entry.isFile() && TEXT_FILE_PATTERN.test(entry.name)) files.push(fullPath)
    }
    return files
}

function sourceFiles(): string[] {
    return SOURCE_ROOTS.flatMap((root) => walk(path.join(ROOT, root)))
        .map((file) => path.relative(ROOT, file).replace(/\\/g, "/"))
        .sort()
}

function read(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("file input safety guard", () => {
    it("keeps raw file readers behind policy-aware helpers or worker conversion tasks", () => {
        const rawReaderPattern = /\bnew FileReader\b|\breadAsText\(|\bfile\.text\(|\bfile\.arrayBuffer\(\)/
        const offenders = sourceFiles().filter((file) => rawReaderPattern.test(read(file)) && !ALLOWED_RAW_FILE_READERS.has(file))
        expect(offenders).toEqual([])
    })

    it("requires every file input to declare an accept policy", () => {
        const offenders: string[] = []
        for (const file of sourceFiles()) {
            const source = read(file)
            const inputBlocks = source.match(/<input[\s\S]{0,600}?type="file"[\s\S]{0,600}?\/>/g) ?? []
            for (const block of inputBlocks) {
                if (!/\baccept=/.test(block)) offenders.push(file)
            }
        }
        expect([...new Set(offenders)].sort()).toEqual([])
    })

    it("documents all shared file input policy classes", () => {
        const policySource = read("src/core/files/file-input-policy.ts")
        for (const id of ["text", "csv-json", "hash-file", "base64-file", "image-standard", "image-compact", "image-logo", "svg", "scan-image", "recipe-json"]) {
            expect(policySource).toContain(`id: "${id}"`)
            expect(policySource).toContain("maxBytes")
            expect(policySource).toContain("description")
        }
        for (const id of ["image-standard", "image-compact", "image-logo", "scan-image"]) {
            expect(policySource).toMatch(new RegExp(`"${id}"[\\s\\S]*maxPixels`))
        }
    })

    it("requires generic raster readers to verify file signatures before decoding", () => {
        const policySource = read("src/core/files/file-input-policy.ts")
        const imageUtilsSource = read("src/core/utils/image-canvas-utils.ts")
        const qrActionsSource = read("src/features/tools/qr-code-generator/browser-actions.ts")

        expect(policySource).toContain("detectRasterImageMime")
        expect(policySource).toContain("validateFileContentAgainstPolicy")
        expect(policySource).not.toContain('"scan-image": {\n        id: "scan-image",\n        accept: "image/*"')
        expect(imageUtilsSource).toContain("validateFileContentAgainstPolicy(file, policy)")
        expect(qrActionsSource).toContain('fileToDataUrl(file, FILE_INPUT_POLICIES["image-logo"])')
        expect(qrActionsSource).not.toContain("new FileReader")
    })

    it("keeps every raster-only picker aligned with an explicit shared policy", () => {
        const wildcardImagePickers = sourceFiles().filter((file) => read(file).includes('accept="image/*"'))
        expect(wildcardImagePickers).toEqual([])

        const filesByPolicy = new Map([
            ["src/features/tools/ascii-art-generator/page.tsx", "image-compact"],
            ["src/features/tools/image-average-color-finder/page.tsx", "image-compact"],
            ["src/features/tools/image-base64/page.tsx", "image-compact"],
            ["src/features/tools/instagram-filters/page.tsx", "image-standard"],
            ["src/features/tools/instagram-post-generator/page.tsx", "image-standard"],
            ["src/features/tools/instagram-story-generator/page.tsx", "image-standard"],
            ["src/features/tools/qr-code-generator/page.tsx", "image-logo"],
            ["src/features/tools/tweet-generator/page.tsx", "image-logo"],
        ])

        for (const [file, policyId] of filesByPolicy) {
            const source = read(file)
            expect(source, file).toContain(`FILE_INPUT_POLICIES["${policyId}"]`)
            expect(source, file).toContain("accept={")
            expect(source, file).not.toContain('accept="image/*"')
            expect(source, file).not.toContain('file.type.startsWith("image/")')
        }
    })

    it("directs SVG users from raster upload copy to the SVG-to-PNG workflow", () => {
        for (const locale of ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"]) {
            const translations = JSON.parse(read(`src/core/i18n/translations/${locale}.json`)) as {
                tools: Record<string, Record<string, string>>
            }
            const rasterUploadCopy = [
                translations.tools.image_base64.supports,
                translations.tools.image_base64.invalid_file_desc,
                translations.tools.qr_code_generator.logo_hint,
            ]

            for (const copy of rasterUploadCopy) {
                expect(copy, locale).toContain("SVG")
                expect(copy.lastIndexOf("PNG"), locale).toBeGreaterThan(copy.lastIndexOf("SVG"))
            }
        }
    })

    it("keeps representative image tools on shared upload policy and status UI", () => {
        const files = [
            "src/features/tools/image-cropper/page.tsx",
            "src/features/tools/image-filters/page.tsx",
            "src/features/tools/image-color-picker/page.tsx",
            "src/features/tools/image-color-extractor/page.tsx",
            "src/features/tools/image-caption-generator/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/photo-censor/page.tsx",
            "src/features/tools/scanned-pdf-converter/page.tsx",
            "src/features/tools/svg-optimizer/page.tsx",
            "src/features/tools/tweet-to-image-converter/page.tsx",
        ]

        for (const file of files) {
            const source = read(file)
            expect(source, file).toContain("FILE_INPUT_POLICIES")
            expect(source, file).toContain("FileUploadStatus")
            expect(source, file).not.toContain("MAX_FILE_SIZE")
            expect(source, file).not.toContain('accept="image/*"')
            expect(source, file).not.toContain('file.type.startsWith("image/")')
        }
    })
})
