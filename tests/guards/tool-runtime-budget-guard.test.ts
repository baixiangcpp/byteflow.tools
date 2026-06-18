import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { TOOL_RUNTIME_BUDGETS } from "@/core/performance/tool-runtime-budgets"

const ROOT = process.cwd()
const HIGH_RISK_TOOL_PAGES = [
    "src/features/tools/csv-json-converter/page.tsx",
    "src/features/tools/csv-diff/page.tsx",
    "src/features/tools/json-diff-viewer/page.tsx",
    "src/features/tools/text-diff-checker/page.tsx",
    "src/features/tools/openapi-viewer/page.tsx",
    "src/features/tools/openapi-mock/page.tsx",
]

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("tool runtime budget guard", () => {
    it("keeps high-risk parser and diff tools on centralized runtime budgets", () => {
        const offenders = HIGH_RISK_TOOL_PAGES.filter((file) => {
            const source = read(file)
            return (
                !source.includes("@/core/performance/tool-runtime-budgets") ||
                !source.includes("TOOL_RUNTIME_BUDGETS") ||
                !source.includes("isOverUtf8Budget") ||
                !source.includes("local_input_too_large")
            )
        })

        expect(offenders).toEqual([])
    })

    it("documents explicit byte, row, endpoint, and node budgets", () => {
        expect(TOOL_RUNTIME_BUDGETS.maxCsvJsonInputBytes).toBe(1024 * 1024)
        expect(TOOL_RUNTIME_BUDGETS.maxCsvJsonRows).toBe(5000)
        expect(TOOL_RUNTIME_BUDGETS.maxDiffInputBytes).toBe(512 * 1024)
        expect(TOOL_RUNTIME_BUDGETS.maxDiffRows).toBe(5000)
        expect(TOOL_RUNTIME_BUDGETS.maxJsonDiffFlattenedNodes).toBe(10000)
        expect(TOOL_RUNTIME_BUDGETS.maxOpenApiSpecBytes).toBe(1024 * 1024)
        expect(TOOL_RUNTIME_BUDGETS.maxOpenApiEndpoints).toBe(500)
        expect(TOOL_RUNTIME_BUDGETS.maxOpenApiMockEndpoints).toBe(300)
        expect(TOOL_RUNTIME_BUDGETS.maxOpenApiMockSchemaProperties).toBe(2000)
    })
})
