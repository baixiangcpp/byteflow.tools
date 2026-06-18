import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SRC_ROOT = path.join(ROOT, "src")
const TEXT_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/
const WINDOW_OPEN_ALLOWLIST = new Set(["src/core/security/external-url.ts"])

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

function read(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("external URL safety guard", () => {
    it("routes programmatic external tab opens through the shared security helper", () => {
        const offenders = walk(SRC_ROOT)
            .map((file) => path.relative(ROOT, file).replace(/\\/g, "/"))
            .filter((file) => !WINDOW_OPEN_ALLOWLIST.has(file))
            .filter((file) => read(file).includes("window.open("))
            .sort()

        expect(offenders).toEqual([])
    })

    it("keeps explicit new-tab links paired with noopener noreferrer", () => {
        const offenders = walk(SRC_ROOT)
            .map((file) => path.relative(ROOT, file).replace(/\\/g, "/"))
            .filter((file) => {
                const source = read(file)
                const usesBlankTarget = source.includes('target="_blank"') || /target=\{[^}]*"_blank"[^}]*\}/.test(source)
                if (!usesBlankTarget) return false
                return !source.includes('rel="noopener noreferrer"') && !source.includes('"noopener noreferrer"')
            })
            .sort()

        expect(offenders).toEqual([])
    })

    it("keeps external fetch-based downloads behind HTTPS and authorization checks", () => {
        const source = read("src/features/tools/instagram-photo-downloader/page.tsx")
        const utils = read("src/core/utils/instagram-tool-utils.ts")

        expect(source).toContain("canDownloadAuthorizedInstagramMedia(parsed, rightsConfirmed)")
        expect(source).toContain("if (!parsed || !canDownload)")
        expect(source).toContain("fetch(parsed.normalizedUrl)")
        expect(source).toContain("openExternalUrl(parsed.normalizedUrl)")
        expect(utils).toContain('parsed.kind === "direct_image" && parsed.isHttps && hasRightsConfirmed')
    })
})
