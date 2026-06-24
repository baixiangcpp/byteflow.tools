import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("BF-025/BF-031/BF-035 heavy local processing safeguards", () => {
    it("routes shared image crop/filter/censor work through a worker with abortable fallback", () => {
        const task = read("src/features/tool-processing/image-edit-task.ts")
        const worker = read("src/features/tool-processing/image-edit-worker.ts")
        const cropper = read("src/features/tools/image-cropper/page.tsx")
        const filters = read("src/features/tools/image-filters/page.tsx")
        const censor = read("src/features/tools/photo-censor/page.tsx")

        expect(task).toContain("new Worker(new URL(\"./image-edit-worker.ts\", import.meta.url)")
        expect(task).toContain("signal: options.signal")
        expect(task).toContain("timeoutMs: options.timeoutMs ?? 20_000")
        expect(task).toContain("runImageEditDomTask(input)")
        expect(worker).toContain("OffscreenCanvas")
        expect(worker).toContain("createImageBitmap")
        expect(cropper).toContain("runImageEditTask({ operation: \"crop\"")
        expect(filters).toContain("runImageEditTask({ operation: \"filter\"")
        expect(censor).toContain("runImageEditTask({ operation: \"censor\"")
    })

    it("keeps compression and SVG optimization behind worker tasks", () => {
        const compressionTask = read("src/features/tools/gzip-brotli-lab/compression-task.ts")
        const compressionPage = read("src/features/tools/gzip-brotli-lab/page.tsx")
        const svgTask = read("src/features/tools/svg-optimizer/svg-optimize-task.ts")
        const svgPage = read("src/features/tools/svg-optimizer/page.tsx")

        expect(compressionTask).toContain("new Worker(new URL(\"./compression-worker.ts\", import.meta.url)")
        expect(compressionTask).toContain("signal: options.signal")
        expect(compressionPage).toContain("runCompressionTask")
        expect(compressionPage).not.toContain("runCompressionLab(input")
        expect(svgTask).toContain("new Worker(new URL(\"./svg-optimize-worker.ts\", import.meta.url)")
        expect(svgTask).toContain("signal: options.signal")
        expect(svgPage).toContain("runSvgOptimizeTask")
        expect(svgPage).toContain("sanitizeOptimizedSvg")
    })

    it("keeps scanned PDF preview/export and regex work abortable", () => {
        const scanPage = read("src/features/tools/scanned-pdf-converter/page.tsx")
        const scanTask = read("src/features/tools/scanned-pdf-converter/scan-enhance-task.ts")
        const regexTask = read("src/features/tools/regex-tester/regex-test-task.ts")

        expect(scanPage).toContain("exportAbortControllerRef")
        expect(scanPage).toContain("runScanEnhanceTask({")
        expect(scanPage).toContain("signal: controller.signal")
        expect(scanTask).toContain("new Worker(new URL(\"./scan-enhance-worker.ts\", import.meta.url)")
        expect(scanTask).toContain("transfer: input.sourceBytes ? [input.sourceBytes] : undefined")
        expect(regexTask).toContain("new Worker(new URL(\"./regex-test-worker.ts\", import.meta.url)")
        expect(regexTask).toContain("timeoutMs ?? 1_000")
    })
})
