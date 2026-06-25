import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SOURCE_ROOTS = ["src/features", "src/core"]
const TEXT_FILE_PATTERN = /\.(ts|tsx)$/

const ALLOWED_RAW_FILE_READERS = new Set([
    "src/core/files/file-input-policy.ts",
    "src/core/utils/image-canvas-utils.ts",
    "src/features/tools/qr-code-generator/browser-actions.ts",
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
