import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PROJECT_ROOT = process.cwd()
const TARGET_DIRS = ["src/app", "src/components"]

const ICON_BUTTON_BLOCK_PATTERN = /<Button\b[\s\S]*?size\s*=\s*["']icon["'][\s\S]*?<\/Button>/g
const ICON_BUTTON_SELF_CLOSING_PATTERN = /<Button\b[^>]*size\s*=\s*["']icon["'][^>]*\/>/g

function collectTsxFiles(relativeDir: string): string[] {
    const absoluteDir = path.join(PROJECT_ROOT, relativeDir)
    if (!fs.existsSync(absoluteDir)) return []
    const files: string[] = []
    const stack = [absoluteDir]

    while (stack.length > 0) {
        const current = stack.pop()
        if (!current) continue
        const entries = fs.readdirSync(current, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name)
            if (entry.isDirectory()) {
                stack.push(fullPath)
                continue
            }
            if (entry.isFile() && fullPath.endsWith(".tsx")) {
                files.push(path.relative(PROJECT_ROOT, fullPath))
            }
        }
    }

    return files
}

function hasAccessibleNameFromProps(source: string): boolean {
    return /aria-label\s*=|aria-labelledby\s*=|title\s*=/m.test(source)
}

function hasScreenReaderText(source: string): boolean {
    return /className\s*=\s*["'][^"']*\bsr-only\b[^"']*["']/m.test(source)
}

function lineOfIndex(source: string, index: number): number {
    return source.slice(0, index).split("\n").length
}

describe("icon button accessibility guard", () => {
    it("requires accessible names for Button size=icon", () => {
        const files = TARGET_DIRS.flatMap((dir) => collectTsxFiles(dir))
        const violations: string[] = []

        for (const file of files) {
            const source = fs.readFileSync(path.join(PROJECT_ROOT, file), "utf8")

            for (const match of source.matchAll(ICON_BUTTON_BLOCK_PATTERN)) {
                const snippet = match[0]
                if (hasAccessibleNameFromProps(snippet) || hasScreenReaderText(snippet)) continue
                const startIndex = match.index ?? 0
                violations.push(`${file}:${lineOfIndex(source, startIndex)}`)
            }

            for (const match of source.matchAll(ICON_BUTTON_SELF_CLOSING_PATTERN)) {
                const snippet = match[0]
                if (hasAccessibleNameFromProps(snippet)) continue
                const startIndex = match.index ?? 0
                violations.push(`${file}:${lineOfIndex(source, startIndex)}`)
            }
        }

        expect(violations, `Found icon buttons without accessible names:\n${violations.join("\n")}`).toEqual([])
    })
})
