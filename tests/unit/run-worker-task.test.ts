import { afterEach, describe, expect, it, vi } from "vitest"
import { runWorkerTask } from "@/core/workers/run-worker-task"

type MockWorkerMode = "success" | "error" | "idle"

class MockWorker {
    static mode: MockWorkerMode = "success"
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    terminated = false

    postMessage(input: unknown) {
        if (MockWorker.mode === "idle") return

        queueMicrotask(() => {
            if (this.terminated) return
            if (MockWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "TASK_FAILED" } } as MessageEvent)
                return
            }
            this.onmessage?.({ data: { ok: true, value: input } } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("runWorkerTask", () => {
    afterEach(() => {
        vi.useRealTimers()
        MockWorker.mode = "success"
    })

    it("resolves worker responses and terminates the worker", async () => {
        const worker = new MockWorker()
        const result = await runWorkerTask(() => worker as unknown as Worker, { value: 1 })

        expect(result).toEqual({ value: 1 })
        expect(worker.terminated).toBe(true)
    })

    it("rejects serialized worker failures", async () => {
        MockWorker.mode = "error"

        await expect(runWorkerTask(() => new MockWorker() as unknown as Worker, "input")).rejects.toThrow("TASK_FAILED")
    })

    it("rejects and terminates on timeout", async () => {
        vi.useFakeTimers()
        MockWorker.mode = "idle"
        const worker = new MockWorker()
        const task = runWorkerTask(() => worker as unknown as Worker, "input", { timeoutMs: 10 })
        const expectation = expect(task).rejects.toThrow("WORKER_TIMEOUT")

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        expect(worker.terminated).toBe(true)
    })
})
