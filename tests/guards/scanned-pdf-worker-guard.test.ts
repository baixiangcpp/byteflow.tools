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
        const taskSource = read("src/features/tools/scanned-pdf-converter/scan-enhance-task.ts")
        const workerSource = read("src/features/tools/scanned-pdf-converter/scan-enhance-worker.ts")
        const domSource = read("src/features/tools/scanned-pdf-converter/scan-enhance-dom.ts")

        expect(pageSource).toContain("runScanEnhanceTask({")
        expect(pageSource).toContain("previewRequestIdRef")
        expect(pageSource).not.toContain("function enhanceImageForScan")
        expect(taskSource).toContain("new Worker(new URL(\"./scan-enhance-worker.ts\", import.meta.url)")
        expect(taskSource).toContain("OffscreenCanvas")
        expect(taskSource).toContain("enhanceScanDataUrlDom(input)")
        expect(workerSource).toContain("new OffscreenCanvas")
        expect(workerSource).toContain("canvas.convertToBlob")
        expect(domSource).toContain('document.createElement("canvas")')
    })
})
