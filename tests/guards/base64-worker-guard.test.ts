import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("base64 worker guard", () => {
    it("keeps text encode and decode routed through the worker task", () => {
        const pageSource = read("src/features/tools/base64-encode-decode/page.tsx")
        const hookSource = read("src/features/tools/base64-encode-decode/use-base64-text-task.ts")
        const taskSource = read("src/features/tools/base64-encode-decode/base64-task.ts")
        const workerSource = read("src/features/tools/base64-encode-decode/base64-worker.ts")

        expect(pageSource).toContain("useBase64TextTask()")
        expect(pageSource).toContain("runTextTask({")
        expect(hookSource).toContain("runBase64TextTask({ input, operation, urlSafe })")
        expect(hookSource).toContain("taskRequestIdRef")
        expect(taskSource).toContain("new Worker(new URL(\"./base64-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("runBase64TextTaskSync(input)")
        expect(workerSource).toContain("encodeTextToBase64(input, urlSafe)")
        expect(workerSource).toContain("decodeBase64ToText(input.trim(), urlSafe)")
    })
})
