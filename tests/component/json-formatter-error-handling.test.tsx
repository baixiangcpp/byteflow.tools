import { describe, it, expect } from "vitest"
import { buildJsonParseErrorMessage } from "@/features/tools/json-formatter/error-utils"

/**
 * JSON Formatter Error Handling Tests
 *
 * Tests the actual error message building logic used in src/app/[lang]/json-formatter/page.tsx
 */

describe("buildJsonParseErrorMessage", () => {
    // Mock translation function
    const mockText = (key: string): string => {
        const translations: Record<string, string> = {
            "invalid_json_syntax": "Invalid JSON syntax",
            "json_error_trailing_comma": "Trailing comma detected",
            "json_error_unexpected_token": "Unexpected token found",
            "json_error_unexpected_end": "Unexpected end of JSON",
            "json_error_expected_token": "Expected token missing",
            "json_error_at_position": "at",
        }
        return translations[key] || key
    }

    it("handles trailing comma error with specific message", () => {
        const input = '{"foo": 123,}'
        let error: unknown
        try {
            JSON.parse(input)
        } catch (e) {
            error = e
        }

        const errorMessage = buildJsonParseErrorMessage(input, error!, mockText)

        // Should NOT be generic "Invalid JSON"
        expect(errorMessage).not.toBe("Invalid JSON syntax")
        // Should provide position information
        expect(errorMessage).toMatch(/\d+:\d+/)
        expect(errorMessage).toContain("Trailing comma")
    })

    it("detects object trailing commas from modern V8 expected-property errors", () => {
        const input = '{"foo": 123,}'
        const error = new SyntaxError("Expected double-quoted property name in JSON at position 12")

        const errorMessage = buildJsonParseErrorMessage(input, error, mockText)

        expect(errorMessage).toContain("Trailing comma")
    })

    it("detects array trailing commas from modern V8 closing-bracket errors", () => {
        const input = "[1, 2,]"
        const error = new SyntaxError("Unexpected token ']', \"[1, 2,]\" is not valid JSON")

        const errorMessage = buildJsonParseErrorMessage(input, error, mockText)

        expect(errorMessage).toContain("Trailing comma")
    })

    it("does not mislabel a missing property value as a trailing comma", () => {
        const input = '{"foo":}'
        let error: unknown
        try {
            JSON.parse(input)
        } catch (e) {
            error = e
        }

        const errorMessage = buildJsonParseErrorMessage(input, error!, mockText)

        expect(errorMessage).not.toContain("Trailing comma")
        expect(errorMessage.toLowerCase()).toMatch(/unexpected token|expected token/)
    })

    it("does not mislabel a missing property value followed by a comma as a trailing comma", () => {
        const input = '{"foo":,}'
        const error = new SyntaxError("Unexpected token '}', \"{\"foo\":,}\" is not valid JSON")

        const errorMessage = buildJsonParseErrorMessage(input, error, mockText)

        expect(errorMessage).not.toContain("Trailing comma")
        expect(errorMessage.toLowerCase()).toMatch(/unexpected token|expected token/)
    })

    it("handles missing closing brace with helpful message", () => {
        const input = '{"foo": "bar"'
        let error: unknown
        try {
            JSON.parse(input)
        } catch (e) {
            error = e
        }

        const errorMessage = buildJsonParseErrorMessage(input, error!, mockText)

        // Should provide helpful, specific error (not just "Invalid JSON")
        expect(errorMessage).not.toBe("Invalid JSON syntax")
        // Should include position information
        expect(errorMessage).toMatch(/\d+:\d+/)
        // Should mention missing/expected token or similar
        expect(errorMessage.toLowerCase()).toMatch(/expected|missing|unexpected/)
    })

    it("handles unquoted key error", () => {
        const input = '{foo: 123}'
        let error: unknown
        try {
            JSON.parse(input)
        } catch (e) {
            error = e
        }

        const errorMessage = buildJsonParseErrorMessage(input, error!, mockText)

        // Should provide helpful, specific error
        expect(errorMessage).not.toBe("Invalid JSON syntax")
        // Should include position information
        expect(errorMessage).toMatch(/\d+:\d+/)
        // Should mention token-related error
        expect(errorMessage.toLowerCase()).toMatch(/expected|token|missing/)
    })

    it("handles single quotes instead of double quotes", () => {
        const input = `{'foo': 'bar'}`
        let error: unknown
        try {
            JSON.parse(input)
        } catch (e) {
            error = e
        }

        const errorMessage = buildJsonParseErrorMessage(input, error!, mockText)

        // Should provide helpful error
        expect(errorMessage).not.toBe("Invalid JSON syntax")
        // Should include position information
        expect(errorMessage).toMatch(/\d+:\d+/)
        // Should mention token-related error
        expect(errorMessage.toLowerCase()).toMatch(/expected|token|missing/)
    })

    it("includes position information when available", () => {
        const input = '{"foo": 123,}'
        let error: unknown
        try {
            JSON.parse(input)
        } catch (e) {
            error = e
        }

        const errorMessage = buildJsonParseErrorMessage(input, error!, mockText)

        // Should include position info (line:column)
        expect(errorMessage).toMatch(/at.*\d+:\d+/)
    })

    it("returns helpful message for non-SyntaxError", () => {
        const input = '{"valid": "json"}'
        const customError = new Error("Some other error")

        const errorMessage = buildJsonParseErrorMessage(input, customError, mockText)

        // Should return generic message for non-SyntaxError
        expect(errorMessage).toBe("Invalid JSON syntax")
    })

    it("uses translation function for all error messages", () => {
        const customText = (key: string) => `TRANSLATED_${key}`
        const input = '{"foo": 123,}'

        let error: unknown
        try {
            JSON.parse(input)
        } catch (e) {
            error = e
        }

        const errorMessage = buildJsonParseErrorMessage(input, error!, customText)

        // Should use custom translation
        expect(errorMessage).toContain("TRANSLATED_")
    })

    it("all test inputs are actually invalid JSON", () => {
        const testInputs = [
            '{"foo": 123,}',
            '{"foo":}',
            '{"foo": "bar"',
            '{foo: 123}',
            `{'foo': 'bar'}`,
        ]

        testInputs.forEach(input => {
            expect(() => JSON.parse(input)).toThrow()
        })
    })
})
