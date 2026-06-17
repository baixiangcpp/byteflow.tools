import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import type { ToolMeta } from "@/core/registry/types"

const ROOT = process.cwd()
const FEATURE_TOOLS_DIR = path.join(ROOT, "src/features/tools")
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])
const EXECUTABLE_NETWORK_PATTERNS = [
    /\bfetch\s*\(/,
    /\bwindow\.open\s*\(/,
    /\bnavigator\.sendBeacon\s*\(/,
]
const EXTERNAL_TARGET_PATTERNS = [
    /\btarget\s*=\s*["']_blank["']/,
    /\.\s*target\s*=\s*["']_blank["']/,
]

function walkFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return []

    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) return walkFiles(fullPath)
        if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name))) return []
        if (entry.name === "manifest.ts") return []
        return [fullPath]
    })
}

function stripCommentsAndStrings(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/.*$/gm, " ")
        .replace(/`(?:\\.|[^`\\])*`/g, "\"\"")
        .replace(/"((?:\\.|[^"\\])*)"/g, "\"\"")
        .replace(/'((?:\\.|[^'\\])*)'/g, "''")
}

function hasNetworkBehavior(source: string): boolean {
    const executableSource = stripCommentsAndStrings(source)
    return (
        EXECUTABLE_NETWORK_PATTERNS.some((pattern) => pattern.test(executableSource)) ||
        EXTERNAL_TARGET_PATTERNS.some((pattern) => pattern.test(source))
    )
}

describe("tool network access metadata", () => {
    it("requires explicit metadata for tools with browser network behavior", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const manifestBySlug = new Map(tools.map((tool) => [tool.slug, tool]))
        const offenders = [...manifestBySlug.values()].flatMap((tool) => {
            const files = walkFiles(path.join(FEATURE_TOOLS_DIR, tool.slug))
            const hasNetwork = files.some((file) => hasNetworkBehavior(fs.readFileSync(file, "utf8")))
            return hasNetwork && !tool.networkAccess ? [`${tool.slug}: missing networkAccess`] : []
        })

        expect(offenders).toEqual([])
    })

    it("does not mark network-free tools as requiring external access", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const manifestBySlug = new Map(tools.map((tool) => [tool.slug, tool]))
        const offenders = [...manifestBySlug.values()].flatMap((tool) => {
            if (!tool.networkAccess || tool.networkAccess === "none") return []
            const files = walkFiles(path.join(FEATURE_TOOLS_DIR, tool.slug))
            const hasNetwork = files.some((file) => hasNetworkBehavior(fs.readFileSync(file, "utf8")))
            return hasNetwork ? [] : [`${tool.slug}: declares ${tool.networkAccess} but no guarded network behavior was found`]
        })

        expect(offenders).toEqual([])
    })
})
