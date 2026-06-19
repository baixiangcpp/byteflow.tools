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
        const hookSource = read("src/features/tools/hash-generator/use-hash-task.ts")
        const taskSource = read("src/features/tools/hash-generator/hash-task.ts")
        const workerSource = read("src/features/tools/hash-generator/hash-worker.ts")

        expect(pageSource).toContain("useHashTask(hashTaskInput)")
        expect(pageSource).not.toContain("hashText(")
        expect(pageSource).not.toContain("hashBytes(")
        expect(pageSource).not.toContain("hashHmac(")
        expect(hookSource).toContain("runHashTask(input)")
        expect(hookSource).toContain("taskRequestIdRef")
        expect(taskSource).toContain("new Worker(new URL(\"./hash-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("runHashTaskSync(input)")
        expect(workerSource).toContain("runHashTaskSync(event.data)")
    })
})
