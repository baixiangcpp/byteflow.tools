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
})
