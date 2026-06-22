import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("base64 worker guard", () => {
    it("keeps text and file encode/decode routed through worker tasks", () => {
        const pageSource = read("src/features/tools/base64-encode-decode/page.tsx")
        const hookSource = read("src/features/tools/base64-encode-decode/use-base64-text-task.ts")
        const fileHookSource = read("src/features/tools/base64-encode-decode/use-base64-file-task.ts")
        const taskSource = read("src/features/tools/base64-encode-decode/base64-task.ts")
        const workerSource = read("src/features/tools/base64-encode-decode/base64-worker.ts")

        expect(pageSource).toContain("useBase64TextTask()")
        expect(pageSource).toContain("useBase64FileTask()")
        expect(pageSource).toContain("runTextTask({")
        expect(pageSource).toContain("runEncodeFileTask({")
        expect(pageSource).toContain("runDecodeFileTask({")
        expect(pageSource).toContain("mode === \"file\" ? \"\" : output || input")
        expect(pageSource).toContain("isBusy = isProcessing || isFileProcessing")
        expect(pageSource).toContain("file_processing")
        expect(pageSource).toContain("file_mode_hint")
        expect(pageSource).not.toContain("encodeBytesToBase64")
        expect(pageSource).not.toContain("decodeBase64ToBytes")
        expect(hookSource).toContain("runBase64TextTask({ input, operation, urlSafe }, { signal: controller.signal })")
        expect(hookSource).toContain("taskRequestIdRef")
        expect(hookSource).toContain("taskAbortControllerRef")
        expect(hookSource).toContain("taskAbortControllerRef.current?.abort()")
        expect(fileHookSource).toContain("runBase64FileTask({")
        expect(fileHookSource).toContain("readArrayBufferWithPolicy(file, filePolicy)")
        expect(fileHookSource).toContain("fileTaskAbortControllerRef.current?.abort()")
        expect(fileHookSource).toContain("fileTaskRequestIdRef")
        expect(taskSource).toContain("new Worker(new URL(\"./base64-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("signal: options.signal")
        expect(taskSource).toContain("transfer: input.operation === \"encode\" ? [input.bytes] : undefined")
        expect(taskSource).toContain("runBase64FileTaskSync(input)")
        expect(taskSource).toContain("runBase64TextTaskSync(input)")
        expect(workerSource).toContain("encodeTextToBase64(input, urlSafe)")
        expect(workerSource).toContain("decodeBase64ToText(input.trim(), urlSafe)")
        expect(workerSource).toContain("encodeBytesToBase64(new Uint8Array(input.bytes), input.urlSafe)")
        expect(workerSource).toContain("decodeBase64ToBytes(input.input.trim(), input.urlSafe)")
    })
})
