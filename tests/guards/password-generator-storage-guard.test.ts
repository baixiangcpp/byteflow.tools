import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("password generator storage guard", () => {
    it("uses the shared persistence helpers instead of raw localStorage", () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), "src/features/tools/password-generator/page.tsx"),
            "utf8",
        )

        expect(source).toContain('import { readStorageString, removeStorageKey, writeStorageString } from "@/core/storage/tool-persistence"')
        expect(source).not.toContain("localStorage.getItem(")
        expect(source).not.toContain("localStorage.setItem(")
        expect(source).not.toContain("localStorage.removeItem(")
    })
})
