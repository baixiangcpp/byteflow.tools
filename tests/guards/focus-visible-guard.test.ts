import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PROJECT_ROOT = process.cwd()
const TARGET_DIRS = ["src/app", "src/components"]
const FORBIDDEN_PATTERN = /focus-visible:ring-0/

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

describe("focus visibility guard", () => {
    it("forbids focus-visible:ring-0 in app/component tsx files", () => {
        const files = TARGET_DIRS.flatMap((dir) => collectTsxFiles(dir))
        const violations: string[] = []

        for (const file of files) {
            const source = fs.readFileSync(path.join(PROJECT_ROOT, file), "utf8")
            if (FORBIDDEN_PATTERN.test(source)) {
                violations.push(file)
            }
        }

        expect(violations, `Found forbidden focus-visible:ring-0 usage:\n${violations.join("\n")}`).toEqual([])
    })
})
