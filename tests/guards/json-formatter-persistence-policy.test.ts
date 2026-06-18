import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { JSON_FORMATTER_PERSISTENCE_POLICY } from "@/features/tools/json-formatter/constants"

describe("json formatter persistence policy", () => {
    it("does not persist JSON payload input by default", () => {
        expect(JSON_FORMATTER_PERSISTENCE_POLICY.persistInput).toBe(false)
    })

    it("uses the central persistence policy instead of directly writing input", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/features/tools/json-formatter/page.tsx"), "utf8")

        expect(source).toContain("enforceToolInputPersistencePolicy(JSON_FORMATTER_PERSISTENCE_POLICY, input)")
        expect(source).not.toContain("writeStorageString(INPUT_STORAGE_KEY, input)")
    })
})
