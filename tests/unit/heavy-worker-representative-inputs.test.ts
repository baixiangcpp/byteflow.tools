import { afterEach, describe, expect, it, vi } from "vitest"
import { runRecipe } from "@/features/pipeline/executor"
import { DEFAULT_RECIPE_SETTINGS, type RecipeDocument } from "@/features/pipeline/recipe-types"
import { runImageEditTask } from "@/features/tool-processing/image-edit-task"
import { runCompressionTask } from "@/features/tools/gzip-brotli-lab/compression-task"
import { runImageResizeTask } from "@/features/tools/image-resizer/image-resize-task"
import { runScanEnhanceTask } from "@/features/tools/scanned-pdf-converter/scan-enhance-task"
import { runSvgOptimizeTask } from "@/features/tools/svg-optimizer/svg-optimize-task"

const fallbackMocks = vi.hoisted(() => ({
    enhanceScanDataUrlDom: vi.fn(async () => ({ dataUrl: "data:image/jpeg;base64,dom", width: 10, height: 10 })),
    optimizeSvg: vi.fn((svg: string) => svg),
    renderImageResizeDataUrlDom: vi.fn(async () => ({
        dataUrl: "data:image/png;base64,dom",
        sourceWidth: 10,
        sourceHeight: 10,
        outputWidth: 10,
        outputHeight: 10,
    })),
    runCompressionLab: vi.fn(async () => ({
        output: "fallback",
        inputBytes: 0,
        outputBytes: 0,
        ratio: 0,
    })),
    runImageEditDomTask: vi.fn(async () => ({
        dataUrl: "data:image/png;base64,dom",
        width: 10,
        height: 10,
        metadata: "DOM fallback",
    })),
}))

vi.mock("@/features/tool-processing/image-edit-dom", () => ({
    runImageEditDomTask: fallbackMocks.runImageEditDomTask,
}))

vi.mock("@/features/tools/gzip-brotli-lab/utils", () => ({
    runCompressionLab: fallbackMocks.runCompressionLab,
}))

vi.mock("@/features/tools/image-resizer/image-resize-dom", () => ({
    renderImageResizeDataUrlDom: fallbackMocks.renderImageResizeDataUrlDom,
}))

vi.mock("@/features/tools/scanned-pdf-converter/scan-enhance-dom", () => ({
    enhanceScanDataUrlDom: fallbackMocks.enhanceScanDataUrlDom,
}))

vi.mock("@/features/tools/svg-optimizer/logic", () => ({
    optimizeSvg: fallbackMocks.optimizeSvg,
}))

