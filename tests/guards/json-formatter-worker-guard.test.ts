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
        expect(workerSource).toContain("JSON.parse(source)")
        expect(workerSource).toContain("JSON.stringify(parsed, null, 2)")
    })
})
