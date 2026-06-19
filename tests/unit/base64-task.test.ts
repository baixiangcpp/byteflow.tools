import { afterEach, describe, expect, it, vi } from "vitest"
import { runBase64TextTask } from "@/features/tools/base64-encode-decode/base64-task"

describe("runBase64TextTask", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
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
})
