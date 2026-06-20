import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

const SENSITIVE_AUDIT_TOOLS = [
    "jwt-decoder",
    "log-scrubber",
    "har-viewer-sanitizer",
    "certificate-decoder",
] as const

const FORBIDDEN_FEATURE_PATTERNS = [
    { label: "localStorage", pattern: /\blocalStorage\b/ },
    { label: "sessionStorage", pattern: /\bsessionStorage\b/ },
    { label: "IndexedDB", pattern: /\bindexedDB\b|\bIDB[A-Z]\w*/ },
    { label: "CacheStorage", pattern: /\bcaches\b|\bCacheStorage\b/ },
    { label: "payload handoff", pattern: /\bbuildToolHandoffLink\b/ },
    { label: "console output", pattern: /\bconsole\.(log|debug|info|warn|error)\s*\(/ },
]

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

function toolSourceFiles(slug: string) {
    const dir = path.join(ROOT, "src/features/tools", slug)
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && [".ts", ".tsx"].includes(path.extname(entry.name)))
        .map((entry) => path.join("src/features/tools", slug, entry.name))
}

function sourceFilesUnder(relativeDir: string): string[] {
    const absoluteDir = path.join(ROOT, relativeDir)
    return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
        const relativePath = path.join(relativeDir, entry.name)
        if (entry.isDirectory()) return sourceFilesUnder(relativePath)
        if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) return [relativePath]
        return []
    })
}

describe("sensitive storage audit", () => {
    it("keeps sampled sensitive tools away from persistent storage, payload handoff, and console output", () => {
        const offenders = SENSITIVE_AUDIT_TOOLS.flatMap((slug) =>
            toolSourceFiles(slug).flatMap((file) => {
                const source = read(file)
                return FORBIDDEN_FEATURE_PATTERNS
                    .filter(({ pattern }) => pattern.test(source))
                    .map(({ label }) => `${file}: ${label}`)
            }),
        )

        expect(offenders).toEqual([])
    })

    it("uses sensitive handoff for sensitive tools that still expose cross-tool navigation", () => {
        const jsonFormatter = read("src/features/tools/json-formatter/page.tsx")
        const yamlJsonConverter = read("src/features/tools/yaml-json-converter/page.tsx")
        const logScrubber = read("src/features/tools/log-scrubber/page.tsx")

        expect(jsonFormatter).toContain("buildSensitiveToolHandoffLink")
        expect(jsonFormatter).not.toContain("buildToolHandoffLink")
        expect(yamlJsonConverter).toContain("buildSensitiveToolHandoffLink")
        expect(yamlJsonConverter).not.toContain("buildToolHandoffLink")
        expect(logScrubber).toContain("buildSensitiveToolHandoffLink")
        expect(logScrubber).not.toContain("buildToolHandoffLink")
    })

    it("keeps analytics runtime hooks as no-ops and avoids forbidden payload parameter names", () => {
        const analytics = read("src/core/analytics/analytics.ts")
        expect(analytics).toContain("export const isAnalyticsEnabled = (): boolean => false")
        expect(analytics).toContain("export const trackToolUsage: TrackToolUsage = noop")
        expect(analytics).toContain("export const trackEvent: TrackEvent = noop")

        const callSites = sourceFilesUnder("src")
            .filter((file) => read(file).includes("track"))

        const forbiddenParamNames = /\b(input|output|payload|token|jwt|secret|url|filename|fileContent|query|pagePath|page_path)\b/
        const offenders = callSites.flatMap((file) => {
            const source = read(file)
            const calls = source.match(/track[A-Z]\w*\([\s\S]*?\)/g) ?? []
            return calls
                .filter((call) => forbiddenParamNames.test(call))
                .map(() => file)
        })

        expect([...new Set(offenders)]).toEqual([])
    })

    it("keeps generated passwords out of saved local presets", () => {
        const passwordPage = read("src/features/tools/password-generator/page.tsx")
        const handleSavePreset = passwordPage.match(/const handleSavePreset = \(\) => \{[\s\S]*?\n    \}/)?.[0] ?? ""

        expect(handleSavePreset).toContain("customPreset")
        expect(handleSavePreset).not.toContain("results")
        expect(handleSavePreset).not.toContain("safeClipboardWrite")
    })

    it("keeps CacheStorage away from non-GET, third-party, and sensitive query requests", () => {
        const serviceWorker = read("public/sw.js")

        expect(serviceWorker).toContain("if (event.request.method !== 'GET') return;")
        expect(serviceWorker).toContain("if (url.origin !== self.location.origin) return;")
        expect(serviceWorker).toContain("if (hasSensitiveQuery(url)) return;")
        expect(serviceWorker).toContain("'handoff'")
        expect(serviceWorker).toContain("'handoff_ref'")
        expect(serviceWorker).toContain("'payload'")
        expect(serviceWorker).toContain("'token'")
        expect(serviceWorker).toContain("'secret'")
    })
})
