import { describe, expect, it } from "vitest"

// Since the logic is inside the component, I'll extract it to a utility first to test it properly, 
// following the same pattern as openapi-mock.
// But the TDD rule says "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST".
// So I will write the test against the intended API of the new utility.

import { parseTimestampHeuristic } from "@/features/tools/unix-timestamp/utils"

describe("unix timestamp heuristic logic", () => {
    it("correctly identifies modern seconds timestamp (10 digits)", () => {
        const input = "1712810000" // 2024-04-11
        const result = parseTimestampHeuristic(input)
        expect(result.isMilliseconds).toBe(false)
        expect(result.date.getUTCFullYear()).toBe(2024)
    })

    it("correctly identifies modern milliseconds timestamp (13 digits)", () => {
        const input = "1712810000000" // 2024-04-11 in MS
        const result = parseTimestampHeuristic(input)
        expect(result.isMilliseconds).toBe(true)
        expect(result.date.getUTCFullYear()).toBe(2024)
    })

    it("correctly identifies year 2500 seconds timestamp (11 digits, < 30B)", () => {
        // 2500-01-01 in seconds is 16725312000
        const input = "16725312000"
        const result = parseTimestampHeuristic(input)
        expect(result.isMilliseconds).toBe(false)
        expect(result.date.getUTCFullYear()).toBe(2500)
    })

    it("correctly identifies 1972 milliseconds timestamp (11 digits, > 30B)", () => {
        // 1972-01-01 in MS is 63072000000
        const input = "63072000000"
        const result = parseTimestampHeuristic(input)
        expect(result.isMilliseconds).toBe(true)
        expect(result.date.getUTCFullYear()).toBe(1972)
    })
})
