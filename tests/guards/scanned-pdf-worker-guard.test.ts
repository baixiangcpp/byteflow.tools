import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("scanned pdf worker guard", () => {
    it("keeps scan enhancement routed through the worker task with a DOM fallback", () => {
        const pageSource = read("src/features/tools/scanned-pdf-converter/page.tsx")
        const browserActionsSource = read("src/features/tools/scanned-pdf-converter/browser-actions.ts")
        const taskSource = read("src/features/tools/scanned-pdf-converter/scan-enhance-task.ts")
        const workerSource = read("src/features/tools/scanned-pdf-converter/scan-enhance-worker.ts")
        const domSource = read("src/features/tools/scanned-pdf-converter/scan-enhance-dom.ts")

        expect(pageSource).toContain("runScanEnhanceTask({")
        expect(pageSource).toContain("loadScanImageFile(file)")
        expect(pageSource).toContain("downloadPdfBytes(new Uint8Array(await pdf.save()), \"scanned-document.pdf\")")
        expect(pageSource).toContain("sourceBytes: selectedPage.bytes?.slice(0)")
        expect(pageSource).toContain("sourceBytes: page.bytes?.slice(0)")
        expect(pageSource).not.toContain("URL.createObjectURL(file)")
        expect(pageSource).not.toContain("file.arrayBuffer()")
        expect(pageSource).not.toContain("fileToDataUrl")
        expect(pageSource).not.toContain("dataUrlToUint8Array")
        expect(browserActionsSource).toContain("file.arrayBuffer()")
        expect(browserActionsSource).toContain("URL.createObjectURL(file)")
        expect(browserActionsSource).toContain("URL.createObjectURL(blob)")
        expect(pageSource).toContain("previewRequestIdRef")
        expect(pageSource).toContain("previewAbortControllerRef")
        expect(pageSource).toContain("controller.abort()")
        expect(pageSource).not.toContain("function enhanceImageForScan")
        expect(taskSource).toContain("new Worker(new URL(\"./scan-enhance-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("signal: options.signal")
        expect(taskSource).toContain("transfer: input.sourceBytes ? [input.sourceBytes] : undefined")
        expect(taskSource).toContain("OffscreenCanvas")
        expect(taskSource).toContain("enhanceScanDataUrlDom(input)")
        expect(workerSource).toContain("input.sourceBytes")
        expect(workerSource).toContain("postWorkerMessage({ ok: true, value: result }, [result.bytes])")
        expect(workerSource).toContain("new OffscreenCanvas")
        expect(workerSource).toContain("canvas.convertToBlob")
        expect(domSource).toContain('document.createElement("canvas")')
    })
})
