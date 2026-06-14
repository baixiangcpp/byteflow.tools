import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PROJECT_ROOT = process.cwd()
const JSON_DIFF_VIEWER_FILE = "src/features/tools/json-diff-viewer/page.tsx"

describe("semantic click target guard", () => {
    it("keeps key-diff copy row as button semantics", () => {
        const source = fs.readFileSync(path.join(PROJECT_ROOT, JSON_DIFF_VIEWER_FILE), "utf8")
        const legacyClickableDivPattern = /<div\s+key=\{i\}\s+onClick=\{\(\)\s*=>\s*void\s*handleCopyKey\(k\.key\)\}/m
        const buttonPattern = /<button[\s\S]{0,320}onClick=\{\(\)\s*=>\s*void\s*handleCopyKey\(k\.key\)\}/m

        expect(source).not.toMatch(legacyClickableDivPattern)
        expect(source).toMatch(buttonPattern)
    })
})
