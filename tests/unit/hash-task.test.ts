import { createHash, createHmac } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { runHashTask } from "@/features/tools/hash-generator/hash-task"
import { runHashTaskSync } from "@/features/tools/hash-generator/hash-task-logic"

describe("hash task", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
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
})
