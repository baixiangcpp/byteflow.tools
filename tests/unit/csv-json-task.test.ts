import { afterEach, describe, expect, it, vi } from "vitest"
import { runCsvJsonTask } from "@/features/tools/csv-json-converter/csv-json-task"

class MockCsvJsonWorker {
    static mode: "success" | "error" | "idle" = "success"
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage() {
        if (MockCsvJsonWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockCsvJsonWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "CSV_JSON_WORKER_FAILED" } } as MessageEvent)
                return
            }
            this.onmessage?.({
                data: {
                    ok: true,
                    value: {
                        output: "from-worker",
                        diagnostics: [{
                            code: "delimiter_detected",
                            severity: "info",
                            message: "Auto-detected comma (,).",
                            delimiter: ",",
                        }],
                        detectedDelimiter: ",",
                    },
                },
            } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("runCsvJsonTask", () => {
    const input = {
        input: "name\nAda",
        direction: "csv-to-json" as const,
        delimiter: ",",
        hasHeader: true,
        typeInference: true,
    }

    afterEach(() => {
        vi.unstubAllGlobals()
        MockCsvJsonWorker.mode = "success"
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockCsvJsonWorker)

        await expect(runCsvJsonTask(input)).resolves.toEqual({
            output: "from-worker",
            diagnostics: [{
                code: "delimiter_detected",
                severity: "info",
                message: "Auto-detected comma (,).",
                delimiter: ",",
            }],
            detectedDelimiter: ",",
        })
    })

    it("falls back to sync conversion on non-timeout worker failures", async () => {
        MockCsvJsonWorker.mode = "error"
        vi.stubGlobal("Worker", MockCsvJsonWorker)

        await expect(runCsvJsonTask(input)).resolves.toEqual({
            output: "[\n  {\n    \"name\": \"Ada\"\n  }\n]",
            diagnostics: [],
            detectedDelimiter: ",",
        })
    })

    it("does not fall back when aborted", async () => {
        MockCsvJsonWorker.mode = "idle"
        vi.stubGlobal("Worker", MockCsvJsonWorker)
        const controller = new AbortController()
        const task = runCsvJsonTask(input, { signal: controller.signal })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
    })

    it("does not fall back on worker timeout", async () => {
        vi.useFakeTimers()
        MockCsvJsonWorker.mode = "idle"
        vi.stubGlobal("Worker", MockCsvJsonWorker)
        const task = runCsvJsonTask(input, { timeoutMs: 10 })
        const expectation = expect(task).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        vi.useRealTimers()
    })
})
