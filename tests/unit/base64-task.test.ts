import { afterEach, describe, expect, it, vi } from "vitest"
import { runBase64FileTask, runBase64TextTask } from "@/features/tools/base64-encode-decode/base64-task"

class MockBase64Worker {
    static mode: "success" | "error" | "idle" = "success"
    static lastTransfer: Transferable[] | undefined
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage(input: unknown, transfer?: Transferable[]) {
        MockBase64Worker.lastTransfer = transfer
        if (MockBase64Worker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockBase64Worker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "BASE64_WORKER_FAILED" } } as MessageEvent)
                return
            }
            const taskInput = input as { task?: string; operation?: string }
            if (taskInput.task === "file" && taskInput.operation === "decode") {
                this.onmessage?.({ data: { ok: true, value: { operation: "decode", bytes: Uint8Array.from([1, 2, 3]).buffer } } } as MessageEvent)
                return
            }
            if (taskInput.task === "file") {
                this.onmessage?.({ data: { ok: true, value: { operation: "encode", output: "from-file-worker" } } } as MessageEvent)
                return
            }
            this.onmessage?.({ data: { ok: true, value: { output: "from-worker" } } } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("runBase64TextTask", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        MockBase64Worker.mode = "success"
        MockBase64Worker.lastTransfer = undefined
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockBase64Worker)

        await expect(runBase64TextTask({
            input: "Hello",
            operation: "encode",
            urlSafe: false,
        })).resolves.toEqual({ output: "from-worker" })
    })

    it("falls back to sync computation on non-timeout worker failures", async () => {
        MockBase64Worker.mode = "error"
        vi.stubGlobal("Worker", MockBase64Worker)

        await expect(runBase64TextTask({
            input: "Hello, 世界",
            operation: "encode",
            urlSafe: false,
        })).resolves.toEqual({ output: "SGVsbG8sIOS4lueVjA==" })
    })

    it("does not fall back to sync computation when aborted", async () => {
        MockBase64Worker.mode = "idle"
        vi.stubGlobal("Worker", MockBase64Worker)
        const controller = new AbortController()
        const task = runBase64TextTask({
            input: "Hello",
            operation: "encode",
            urlSafe: false,
        }, { signal: controller.signal })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
    })

    it("does not fall back to sync computation on worker timeout", async () => {
        vi.useFakeTimers()
        MockBase64Worker.mode = "idle"
        vi.stubGlobal("Worker", MockBase64Worker)
        const task = runBase64TextTask({
            input: "Hello",
            operation: "encode",
            urlSafe: false,
        }, { timeoutMs: 10 })
        const expectation = expect(task).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        vi.useRealTimers()
    })

    it("falls back to sync text encoding when Worker is unavailable", async () => {
        vi.stubGlobal("Worker", undefined)

        await expect(runBase64TextTask({
            input: "Hello, 世界",
            operation: "encode",
            urlSafe: false,
        })).resolves.toEqual({ output: "SGVsbG8sIOS4lueVjA==" })
    })

    it("falls back to sync URL-safe decoding when Worker is unavailable", async () => {
        vi.stubGlobal("Worker", undefined)

        await expect(runBase64TextTask({
            input: "SGVsbG8sIOS4lueVjA",
            operation: "decode",
            urlSafe: true,
        })).resolves.toEqual({ output: "Hello, 世界" })
    })

    it("surfaces invalid base64 input from the sync fallback", async () => {
        vi.stubGlobal("Worker", undefined)

        await expect(runBase64TextTask({
            input: "not base64%%%",
            operation: "decode",
            urlSafe: false,
        })).rejects.toThrow()
    })

    it("encodes file buffers through the worker with transfer", async () => {
        vi.stubGlobal("Worker", MockBase64Worker)
        const bytes = Uint8Array.from([72, 105])

        await expect(runBase64FileTask({
            task: "file",
            operation: "encode",
            bytes: bytes.buffer,
            urlSafe: false,
        })).resolves.toEqual({ operation: "encode", output: "from-file-worker" })
        expect(MockBase64Worker.lastTransfer).toEqual([bytes.buffer])
    })

    it("decodes file payloads through the worker", async () => {
        vi.stubGlobal("Worker", MockBase64Worker)

        const result = await runBase64FileTask({
            task: "file",
            operation: "decode",
            input: "AQID",
            urlSafe: false,
        })

        expect(result.operation).toBe("decode")
        expect(result.operation === "decode" ? Array.from(new Uint8Array(result.bytes)) : []).toEqual([1, 2, 3])
    })

    it("falls back to sync file decode when Worker is unavailable", async () => {
        vi.stubGlobal("Worker", undefined)

        const result = await runBase64FileTask({
            task: "file",
            operation: "decode",
            input: "SGk=",
            urlSafe: false,
        })

        expect(result.operation).toBe("decode")
        expect(result.operation === "decode" ? Array.from(new Uint8Array(result.bytes)) : []).toEqual([72, 105])
    })
})
