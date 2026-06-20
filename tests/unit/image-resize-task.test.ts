import { afterEach, describe, expect, it, vi } from "vitest"
import { runImageResizeTask } from "@/features/tools/image-resizer/image-resize-task"

vi.mock("@/features/tools/image-resizer/image-resize-dom", () => ({
    renderImageResizeDataUrlDom: vi.fn(async () => ({
        dataUrl: "data:image/png;base64,dom",
        sourceWidth: 40,
        sourceHeight: 20,
        outputWidth: 20,
        outputHeight: 10,
    })),
}))

class MockImageResizeWorker {
    static mode: "success" | "error" | "idle" = "success"
    static lastTransfer: Transferable[] | undefined
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage(_input: unknown, transfer?: Transferable[]) {
        MockImageResizeWorker.lastTransfer = transfer
        if (MockImageResizeWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockImageResizeWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "IMAGE_WORKER_FAILED" } } as MessageEvent)
                return
            }
            this.onmessage?.({
                data: {
                    ok: true,
                    value: {
                        mime: "image/png",
                        bytes: new ArrayBuffer(4),
                        sourceWidth: 100,
                        sourceHeight: 50,
                        outputWidth: 20,
                        outputHeight: 10,
                    },
                },
            } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("runImageResizeTask", () => {
    const input = {
        source: "data:image/png;base64,AAAA",
        targetWidth: 20,
        targetHeight: 10,
        fitMode: "contain" as const,
        format: "png" as const,
        quality: 0.9,
    }

    afterEach(() => {
        vi.unstubAllGlobals()
        MockImageResizeWorker.mode = "success"
        MockImageResizeWorker.lastTransfer = undefined
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockImageResizeWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())

        await expect(runImageResizeTask(input)).resolves.toMatchObject({
            sourceWidth: 100,
            sourceHeight: 50,
            outputWidth: 20,
            outputHeight: 10,
        })
    })

    it("transfers source buffers to the worker", async () => {
        vi.stubGlobal("Worker", MockImageResizeWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())
        const sourceBytes = new ArrayBuffer(8)

        await runImageResizeTask({ ...input, sourceBytes, sourceMime: "image/png" })

        expect(MockImageResizeWorker.lastTransfer).toEqual([sourceBytes])
    })

    it("falls back to DOM rendering when workers are unavailable", async () => {
        vi.stubGlobal("Worker", undefined)

        await expect(runImageResizeTask(input)).resolves.toMatchObject({
            dataUrl: "data:image/png;base64,dom",
            sourceWidth: 40,
        })
    })

    it("falls back to DOM rendering on non-timeout worker failures", async () => {
        MockImageResizeWorker.mode = "error"
        vi.stubGlobal("Worker", MockImageResizeWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())

        await expect(runImageResizeTask(input)).resolves.toMatchObject({
            dataUrl: "data:image/png;base64,dom",
        })
    })

    it("does not fall back when aborted", async () => {
        MockImageResizeWorker.mode = "idle"
        vi.stubGlobal("Worker", MockImageResizeWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())
        const controller = new AbortController()
        const task = runImageResizeTask(input, { signal: controller.signal })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
    })

    it("does not fall back on worker timeout", async () => {
        vi.useFakeTimers()
        MockImageResizeWorker.mode = "idle"
        vi.stubGlobal("Worker", MockImageResizeWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())
        const task = runImageResizeTask(input, { timeoutMs: 10 })
        const expectation = expect(task).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        vi.useRealTimers()
    })
})
