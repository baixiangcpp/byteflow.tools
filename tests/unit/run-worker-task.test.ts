import { afterEach, describe, expect, it, vi } from "vitest"
import { runWorkerTask } from "@/core/workers/run-worker-task"

type MockWorkerMode = "success" | "error" | "idle"

class MockWorker {
    static mode: MockWorkerMode = "success"
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    lastTransfer: Transferable[] | undefined
    terminated = false

    postMessage(input: unknown, transfer?: Transferable[]) {
        this.lastTransfer = transfer
        if (MockWorker.mode === "idle") return

        queueMicrotask(() => {
            if (this.terminated) return
            if (MockWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: { code: "TASK_FAILED", message: "Task failed" } } } as MessageEvent)
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

    it("rejects serialized worker failures with stable error codes", async () => {
        MockWorker.mode = "error"

        await expect(runWorkerTask(() => new MockWorker() as unknown as Worker, "input")).rejects.toMatchObject({
            code: "TASK_FAILED",
            message: "Task failed",
        })
    })

    it("rejects and terminates on timeout", async () => {
        vi.useFakeTimers()
        MockWorker.mode = "idle"
        const worker = new MockWorker()
        const task = runWorkerTask(() => worker as unknown as Worker, "input", { timeoutMs: 10 })
        const expectation = expect(task).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        expect(worker.terminated).toBe(true)
    })

    it("terminates when aborted", async () => {
        MockWorker.mode = "idle"
        const controller = new AbortController()
        const worker = new MockWorker()
        const task = runWorkerTask(() => worker as unknown as Worker, "input", {
            signal: controller.signal,
            timeoutMs: 10_000,
        })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
        expect(worker.terminated).toBe(true)
    })

    it("forwards transfer lists to postMessage", async () => {
        const worker = new MockWorker()
        const buffer = new ArrayBuffer(8)
        const result = await runWorkerTask(() => worker as unknown as Worker, { value: 1 }, {
            transfer: [buffer],
        })

        expect(result).toEqual({ value: 1 })
        expect(worker.lastTransfer).toEqual([buffer])
    })

    it("normalizes createWorker failures", async () => {
        await expect(runWorkerTask(() => {
            throw new Error("no worker")
        }, "input")).rejects.toMatchObject({
            code: "WORKER_CREATE_FAILED",
            message: "no worker",
        })
    })

    it("normalizes postMessage failures and terminates the worker", async () => {
        const worker = new MockWorker()
        worker.postMessage = () => {
            throw new Error("cannot clone")
        }

        await expect(runWorkerTask(() => worker as unknown as Worker, "input")).rejects.toMatchObject({
            code: "WORKER_POST_MESSAGE_FAILED",
            message: "cannot clone",
        })
        expect(worker.terminated).toBe(true)
    })

    it("rejects message serialization failures", async () => {
        const worker = new MockWorker()
        worker.postMessage = () => {
            queueMicrotask(() => worker.onmessageerror?.({ data: null } as MessageEvent))
        }

        await expect(runWorkerTask(() => worker as unknown as Worker, "input")).rejects.toMatchObject({
            code: "WORKER_MESSAGE_ERROR",
        })
        expect(worker.terminated).toBe(true)
    })
})
