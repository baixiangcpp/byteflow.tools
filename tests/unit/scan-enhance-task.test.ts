import { afterEach, describe, expect, it, vi } from "vitest"
import { runScanEnhanceTask } from "@/features/tools/scanned-pdf-converter/scan-enhance-task"

vi.mock("@/features/tools/scanned-pdf-converter/scan-enhance-dom", () => ({
    enhanceScanDataUrlDom: vi.fn(async () => ({
        dataUrl: "data:image/jpeg;base64,AAEC",
        width: 40,
        height: 20,
    })),
}))

class MockScanEnhanceWorker {
    static mode: "success" | "error" | "idle" = "success"
    static lastTransfer: Transferable[] | undefined
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage(_input: unknown, transfer?: Transferable[]) {
        MockScanEnhanceWorker.lastTransfer = transfer
        if (MockScanEnhanceWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockScanEnhanceWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "SCAN_WORKER_FAILED" } } as MessageEvent)
                return
            }
            this.onmessage?.({
                data: {
                    ok: true,
                    value: {
                        mime: "image/jpeg",
                        bytes: new ArrayBuffer(4),
                        width: 100,
                        height: 50,
                    },
                },
            } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("runScanEnhanceTask", () => {
    const input = {
        source: "data:image/png;base64,AAAA",
        enhance: {
            brightness: 100,
            contrast: 100,
            grayscale: 0,
            thresholdEnabled: false,
            threshold: 160,
        },
    }

    afterEach(() => {
        vi.unstubAllGlobals()
        MockScanEnhanceWorker.mode = "success"
        MockScanEnhanceWorker.lastTransfer = undefined
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockScanEnhanceWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())

        await expect(runScanEnhanceTask(input)).resolves.toMatchObject({
            width: 100,
            height: 50,
        })
    })

    it("transfers source buffers to the worker", async () => {
        vi.stubGlobal("Worker", MockScanEnhanceWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())
        const sourceBytes = new ArrayBuffer(8)

        await runScanEnhanceTask({ ...input, sourceBytes, sourceMime: "image/png" })

        expect(MockScanEnhanceWorker.lastTransfer).toEqual([sourceBytes])
    })

    it("falls back to DOM enhancement when workers are unavailable", async () => {
        vi.stubGlobal("Worker", undefined)

        await expect(runScanEnhanceTask(input)).resolves.toMatchObject({
            dataUrl: "data:image/jpeg;base64,AAEC",
            width: 40,
        })
    })

    it("falls back to DOM enhancement on non-timeout worker failures", async () => {
        MockScanEnhanceWorker.mode = "error"
        vi.stubGlobal("Worker", MockScanEnhanceWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())

        await expect(runScanEnhanceTask(input)).resolves.toMatchObject({
            dataUrl: "data:image/jpeg;base64,AAEC",
        })
    })

    it("does not fall back when aborted", async () => {
        MockScanEnhanceWorker.mode = "idle"
        vi.stubGlobal("Worker", MockScanEnhanceWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())
        const controller = new AbortController()
        const task = runScanEnhanceTask(input, { signal: controller.signal })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
    })

    it("does not fall back on worker timeout", async () => {
        vi.useFakeTimers()
        MockScanEnhanceWorker.mode = "idle"
        vi.stubGlobal("Worker", MockScanEnhanceWorker)
        vi.stubGlobal("OffscreenCanvas", class OffscreenCanvas {})
        vi.stubGlobal("createImageBitmap", vi.fn())
        const task = runScanEnhanceTask(input, { timeoutMs: 10 })
        const expectation = expect(task).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        vi.useRealTimers()
    })
})
