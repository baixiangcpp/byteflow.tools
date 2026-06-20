import { createHash, createHmac } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { runHashTask } from "@/features/tools/hash-generator/hash-task"
import { runHashTaskSync } from "@/features/tools/hash-generator/hash-task-logic"

class MockHashWorker {
    static mode: "success" | "error" | "idle" = "success"
    static lastTransfer: Transferable[] | undefined
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
    terminated = false

    postMessage(input: unknown, transfer?: Transferable[]) {
        MockHashWorker.lastTransfer = transfer
        if (MockHashWorker.mode === "idle") return
        queueMicrotask(() => {
            if (this.terminated) return
            if (MockHashWorker.mode === "error") {
                this.onmessage?.({ data: { ok: false, error: "HASH_WORKER_FAILED" } } as MessageEvent)
                return
            }
            this.onmessage?.({
                data: {
                    ok: true,
                    value: runHashTaskSync(input as Parameters<typeof runHashTaskSync>[0]),
                },
            } as MessageEvent)
        })
    }

    terminate() {
        this.terminated = true
    }
}

describe("hash task", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        MockHashWorker.mode = "success"
        MockHashWorker.lastTransfer = undefined
    })

    it("computes standard text hashes", () => {
        const result = runHashTaskSync({ mode: "text", input: "hello" })

        expect(result.standardHashes.md5).toBe("5d41402abc4b2a76b9719d911017c592")
        expect(result.standardHashes.sha256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
        expect(result.hmacHashes.sha256).toBe("")
        expect(result.batchRows).toEqual([])
    })

    it("computes file hashes from bytes", () => {
        const bytes = Uint8Array.from([0, 1, 2, 3, 254, 255])
        const result = runHashTaskSync({ mode: "file", bytes })
        const buffer = Buffer.from(bytes)

        expect(result.standardHashes.sha1).toBe(createHash("sha1").update(buffer).digest("hex"))
        expect(result.standardHashes.sha512).toBe(createHash("sha512").update(buffer).digest("hex"))
    })

    it("computes hmac hashes", () => {
        const input = "The quick brown fox jumps over the lazy dog"
        const secret = "key"
        const result = runHashTaskSync({ mode: "hmac", input, secret })

        expect(result.hmacHashes.sha256).toBe(createHmac("sha256", secret).update(input).digest("hex"))
        expect(result.hmacHashes.sha512).toBe(createHmac("sha512", secret).update(input).digest("hex"))
        expect(result.standardHashes.sha256).toBe("")
    })

    it("computes non-empty batch rows with stable one-based indexes", () => {
        const result = runHashTaskSync({
            mode: "batch",
            input: "alpha\n\n beta \n",
            algorithm: "sha256",
        })

        expect(result.batchRows).toEqual([
            {
                index: 1,
                line: "alpha",
                hash: createHash("sha256").update("alpha").digest("hex"),
            },
            {
                index: 2,
                line: "beta",
                hash: createHash("sha256").update("beta").digest("hex"),
            },
        ])
    })

    it("falls back to sync computation when Worker is unavailable", async () => {
        vi.stubGlobal("Worker", undefined)

        await expect(runHashTask({ mode: "text", input: "hello" })).resolves.toMatchObject({
            standardHashes: {
                md5: "5d41402abc4b2a76b9719d911017c592",
            },
        })
    })

    it("uses the worker result when workers are available", async () => {
        vi.stubGlobal("Worker", MockHashWorker)

        await expect(runHashTask({ mode: "text", input: "hello" })).resolves.toMatchObject({
            standardHashes: {
                md5: "5d41402abc4b2a76b9719d911017c592",
            },
        })
    })

    it("transfers file buffers to the worker", async () => {
        vi.stubGlobal("Worker", MockHashWorker)
        const bytes = Uint8Array.from([1, 2, 3])

        await runHashTask({ mode: "file", bytes })

        expect(MockHashWorker.lastTransfer).toEqual([bytes.buffer])
    })

    it("falls back to sync computation on non-timeout worker failures", async () => {
        MockHashWorker.mode = "error"
        vi.stubGlobal("Worker", MockHashWorker)

        await expect(runHashTask({ mode: "text", input: "hello" })).resolves.toMatchObject({
            standardHashes: {
                md5: "5d41402abc4b2a76b9719d911017c592",
            },
        })
    })

    it("does not fall back to sync computation when aborted", async () => {
        MockHashWorker.mode = "idle"
        vi.stubGlobal("Worker", MockHashWorker)
        const controller = new AbortController()
        const task = runHashTask({ mode: "text", input: "hello" }, { signal: controller.signal })

        controller.abort()

        await expect(task).rejects.toMatchObject({ code: "WORKER_ABORTED" })
    })

    it("does not fall back to sync computation on worker timeout", async () => {
        vi.useFakeTimers()
        MockHashWorker.mode = "idle"
        vi.stubGlobal("Worker", MockHashWorker)
        const task = runHashTask({ mode: "text", input: "hello" }, { timeoutMs: 10 })
        const expectation = expect(task).rejects.toMatchObject({ code: "WORKER_TIMEOUT" })

        await vi.advanceTimersByTimeAsync(10)

        await expectation
        vi.useRealTimers()
    })
})
