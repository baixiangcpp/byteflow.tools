import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("worker runtime hardening", () => {
    it("keeps cancellation, transfer, messageerror, and sync error handling in the shared worker task runner", () => {
        const source = read("src/core/workers/run-worker-task.ts")

        expect(source).toContain("signal?: AbortSignal")
        expect(source).toContain("transfer?: Transferable[]")
        expect(source).toContain("WORKER_ABORTED")
        expect(source).toContain("WORKER_CREATE_FAILED")
        expect(source).toContain("WORKER_POST_MESSAGE_FAILED")
        expect(source).toContain("worker.onmessageerror")
        expect(source).toContain("worker.postMessage(input, options.transfer ?? [])")
    })
})
