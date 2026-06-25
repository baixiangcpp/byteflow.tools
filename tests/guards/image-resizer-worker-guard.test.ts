import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("image resizer worker guard", () => {
    it("keeps resize rendering behind the worker task with a DOM fallback", () => {
        const pageSource = read("src/features/tools/image-resizer/page.tsx")
        const browserActionsSource = read("src/features/tools/image-resizer/browser-actions.ts")
        const taskSource = read("src/features/tools/image-resizer/image-resize-task.ts")
        const workerSource = read("src/features/tools/image-resizer/image-resize-worker.ts")
        const domSource = read("src/features/tools/image-resizer/image-resize-dom.ts")

        expect(pageSource).toContain("runImageResizeTask({")
        expect(pageSource).toContain("loadResizeImageFile(file)")
        expect(pageSource).toContain("replaceObjectUrl(imageObjectUrlRef")
        expect(pageSource).toContain("sourceBytes: imageBytes?.slice(0)")
        expect(pageSource).not.toContain("URL.createObjectURL(file)")
        expect(pageSource).not.toContain("file.arrayBuffer()")
        expect(pageSource).not.toContain("fileToDataUrl")
        expect(browserActionsSource).toContain('readArrayBufferWithPolicy(file, FILE_INPUT_POLICIES["image-standard"])')
        expect(browserActionsSource).toContain("URL.createObjectURL(file)")
        expect(pageSource).toContain("renderRequestIdRef")
        expect(pageSource).toContain("renderAbortControllerRef")
        expect(pageSource).toContain("controller.abort()")
        expect(pageSource).toContain("cancelProcessing")
        expect(pageSource).toContain("FileUploadStatus")
        expect(browserActionsSource).toContain("validateImageDimensions")
        expect(pageSource).toContain("disabled: isProcessing || !outputDataUrl")
        expect(pageSource).not.toContain('document.createElement("canvas")')
        expect(taskSource).toContain("new Worker(new URL(\"./image-resize-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("signal: options.signal")
        expect(taskSource).toContain("transfer: input.sourceBytes ? [input.sourceBytes] : undefined")
        expect(taskSource).toContain("OffscreenCanvas")
        expect(taskSource).toContain("renderImageResizeDataUrlDom(input)")
        expect(workerSource).toContain("input.sourceBytes")
        expect(workerSource).toContain("postWorkerMessage({ ok: true, value: result }, [result.bytes])")
        expect(workerSource).toContain("new OffscreenCanvas")
        expect(workerSource).toContain("canvas.convertToBlob")
        expect(domSource).toContain('document.createElement("canvas")')
    })
})