class CapturingWorker {
    static lastInput: unknown
    static lastTransfer: Transferable[] | undefined
    static mode: "success" | "idle" = "success"
    static response: unknown
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage(input: unknown, transfer?: Transferable[]) {
        CapturingWorker.lastInput = input
        CapturingWorker.lastTransfer = transfer
        if (CapturingWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            this.onmessage?.({
                data: { ok: true, value: CapturingWorker.response },
            } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

function useWorker(response: unknown, mode: "success" | "idle" = "success") {
    CapturingWorker.lastInput = undefined
    CapturingWorker.lastTransfer = undefined
    CapturingWorker.mode = mode
    CapturingWorker.response = response
    vi.stubGlobal("Worker", CapturingWorker)
}

function useCanvasWorkerSupport() {
    vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
    vi.stubGlobal("createImageBitmap", vi.fn())
}

function largeText(line = "request_id=abc123 level=info message=cache_miss path=/api/users\n") {
    return line.repeat(Math.ceil((300 * 1024) / line.length))
}

function regexRecipe(): RecipeDocument {
    return {
        schemaVersion: 1,
        id: "recipe_regex_worker",
        name: "Regex worker recipe",
        createdAt: "2026-06-25T00:00:00.000Z",
        updatedAt: "2026-06-25T00:00:00.000Z",
        steps: [{
            id: "regex",
            toolKey: "regex_tester",
            adapterVersion: 1,
            inputMode: "previous_output",
            options: { pattern: "([A-Z][a-z]+)(\\d)", flags: "g", maxMatches: 10 },
        }],
        edges: [],
        settings: { ...DEFAULT_RECIPE_SETTINGS },
    }
}

describe("BF-035 heavy worker representative inputs", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
        vi.clearAllMocks()
        CapturingWorker.lastInput = undefined
        CapturingWorker.lastTransfer = undefined
        CapturingWorker.mode = "success"
        CapturingWorker.response = undefined
    })

    it("routes representative compression and SVG payloads through workers", async () => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg">${"<path d=\"M0 0h10v10z\" fill=\"#123456\"/>".repeat(9_000)}</svg>`

        useWorker({ optimized: "<svg/>" })
        await expect(runSvgOptimizeTask({ svg })).resolves.toEqual({ optimized: "<svg/>" })
        expect((CapturingWorker.lastInput as { svg: string }).svg.length).toBeGreaterThan(256 * 1024)
        expect(fallbackMocks.optimizeSvg).not.toHaveBeenCalled()

        const input = largeText()
        useWorker({ output: "H4sIAAAAA", inputBytes: input.length, outputBytes: 128, ratio: 128 / input.length })
        await expect(runCompressionTask({
            input,
            mode: "compress",
            format: "gzip",
            inputEncoding: "text",
            outputEncoding: "base64",
        })).resolves.toMatchObject({ output: "H4sIAAAAA" })
        expect((CapturingWorker.lastInput as { input: string }).input.length).toBeGreaterThan(256 * 1024)
        expect(fallbackMocks.runCompressionLab).not.toHaveBeenCalled()
    })

    it("routes representative image buffers through workers with transfer lists", async () => {
        useCanvasWorkerSupport()

        const resizeBytes = new ArrayBuffer(4 * 1024 * 1024)
        useWorker({
            mime: "image/png",
            bytes: new Uint8Array([1, 2, 3]).buffer,
            sourceWidth: 4096,
            sourceHeight: 2160,
            outputWidth: 1280,
            outputHeight: 720,
        })
        await expect(runImageResizeTask({
            source: "data:image/png;base64,AAAA",
            sourceBytes: resizeBytes,
            sourceMime: "image/png",
            targetWidth: 1280,
            targetHeight: 720,
            fitMode: "contain",
            format: "png",
            quality: 0.9,
        })).resolves.toMatchObject({ sourceWidth: 4096, outputWidth: 1280 })
        expect(CapturingWorker.lastTransfer).toEqual([resizeBytes])
        expect(fallbackMocks.renderImageResizeDataUrlDom).not.toHaveBeenCalled()

        const scanBytes = new ArrayBuffer(4 * 1024 * 1024)
        useWorker({
            mime: "image/jpeg",
            bytes: new Uint8Array([4, 5, 6]).buffer,
            width: 2480,
            height: 3508,
        })
        await expect(runScanEnhanceTask({
            source: "data:image/jpeg;base64,AAAA",
            sourceBytes: scanBytes,
            sourceMime: "image/jpeg",
            enhance: {
                brightness: 108,
                contrast: 126,
                grayscale: 100,
                thresholdEnabled: true,
                threshold: 160,
            },
        })).resolves.toMatchObject({ width: 2480, height: 3508 })
        expect(CapturingWorker.lastTransfer).toEqual([scanBytes])
        expect(fallbackMocks.enhanceScanDataUrlDom).not.toHaveBeenCalled()

        const dataUrl = `data:image/png;base64,${"A".repeat(300 * 1024)}`
        useWorker({
            dataUrl: "data:image/png;base64,worker",
            width: 980,
            height: 552,
            metadata: "Cropped 980x552",
        })
        await expect(runImageEditTask({
            operation: "crop",
            source: dataUrl,
            crop: { x: 0, y: 0, width: 80, height: 80 },
        })).resolves.toMatchObject({ metadata: "Cropped 980x552" })
        expect((CapturingWorker.lastInput as { source: string }).source.length).toBeGreaterThan(256 * 1024)
        expect(fallbackMocks.runImageEditDomTask).not.toHaveBeenCalled()
    })

    it("does not fall back to main-thread processing on representative worker timeouts", async () => {
        vi.useFakeTimers()
        useCanvasWorkerSupport()

        useWorker(undefined, "idle")
        const svgTask = runSvgOptimizeTask({ svg: `<svg>${"<g/>".repeat(80_000)}</svg>` }, { timeoutMs: 5 })
        const svgExpectation = expect(svgTask).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })
        await vi.advanceTimersByTimeAsync(5)
        await svgExpectation
        expect(fallbackMocks.optimizeSvg).not.toHaveBeenCalled()

        useWorker(undefined, "idle")
        const compressionTask = runCompressionTask({
            input: largeText(),
            mode: "compress",
            format: "gzip",
            inputEncoding: "text",
            outputEncoding: "base64",
        }, { timeoutMs: 5 })
        const compressionExpectation = expect(compressionTask).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })
        await vi.advanceTimersByTimeAsync(5)
        await compressionExpectation
        expect(fallbackMocks.runCompressionLab).not.toHaveBeenCalled()

        useWorker(undefined, "idle")
        const imageEditTask = runImageEditTask({
            operation: "filter",
            source: `data:image/png;base64,${"A".repeat(300 * 1024)}`,
            filters: { brightness: 110, contrast: 120, saturation: 105, grayscale: 0, blur: 0 },
            maxWidth: 980,
        }, { timeoutMs: 5 })
        const imageEditExpectation = expect(imageEditTask).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })
        await vi.advanceTimersByTimeAsync(5)
        await imageEditExpectation
        expect(fallbackMocks.runImageEditDomTask).not.toHaveBeenCalled()
    })

    it("runs Pipeline Builder regex steps through the regex worker for large inputs", async () => {
        const input = "Ab1 ".repeat(80_000)
        useWorker({
            ok: true,
            matches: [{ match: "Ab1", index: 0, groupIndex: 0, groups: ["Ab", "1"] }],
            limited: false,
            elapsedMs: 8,
            warnings: [],
        })

        const result = await runRecipe(regexRecipe(), input)

        expect(result.ok).toBe(true)
        expect((CapturingWorker.lastInput as { testString: string }).testString.length).toBeGreaterThan(256 * 1024)
        expect(JSON.parse(result.finalOutput)).toMatchObject({
            count: 1,
            limited: false,
        })
    })
})
