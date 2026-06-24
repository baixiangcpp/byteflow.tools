import { afterEach, describe, expect, it, vi } from "vitest"
import { runRegexTestTask } from "@/features/tools/regex-tester/regex-test-task"

class MockRegexWorker {
    static mode: "success" | "error" | "idle" = "success"
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage() {
        if (MockRegexWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockRegexWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "REGEX_WORKER_FAILED" } } as MessageEvent)
                return
            }
            this.onmessage?.({
                data: {
                    ok: true,
                    value: {
                        ok: true,
                        matches: [{ match: "Ab1", index: 0, groupIndex: 0, groups: ["Ab", "1"] }],
                        limited: false,
                        elapsedMs: 3,
                        warnings: [],
                    },
                },
            } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("runRegexTestTask", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
        MockRegexWorker.mode = "success"
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockRegexWorker)

        await expect(runRegexTestTask("([A-Z][a-z]+)(\\d)", "g", "Ab1")).resolves.toMatchObject({
            ok: true,
            elapsedMs: 3,
        })
    })

    it("falls back to sync evaluation on non-timeout worker failures", async () => {
        MockRegexWorker.mode = "error"
        vi.stubGlobal("Worker", MockRegexWorker)

        const result = await runRegexTestTask("a", "g", "abc")

        expect(result.ok).toBe(true)
        if (result.ok) expect(result.matches[0].match).toBe("a")
    })

    it("returns an interrupted result on worker timeout instead of falling back to main-thread evaluation", async () => {
        vi.useFakeTimers()
        MockRegexWorker.mode = "idle"
        vi.stubGlobal("Worker", MockRegexWorker)
        const task = runRegexTestTask("^(a+)+$", "g", `${"a".repeat(30)}X`, { timeoutMs: 10 })

        await vi.advanceTimersByTimeAsync(10)

        await expect(task).resolves.toMatchObject({
            ok: false,
            error: expect.stringContaining("stopped after the safety timeout"),
        })
    })

    it("does not fall back when aborted", async () => {
        MockRegexWorker.mode = "idle"
        vi.stubGlobal("Worker", MockRegexWorker)
        const controller = new AbortController()
        const task = runRegexTestTask("a", "g", "abc", { signal: controller.signal })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
    })
})
