import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

const TARGET_DIRS = ["src", "public", "tests"]
const CONTROL_CHAR_PATTERN = /[\u200B\u200C\u200D\uFEFF]/g
const TEXT_FILE_PATTERN = /\.(ts|tsx|js|jsx|json|md|html|css)$/

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

describe("source unicode control guard", () => {
    it("rejects hidden BOM and zero-width characters in tracked text files", () => {
        const hits: Array<{ file: string; codes: number[] }> = []

        for (const dir of TARGET_DIRS) {
            const root = path.join(process.cwd(), dir)
            for (const file of walk(root)) {
                // Skip files that intentionally contain zero-width characters as test/demo data
                const normalizedPath = file.replace(/\\/g, "/")
                if (normalizedPath.includes("invisible-chars-logic.test.ts") ||
                    normalizedPath.includes("invisible-characters-detector/page.tsx")) {
                    continue
                }

                const source = fs.readFileSync(file, "utf8")
                const matches = Array.from(source.matchAll(CONTROL_CHAR_PATTERN))
                if (matches.length === 0) {
                    continue
                }
                hits.push({
                    file: path.relative(process.cwd(), file).replace(/\\/g, "/"),
                    codes: matches.map((match) => match[0].codePointAt(0) ?? 0),
                })
            }
        }

        expect(hits).toEqual([])
    })
})
