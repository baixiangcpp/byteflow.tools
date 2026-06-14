import { describe, expect, it } from "vitest"
import {
    DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES,
    importTextFile,
    validateTextImportFile,
} from "@/core/files/text-file-import"

describe("text-file-import", () => {
    it("accepts supported text files", () => {
        const file = new File(["alpha\nbeta"], "sample.txt", { type: "text/plain" })
        expect(validateTextImportFile(file)).toBeNull()
    })

    it("rejects unsupported binary-like files", () => {
        const file = new File([new Uint8Array([1, 2, 3])], "image.bin", { type: "application/octet-stream" })
        expect(validateTextImportFile(file)).toContain("Unsupported file type")
    })

    it("rejects oversized files", () => {
        const oversized = new File(["a".repeat(DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES + 10)], "huge.txt", { type: "text/plain" })
        expect(validateTextImportFile(oversized)).toContain("File is too large")
    })

    it("reads valid file content", async () => {
        const file = new File(["line-1\nline-2"], "sample.json", { type: "application/json" })
        await expect(importTextFile(file)).resolves.toBe("line-1\nline-2")
    })
})
