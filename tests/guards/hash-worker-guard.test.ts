import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("hash worker guard", () => {
    it("keeps hash generation routed through the worker task", () => {
        const pageSource = read("src/features/tools/hash-generator/page.tsx")
        const constantsSource = read("src/features/tools/hash-generator/constants.ts")
        const hookSource = read("src/features/tools/hash-generator/use-hash-task.ts")
        const taskSource = read("src/features/tools/hash-generator/hash-task.ts")
        const workerSource = read("src/features/tools/hash-generator/hash-worker.ts")

        expect(pageSource).toContain("useHashTask(hashTaskInput)")
        expect(pageSource).toContain("file.size > MAX_HASH_FILE_SIZE")
        expect(pageSource).not.toContain("hashText(")
        expect(pageSource).not.toContain("hashBytes(")
        expect(pageSource).not.toContain("hashHmac(")
        expect(constantsSource).toContain("export const MAX_HASH_FILE_SIZE = 50 * 1024 * 1024")
        expect(hookSource).toContain("runHashTask(input, { signal: controller.signal })")
        expect(hookSource).toContain("taskRequestIdRef")
        expect(hookSource).toContain("taskAbortControllerRef")
        expect(hookSource).toContain("controller.abort()")
        expect(taskSource).toContain("new Worker(new URL(\"./hash-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("signal: options.signal")
        expect(taskSource).toContain("transfer: input.mode === \"file\" ? [input.bytes.buffer] : undefined")
        expect(taskSource).toContain("runHashTaskSync(input)")
        expect(workerSource).toContain("runHashTaskSync(event.data)")
    })
})
