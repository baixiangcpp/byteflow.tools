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
        expect(task).toContain("error instanceof WorkerTaskError && (error.code === \"WORKER_TIMEOUT\" || error.code === \"WORKER_ABORTED\")")
        expect(task).toContain("runImageEditDomTask(input)")
        expect(worker).toContain("OffscreenCanvas")
        expect(worker).toContain("createImageBitmap")
        expect(cropper).toContain("runImageEditTask({ operation: \"crop\"")
        expect(filters).toContain("runImageEditTask({ operation: \"filter\"")
        expect(censor).toContain("runImageEditTask({ operation: \"censor\"")
    })

    it("keeps image upload entry points on shared policies with visible status and keyboard access", () => {
        const files = [
            "src/features/tools/image-caption-generator/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/tweet-to-image-converter/page.tsx",
        ]

        for (const file of files) {
            const source = read(file)
            expect(source, file).toContain("FILE_INPUT_POLICIES")
            expect(source, file).toContain("FileUploadStatus")
            expect(source, file).toContain("status=")
            expect(source, file).toContain("progress=")
            expect(source, file).toContain("accept={")
            expect(source, file).not.toContain("MAX_FILE_SIZE")
            expect(source, file).not.toContain('accept="image/*"')
            expect(source, file).not.toContain('file.type.startsWith("image/")')
        }

        const caption = read("src/features/tools/image-caption-generator/page.tsx")
        const resizer = read("src/features/tools/image-resizer/page.tsx")
        const tweet = read("src/features/tools/tweet-to-image-converter/page.tsx")

        expect(caption).toContain('role="button"')
        expect(caption).toContain("onKeyDown")
        expect(caption).toContain("handleCancelUpload")
        expect(caption).toContain("validateImageDimensions")
        expect(resizer).toContain('role="button"')
        expect(resizer).toContain("onKeyDown")
        expect(resizer).toContain("runImageResizeTask({")
        expect(resizer).toContain("cancelProcessing")
        expect(resizer).toContain('setUploadStatus("processing")')
        expect(resizer).toContain("disabled: isProcessing || !outputDataUrl")
        expect(resizer).toContain("onCancel={isProcessing || uploadStatus === \"loading\" ? cancelProcessing : undefined}")
        expect(read("src/features/tools/image-resizer/browser-actions.ts")).toContain("validateImageDimensions")
        expect(tweet).toContain("handleCancelAvatarUpload")
        expect(tweet).toContain('FILE_INPUT_POLICIES["image-logo"]')
        expect(tweet).toContain("validateImageDimensions")
    })

    it("keeps compression and SVG optimization behind worker tasks", () => {
        const compressionTask = read("src/features/tools/gzip-brotli-lab/compression-task.ts")
        const compressionPage = read("src/features/tools/gzip-brotli-lab/page.tsx")
        const svgTask = read("src/features/tools/svg-optimizer/svg-optimize-task.ts")
        const svgPage = read("src/features/tools/svg-optimizer/page.tsx")

        expect(compressionTask).toContain("new Worker(new URL(\"./compression-worker.ts\", import.meta.url)")
        expect(compressionTask).toContain("signal: options.signal")
        expect(compressionTask).toContain("error instanceof WorkerTaskError && (error.code === \"WORKER_TIMEOUT\" || error.code === \"WORKER_ABORTED\")")
        expect(compressionPage).toContain("runCompressionTask")
        expect(compressionPage).not.toContain("runCompressionLab(input")
        expect(svgTask).toContain("new Worker(new URL(\"./svg-optimize-worker.ts\", import.meta.url)")
        expect(svgTask).toContain("signal: options.signal")
        expect(svgTask).toContain("error instanceof WorkerTaskError && (error.code === \"WORKER_TIMEOUT\" || error.code === \"WORKER_ABORTED\")")
        expect(svgPage).toContain("runSvgOptimizeTask")
        expect(svgPage).toContain("sanitizeOptimizedSvg")
    })

    it("keeps scanned PDF preview/export, image resize, and regex work abortable", () => {
        const resizeTask = read("src/features/tools/image-resizer/image-resize-task.ts")
        const scanPage = read("src/features/tools/scanned-pdf-converter/page.tsx")
        const scanTask = read("src/features/tools/scanned-pdf-converter/scan-enhance-task.ts")
        const regexTask = read("src/features/tools/regex-tester/regex-test-task.ts")
        const pipelineAdapters = read("src/features/pipeline/adapter-registry.ts")

        expect(resizeTask).toContain("new Worker(new URL(\"./image-resize-worker.ts\", import.meta.url)")
        expect(resizeTask).toContain("transfer: input.sourceBytes ? [input.sourceBytes] : undefined")
        expect(resizeTask).toContain("error instanceof WorkerTaskError && (error.code === \"WORKER_TIMEOUT\" || error.code === \"WORKER_ABORTED\")")
        expect(scanPage).toContain("exportAbortControllerRef")
        expect(scanPage).toContain("runScanEnhanceTask({")
        expect(scanPage).toContain("signal: controller.signal")
        expect(scanTask).toContain("new Worker(new URL(\"./scan-enhance-worker.ts\", import.meta.url)")
        expect(scanTask).toContain("transfer: input.sourceBytes ? [input.sourceBytes] : undefined")
        expect(scanTask).toContain("error instanceof WorkerTaskError && (error.code === \"WORKER_TIMEOUT\" || error.code === \"WORKER_ABORTED\")")
        expect(regexTask).toContain("new Worker(new URL(\"./regex-test-worker.ts\", import.meta.url)")
        expect(regexTask).toContain("timeoutMs ?? 1_000")
        expect(pipelineAdapters).toContain("import { runRegexTestTask }")
        expect(pipelineAdapters).toContain("const result = await runRegexTestTask(pattern, flags, input")
    })

    it("keeps shared upload status announced with accessible progress", () => {
        const status = read("src/features/tool-shell/file-upload-status.tsx")

        expect(status).toContain('role="status"')
        expect(status).toContain('aria-live="polite"')
        expect(status).toContain('role="progressbar"')
        expect(status).toContain("aria-valuenow={normalizedProgress}")
        expect(status).toContain("onCancel")
    })
})
