/**
 * Tests for jq-utils
 */

import { describe, it, expect } from "vitest"
import {
    formatJqParsedOutput,
    formatJSON,
    minifyJSON,
    parseJqError,
    parseJqOutputStream,
    validateJSON,
} from "../../src/features/tools/jq-playground/browser-actions"

describe("validateJSON", () => {
    it("should validate correct JSON", () => {
        const result = validateJSON('{"name": "Alice", "age": 30}')
        expect(result.valid).toBe(true)
    })

    it("should reject empty input", () => {
        const result = validateJSON("")
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.error).toContain("empty")
        }
    })

    it("should reject invalid JSON", () => {
        const result = validateJSON('{name: "Alice"}')
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.error).toContain("Invalid JSON")
        }
    })

    it("should validate JSON arrays", () => {
        const result = validateJSON('[1, 2, 3]')
        expect(result.valid).toBe(true)
    })

    it("should validate JSON primitives", () => {
        expect(validateJSON('"string"').valid).toBe(true)
        expect(validateJSON('123').valid).toBe(true)
        expect(validateJSON('true').valid).toBe(true)
        expect(validateJSON('null').valid).toBe(true)
    })

    it("should handle whitespace", () => {
        const result = validateJSON('   {"key": "value"}   ')
        expect(result.valid).toBe(true)
    })
})

describe("formatJSON", () => {
    it("should format compact JSON", () => {
        const input = '{"name":"Alice","age":30}'
        const result = formatJSON(input)

        expect(result).toContain('\n')
        expect(result).toContain('  ')
        expect(result).toMatch(/"name": "Alice"/)
    })

    it("should use custom indent", () => {
        const input = '{"name":"Alice"}'
        const result = formatJSON(input, 4)

        expect(result).toContain('    ')
    })

    it("should return original string if invalid JSON", () => {
        const input = '{invalid}'
        const result = formatJSON(input)

        expect(result).toBe(input)
    })

    it("should format arrays", () => {
        const input = '[1,2,3]'
        const result = formatJSON(input)

        expect(result).toContain('\n')
        expect(result).toContain('[')
        expect(result).toContain(']')
    })
})

describe("minifyJSON", () => {
    it("should remove whitespace", () => {
        const input = `{
  "name": "Alice",
  "age": 30
}`
        const result = minifyJSON(input)

        expect(result).toBe('{"name":"Alice","age":30}')
        expect(result).not.toContain('\n')
        expect(result).not.toContain('  ')
    })

    it("should return original string if invalid JSON", () => {
        const input = '{invalid}'
        const result = minifyJSON(input)

        expect(result).toBe(input)
    })

    it("should minify arrays", () => {
        const input = '[\n  1,\n  2,\n  3\n]'
        const result = minifyJSON(input)

        expect(result).toBe('[1,2,3]')
    })
})

describe("parseJqOutputStream", () => {
    it("parses identity object output as a single JSON value", () => {
        const result = parseJqOutputStream('{\n  "name": "Alice"\n}\n')

        expect(result.mode).toBe("single-json")
        expect(result.parsed).toEqual([{ name: "Alice" }])
        expect(formatJqParsedOutput(result.parsed, result.mode)).toContain('"name": "Alice"')
    })

    it("parses field access string output", () => {
        const result = parseJqOutputStream('"Alice"\n')

        expect(result.mode).toBe("single-json")
        expect(result.parsed).toEqual(["Alice"])
        expect(formatJqParsedOutput(result.parsed, result.mode)).toBe('"Alice"')
    })

    it("parses array iterator output as a JSON stream", () => {
        const result = parseJqOutputStream("1\n2\n3\n")

        expect(result.mode).toBe("json-stream")
        expect(result.parsed).toEqual([1, 2, 3])
        expect(formatJqParsedOutput(result.parsed, result.mode)).toBe("[\n  1,\n  2,\n  3\n]")
    })

    it("parses mapped string stream without converting it to an escaped string", () => {
        const result = parseJqOutputStream('"Alice"\n"Bob"\n')

        expect(result.mode).toBe("json-stream")
        expect(result.parsed).toEqual(["Alice", "Bob"])
        expect(formatJqParsedOutput(result.parsed, result.mode)).toBe('[\n  "Alice",\n  "Bob"\n]')
    })

    it("parses select output that emits one matching object", () => {
        const result = parseJqOutputStream('{\n  "age": 30\n}\n')

        expect(result.mode).toBe("single-json")
        expect(result.parsed).toEqual([{ age: 30 }])
    })

    it("keeps raw text output as raw text", () => {
        const result = parseJqOutputStream("Alice\nBob\n")

        expect(result.mode).toBe("raw-text")
        expect(result.parsed).toBeNull()
        expect(formatJqParsedOutput(result.parsed, result.mode)).toBe("")
    })

    it("returns an empty mode for empty jq output", () => {
        const result = parseJqOutputStream("\n")

        expect(result.mode).toBe("empty")
        expect(result.parsed).toEqual([])
    })
})

describe("parseJqError", () => {
    it("keeps invalid JSON errors identifiable", () => {
        expect(validateJSON("{ bad json").valid).toBe(false)
    })

    it("normalizes invalid jq syntax errors", () => {
        const message = parseJqError("jq: compile error: syntax error, unexpected '['")

        expect(message).toContain("Syntax error in jq filter")
    })
})
