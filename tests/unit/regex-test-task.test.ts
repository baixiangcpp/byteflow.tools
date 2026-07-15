import { afterEach, describe, expect, it, vi } from "vitest"
import { runRegexTestTask } from "@/features/tools/regex-tester/regex-test-task"

class MockRegexWorker {
    static mode: "success" | "taskError" | "runtimeError" | "messageError" | "postError" | "idle" = "success"
    static throwOnCreate = false
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    constructor() {
        if (MockRegexWorker.throwOnCreate) throw new Error("worker blocked")
    }

    postMessage() {
        if (MockRegexWorker.mode === "postError") throw new Error("cannot clone")
        if (MockRegexWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockRegexWorker.mode === "taskError") {
                this.onmessage?.({ data: { ok: false, error: "REGEX_WORKER_FAILED" } } as MessageEvent)
                return
            }
            if (MockRegexWorker.mode === "runtimeError") {
                this.onerror?.({ message: "worker crashed", error: new Error("worker crashed") } as ErrorEvent)
                return
            }
            if (MockRegexWorker.mode === "messageError") {
                this.onmessageerror?.({ data: null } as MessageEvent)
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
        MockRegexWorker.throwOnCreate = false
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockRegexWorker)

        await expect(runRegexTestTask("([A-Z][a-z]+)(\\d)", "g", "Ab1")).resolves.toMatchObject({
            ok: true,
            elapsedMs: 3,
        })
    })

    it("fails closed when Worker is unavailable", async () => {
        vi.stubGlobal("Worker", undefined)

        await expect(runRegexTestTask("a", "g", "abc")).resolves.toMatchObject({
            ok: false,
            errorCode: "safe_evaluation_unavailable",
            workerErrorCode: "WORKER_UNAVAILABLE",
        })
    })

    it.each([
        ["taskError", "REGEX_WORKER_FAILED"],
        ["runtimeError", "WORKER_RUNTIME_ERROR"],
        ["messageError", "WORKER_MESSAGE_ERROR"],
        ["postError", "WORKER_POST_MESSAGE_FAILED"],
    ] as const)("fails closed on %s worker failures", async (mode, workerErrorCode) => {
        MockRegexWorker.mode = mode
        vi.stubGlobal("Worker", MockRegexWorker)

        await expect(runRegexTestTask("a", "g", "abc")).resolves.toMatchObject({
            ok: false,
            errorCode: "safe_evaluation_unavailable",
            workerErrorCode,
        })
    })

    it("fails closed when worker construction is blocked", async () => {
        MockRegexWorker.throwOnCreate = true
        vi.stubGlobal("Worker", MockRegexWorker)

        await expect(runRegexTestTask("a", "g", "abc")).resolves.toMatchObject({
            ok: false,
            errorCode: "safe_evaluation_unavailable",
            workerErrorCode: "WORKER_CREATE_FAILED",
        })
    })

    it("returns an interrupted result on worker timeout instead of falling back to main-thread evaluation", async () => {
        vi.useFakeTimers()
        MockRegexWorker.mode = "idle"
        vi.stubGlobal("Worker", MockRegexWorker)
        const task = runRegexTestTask("^(a+)+$", "g", `${"a".repeat(30)}X`, { timeoutMs: 10 })

        await vi.advanceTimersByTimeAsync(10)

        await expect(task).resolves.toMatchObject({
            ok: false,
            errorCode: "worker_timeout",
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
