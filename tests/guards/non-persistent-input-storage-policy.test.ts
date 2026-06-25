import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

function sourceFiles(slug: string) {
    const dir = path.join(ROOT, "src/features/tools", slug)
    if (!fs.existsSync(dir)) return []
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && [".ts", ".tsx"].includes(path.extname(entry.name)))
        .map((entry) => path.join("src/features/tools", slug, entry.name))
}

describe("non-persistent input storage policy", () => {
    it("does not directly persist payload input for persistInput:false tools", () => {
        const offenders = (TOOL_MANIFESTS as readonly ToolMeta[])
            .filter((tool) => tool.persistInput === false)
            .flatMap((tool) =>
                sourceFiles(tool.slug).flatMap((file) => {
                    const source = read(file)
                    const hits = [
                        /readStorageString\([^)]*INPUT[^)]*STORAGE_KEY[^)]*\)/,
                        /writeStorageString\([^)]*INPUT[^)]*STORAGE_KEY[^)]*,\s*input\b[^)]*\)/,
                    ].flatMap((pattern) => (pattern.test(source) ? [`${file}: ${pattern.source}`] : []))
                    return hits
                }),
            )

        expect(offenders).toEqual([])
    })

    it("does not default-persist tool payloads, filters, seeds, or history", () => {
        const filesToScan = sourceFilesUnder("src/features")
        const forbiddenPatterns = [
            /\bwriteStorageString\([^)]*(:input|INPUT_STORAGE_KEY)[^)]*,/,
            /\breadStorageString\([^)]*(:input|INPUT_STORAGE_KEY)[^)]*\)/,
            /\bwriteStorageJson(?:<[^>]+>)?\([^)]*(?:state|history)[^)]*,[\s\S]*?\b(input|output|payload|filter|seed)\b[\s\S]*?\)/,
            /\blocalStorage\.setItem\([^)]*(?:history|filter|input|payload|seed)[^)]*\)/,
        ]

        const offenders = filesToScan.flatMap((file) => {
            const source = read(file)
            return forbiddenPatterns
                .filter((pattern) => pattern.test(source))
                .map((pattern) => `${file}: ${pattern.source}`)
        })

        expect(offenders).toEqual([])
    })
})

function sourceFilesUnder(relativeDir: string): string[] {
    const absoluteDir = path.join(ROOT, relativeDir)
    if (!fs.existsSync(absoluteDir)) return []

    return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
        const relativePath = path.join(relativeDir, entry.name)
        if (entry.isDirectory()) return sourceFilesUnder(relativePath)
        if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) return [relativePath]
        return []
    })
}
