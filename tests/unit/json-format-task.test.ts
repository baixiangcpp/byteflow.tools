import { afterEach, describe, expect, it, vi } from "vitest"
import { runJsonFormatTask } from "@/features/tools/json-formatter/format-json-task"

class MockJsonWorker {
    static mode: "success" | "error" | "parse-error" | "idle" = "success"
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage() {
        if (MockJsonWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockJsonWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "JSON_WORKER_FAILED" } } as MessageEvent)
                return
            }
            if (MockJsonWorker.mode === "parse-error") {
                this.onmessage?.({ data: { ok: false, error: { code: "JSON_PARSE_FAILED", message: "Unexpected token '}' in JSON at position 5" } } } as MessageEvent)
                return
            }
            this.onmessage?.({ data: { ok: true, value: { output: "from-worker", parsed: { worker: true } } } } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("runJsonFormatTask", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        MockJsonWorker.mode = "success"
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockJsonWorker)

        await expect(runJsonFormatTask('{"a":1}', "format")).resolves.toEqual({
            output: "from-worker",
            parsed: { worker: true },
        })
    })

    it("falls back to sync formatting on non-timeout worker failures", async () => {
        MockJsonWorker.mode = "error"
        vi.stubGlobal("Worker", MockJsonWorker)

        await expect(runJsonFormatTask('{"a":1}', "format")).resolves.toEqual({
            output: '{\n  "a": 1\n}',
            parsed: { a: 1 },
        })
    })

    it("does not fall back to sync formatting for worker parse failures", async () => {
        MockJsonWorker.mode = "parse-error"
        vi.stubGlobal("Worker", MockJsonWorker)

        await expect(runJsonFormatTask('{"a":}', "format")).rejects.toThrow(SyntaxError)
    })

    it("does not fall back when aborted", async () => {
        MockJsonWorker.mode = "idle"
        vi.stubGlobal("Worker", MockJsonWorker)
        const controller = new AbortController()
        const task = runJsonFormatTask('{"a":1}', "format", { signal: controller.signal })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
    })

    it("does not fall back on worker timeout", async () => {
        vi.useFakeTimers()
        MockJsonWorker.mode = "idle"
        vi.stubGlobal("Worker", MockJsonWorker)
        const task = runJsonFormatTask('{"a":1}', "format", { timeoutMs: 10 })
        const expectation = expect(task).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        vi.useRealTimers()
    })
})
