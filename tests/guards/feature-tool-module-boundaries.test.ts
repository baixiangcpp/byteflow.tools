import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const FEATURE_TOOLS_DIR = path.join(ROOT, "src/features/tools")
const DEFAULT_PAGE_LINE_LIMIT = 450
const SPLIT_PAGE_LINE_LIMITS: Record<string, number> = {
    "json-formatter": 720,
    "pipeline-builder": 540,
    "password-generator": 500,
    "qr-code-generator": 450,
    "base64-encode-decode": 470,
    "hash-generator": 450,
    "jwt-workbench": 400,
}

const NON_UI_MODULE_NAMES = new Set(["logic.ts", "samples.ts", "types.ts", "constants.ts", "utils.ts", "error-utils.ts"])
const BROWSER_API_PATTERNS = [
    /\bdocument\./,
    /\bwindow\./,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bnew Blob\b/,
    /\bURL\.createObjectURL\b/,
]

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

function featureToolSlugs() {
    return fs
        .readdirSync(FEATURE_TOOLS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
}

function featureFiles(slug: string) {
    const dir = path.join(FEATURE_TOOLS_DIR, slug)
    if (!fs.existsSync(dir)) return []
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && [".ts", ".tsx"].includes(path.extname(entry.name)))
        .map((entry) => path.join("src/features/tools", slug, entry.name))
}

describe("feature tool module boundaries", () => {
    it("keeps feature pages below default or explicit local line budgets", () => {
        const offenders = featureToolSlugs().flatMap((slug) => {
            const maxLines = SPLIT_PAGE_LINE_LIMITS[slug] ?? DEFAULT_PAGE_LINE_LIMIT
            const source = read(`src/features/tools/${slug}/page.tsx`)
            const lineCount = source.split(/\r?\n/).length
            return lineCount > maxLines ? [`${slug}: ${lineCount} > ${maxLines}`] : []
        })

        expect(offenders).toEqual([])
    })

    it("keeps feature-local modules independent from app routes", () => {
        const offenders = featureToolSlugs().flatMap((slug) =>
            featureFiles(slug).filter((file) => {
                const source = read(file)
                return source.includes('from "@/app/') || source.includes("from '@/app/")
            }),
        )

        expect(offenders).toEqual([])
    })

    it("keeps non-UI feature-local modules free of React and client-only UI imports", () => {
        const offenders = featureToolSlugs().flatMap((slug) =>
            featureFiles(slug)
                .filter((file) => NON_UI_MODULE_NAMES.has(path.basename(file)))
                .filter((file) => {
                    const source = read(file)
                    return (
                        source.includes('from "react"') ||
                        source.includes("from 'react'") ||
                        source.includes('from "lucide-react"') ||
                        source.includes("from 'lucide-react'") ||
                        source.includes('from "@/features/tool-shell/') ||
                        source.includes("from '@/features/tool-shell/") ||
                        source.includes('from "@/core/i18n/lang-provider"') ||
                        source.includes("from '@/core/i18n/lang-provider'") ||
                        source.includes('"use client"')
                    )
                }),
        )

        expect(offenders).toEqual([])
    })

    it("keeps pure logic modules free of browser APIs", () => {
        const offenders = featureToolSlugs().flatMap((slug) =>
            featureFiles(slug)
                .filter((file) => path.basename(file) === "logic.ts")
                .filter((file) => {
                    const source = read(file)
                    return BROWSER_API_PATTERNS.some((pattern) => pattern.test(source))
                }),
        )

        expect(offenders).toEqual([])
    })

    it("allows browser actions to own browser APIs without becoming React modules", () => {
        const offenders = featureToolSlugs().flatMap((slug) =>
            featureFiles(slug)
                .filter((file) => path.basename(file) === "browser-actions.ts")
                .filter((file) => {
                    const source = read(file)
                    return (
                        source.includes('from "react"') ||
                        source.includes("from 'react'") ||
                        source.includes('from "lucide-react"') ||
                        source.includes("from 'lucide-react'") ||
                        source.includes('"use client"')
                    )
                }),
        )

        expect(offenders).toEqual([])
    })

    it("keeps feature pages as named client exports", () => {
        const offenders = featureToolSlugs().flatMap((slug) => {
            const source = read(`src/features/tools/${slug}/page.tsx`)
            if (!source.trimStart().startsWith('"use client"')) return [`${slug}: missing use client`]
            if (/export\s+default\s+function\s+Page/.test(source)) return [`${slug}: default Page export`]
            return []
        })

        expect(offenders).toEqual([])
    })
})
