import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const FEATURE_TOOLS_DIR = path.join(process.cwd(), "src/features/tools")
const FEATURE_TOOL_ROUTES = fs
    .readdirSync(FEATURE_TOOLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
        const toolSlug = entry.name
        const featurePath = path.join(FEATURE_TOOLS_DIR, toolSlug, "page.tsx")
        const featureSource = fs.existsSync(featurePath) ? fs.readFileSync(featurePath, "utf8") : ""
        const pageExportName = featureSource.match(/export function\s+([A-Za-z0-9_]+)/)?.[1] ?? ""
        return [toolSlug, pageExportName] as const
    })

describe("tool route boundaries", () => {
    it("keeps the app route as a thin wrapper around the feature page", () => {
        const routePath = path.join(process.cwd(), "src/app/[lang]/pipeline-builder/page.tsx")
        const featurePath = path.join(process.cwd(), "src/features/tools/pipeline-builder/page.tsx")
        const routeSource = fs.readFileSync(routePath, "utf8")
        const nonEmptyRouteLines = routeSource
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        expect(fs.existsSync(featurePath)).toBe(true)
        expect(routeSource).toContain('from "@/features/tools/pipeline-builder/page"')
        expect(routeSource).not.toContain('from "@/features/pipeline/')
        expect(nonEmptyRouteLines.length).toBeLessThanOrEqual(5)
    })

    it("keeps the json formatter app route as a thin wrapper around the feature page", () => {
        const routePath = path.join(process.cwd(), "src/app/[lang]/json-formatter/page.tsx")
        const featurePath = path.join(process.cwd(), "src/features/tools/json-formatter/page.tsx")
        const routeSource = fs.readFileSync(routePath, "utf8")
        const featureSource = fs.existsSync(featurePath) ? fs.readFileSync(featurePath, "utf8") : ""
        const nonEmptyRouteLines = routeSource
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        expect(fs.existsSync(featurePath)).toBe(true)
        expect(routeSource).toContain('from "@/features/tools/json-formatter/page"')
        expect(routeSource).not.toContain('from "@/lib/')
        expect(routeSource).not.toContain("pathKey")
        expect(routeSource).not.toContain("getValueAtPath")
        expect(routeSource).not.toContain("updateValueAtPath")
        expect(routeSource).not.toContain("removeValueAtPath")
        expect(routeSource).not.toContain("renameObjectKey")
        expect(nonEmptyRouteLines.length).toBeLessThanOrEqual(6)
        expect(featureSource).toContain("export function JsonFormatterPage")
    })

    it("keeps the structured data visualizer app route as a thin wrapper around the feature page", () => {
        const routePath = path.join(process.cwd(), "src/app/[lang]/structured-data-visualizer/page.tsx")
        const featurePath = path.join(process.cwd(), "src/features/tools/structured-data-visualizer/page.tsx")
        const routeSource = fs.readFileSync(routePath, "utf8")
        const featureSource = fs.existsSync(featurePath) ? fs.readFileSync(featurePath, "utf8") : ""
        const nonEmptyRouteLines = routeSource
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        expect(fs.existsSync(featurePath)).toBe(true)
        expect(routeSource).toContain('from "@/features/tools/structured-data-visualizer/page"')
        expect(routeSource).not.toContain('from "@/lib/')
        expect(routeSource).not.toContain("visualizeStructuredData")
        expect(routeSource).not.toContain("TreeNodeView")
        expect(routeSource).not.toContain("SAMPLE_INPUT")
        expect(routeSource).not.toContain("setInput")
        expect(routeSource).not.toContain("result")
        expect(routeSource).not.toContain("truncated")
        expect(nonEmptyRouteLines.length).toBeLessThanOrEqual(6)
        expect(featureSource).toContain("export function StructuredDataVisualizerPage")
    })

    it("keeps the har viewer sanitizer app route as a thin wrapper around the feature page", () => {
        const routePath = path.join(process.cwd(), "src/app/[lang]/har-viewer-sanitizer/page.tsx")
        const featurePath = path.join(process.cwd(), "src/features/tools/har-viewer-sanitizer/page.tsx")
        const routeSource = fs.readFileSync(routePath, "utf8")
        const featureSource = fs.existsSync(featurePath) ? fs.readFileSync(featurePath, "utf8") : ""
        const nonEmptyRouteLines = routeSource
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        expect(fs.existsSync(featurePath)).toBe(true)
        expect(routeSource).toContain('from "@/features/tools/har-viewer-sanitizer/page"')
        expect(routeSource).not.toContain('from "@/lib/')
        expect(routeSource).not.toContain("sanitizeHar")
        expect(routeSource).not.toContain("parseHar")
        expect(routeSource).not.toContain("SAMPLE_HAR")
        expect(routeSource).not.toContain("setInput")
        expect(routeSource).not.toContain("result")
        expect(routeSource).not.toContain("query")
        expect(routeSource).not.toContain("hash")
        expect(routeSource).not.toContain("redact")
        expect(routeSource).not.toContain("summary")
        expect(nonEmptyRouteLines.length).toBeLessThanOrEqual(6)
        expect(featureSource).toContain("export function HarViewerSanitizerPage")
    })

    it("keeps the yq playground app route as a thin wrapper around the feature page", () => {
        const routePath = path.join(process.cwd(), "src/app/[lang]/yq-playground/page.tsx")
        const featurePath = path.join(process.cwd(), "src/features/tools/yq-playground/page.tsx")
        const routeSource = fs.readFileSync(routePath, "utf8")
        const featureSource = fs.existsSync(featurePath) ? fs.readFileSync(featurePath, "utf8") : ""
        const nonEmptyRouteLines = routeSource
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        expect(fs.existsSync(featurePath)).toBe(true)
        expect(routeSource).toContain('from "@/features/tools/yq-playground/page"')
        expect(routeSource).not.toContain('from "@/lib/')
        expect(routeSource).not.toContain("runYqQuery")
        expect(routeSource).not.toContain("evaluateYqExpression")
        expect(routeSource).not.toContain("SAMPLE_INPUT")
        expect(routeSource).not.toContain("setInput")
        expect(routeSource).not.toContain("query")
        expect(routeSource).not.toContain("result")
        expect(routeSource).not.toContain("yaml")
        expect(routeSource).not.toContain("json")
        expect(routeSource).not.toContain("subset")
        expect(nonEmptyRouteLines.length).toBeLessThanOrEqual(6)
        expect(featureSource).toContain("export function YqPlaygroundPage")
    })

    it.each(FEATURE_TOOL_ROUTES)("keeps the %s app route as a thin wrapper around the feature page", (toolSlug, pageExportName) => {
        const routePath = path.join(process.cwd(), `src/app/[lang]/${toolSlug}/page.tsx`)
        const featurePath = path.join(process.cwd(), `src/features/tools/${toolSlug}/page.tsx`)
        const routeSource = fs.readFileSync(routePath, "utf8")
        const featureSource = fs.existsSync(featurePath) ? fs.readFileSync(featurePath, "utf8") : ""
        const nonEmptyRouteLines = routeSource
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        expect(fs.existsSync(featurePath)).toBe(true)
        expect(pageExportName).not.toBe("")
        expect(nonEmptyRouteLines[0]).toBe('"use client"')
        expect(routeSource).toContain(`from "@/features/tools/${toolSlug}/page"`)
        expect(routeSource).not.toContain('from "@/lib/')
        expect(nonEmptyRouteLines.length).toBeLessThanOrEqual(6)
        expect(featureSource.trimStart().startsWith('"use client"')).toBe(true)
        expect(featureSource).toContain(`export function ${pageExportName}`)
    })
})
