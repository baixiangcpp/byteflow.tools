import { describe, expect, test, vi } from "vitest"

import { runCheck } from "../../scripts/generators/generate-tool-index.js"

function makeIndexData(overrides = {}) {
    return {
        counts: {
            canonicalTools: 1,
            aliasRoutes: 0,
        },
        integrity: {
            duplicateKeys: [],
            duplicateSlugs: [],
            missingRegistryMetaKeys: [],
            missingCanonicalRoutes: [],
            unknownRouteDirs: [],
            ...overrides,
        },
    }
}

describe("tool index check", () => {
    test("fails when unknown route directories are present", () => {
        const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
            throw new Error(`process.exit:${code}`)
        })
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

        expect(() => runCheck(makeIndexData({ unknownRouteDirs: ["orphan-tool"] }))).toThrow("process.exit:1")
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("unknown route dirs: 1"))

        exitSpy.mockRestore()
        errorSpy.mockRestore()
    })
})
