import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("json formatter worker guard", () => {
    it("keeps format and minify actions routed through the worker task", () => {
        const pageSource = read("src/features/tools/json-formatter/page.tsx")
        const taskSource = read("src/features/tools/json-formatter/format-json-task.ts")
        const workerSource = read("src/features/tools/json-formatter/json-format-worker.ts")

        expect(pageSource).toContain("runJsonFormatTask(source, mode, { signal: controller.signal })")
        expect(pageSource).toContain("formatRequestIdRef")
        expect(pageSource).toContain("formatAbortControllerRef")
        expect(taskSource).toContain("new Worker(new URL(\"./json-format-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("signal: options.signal")
        expect(taskSource).toContain("formatJsonSync(source, mode)")
        expect(taskSource).toContain("isJsonParseWorkerError")
        expect(workerSource).toContain("JSON.parse(source)")
        expect(workerSource).toContain("code: \"JSON_PARSE_FAILED\"")
        expect(workerSource).toContain("JSON.stringify(parsed, null, 2)")
    })

    it("keeps large-input UX and error detail affordances visible", () => {
        const pageSource = read("src/features/tools/json-formatter/page.tsx")
        const panelSource = read("src/features/tools/json-formatter/panels.tsx")
        const treeSource = read("src/features/tools/json-formatter/components.tsx")

        expect(pageSource).toContain("buildJsonParseErrorDetails")
        expect(pageSource).toContain("errorDetails")
        expect(panelSource).toContain("large_input_hint")
        expect(panelSource).toContain("output_empty")
        expect(panelSource).toContain("details.snippet")
        expect(treeSource).toContain("maxVisibleChildren = 200")
        expect(treeSource).toContain("tree_lazy_limit")
    })
})
