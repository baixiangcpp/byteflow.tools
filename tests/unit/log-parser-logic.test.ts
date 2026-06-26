/**
 * Tests for log-parser-utils
 */

import { describe, it, expect } from "vitest"
import {
    parseLogLine,
    parseLogs,
    filterLogs,
    exportToCSV,
    exportToJSON,
} from "../../src/lib/log-parser-utils"

describe("parseLogLine", () => {
    it("should parse JSON line", () => {
        const line = '{"timestamp":"2024-01-15T10:30:00Z","level":"INFO","message":"Server started"}'
        const result = parseLogLine(line, 1)

        expect(result.lineNumber).toBe(1)
        expect(result.timestamp).toBe("2024-01-15T10:30:00Z")
        expect(result.level).toBe("INFO")
        expect(result.message).toBe("Server started")
        expect(result.fields).toBeDefined()
    })

    it("should parse plain text with ISO timestamp", () => {
        const line = "2024-01-15T10:30:00Z INFO Server started on port 3000"
        const result = parseLogLine(line, 1)

        expect(result.timestamp).toBe("2024-01-15T10:30:00Z")
        expect(result.level).toBe("INFO")
        expect(result.message).toBe(line)
    })

    it("should extract log level", () => {
        expect(parseLogLine("ERROR: Failed to connect", 1).level).toBe("ERROR")
        expect(parseLogLine("WARN: Slow query", 1).level).toBe("WARN")
        expect(parseLogLine("INFO: Request processed", 1).level).toBe("INFO")
        expect(parseLogLine("DEBUG: Variable value: 42", 1).level).toBe("DEBUG")
    })

    it("should extract Unix timestamp", () => {
        const line = "1705315800 INFO Server started"
        const result = parseLogLine(line, 1)

        expect(result.timestamp).toBeDefined()
        expect(result.timestamp).toContain("2024")
    })

    it("should extract Unix timestamp in milliseconds", () => {
        const line = "1705315800000 ERROR Failed request"
        const result = parseLogLine(line, 1)

        expect(result.timestamp).toBe("2024-01-15T10:50:00.000Z")
        expect(result.level).toBe("ERROR")
    })

    it("should handle lines without timestamp or level", () => {
        const line = "Just a plain log message"
        const result = parseLogLine(line, 1)

        expect(result.timestamp).toBeUndefined()
        expect(result.level).toBeUndefined()
        expect(result.message).toBe(line)
    })
})

describe("parseLogs", () => {
    it("should parse multiple lines", () => {
        const text = `2024-01-15T10:30:00Z INFO Server started
2024-01-15T10:30:01Z WARN Slow query
2024-01-15T10:30:02Z ERROR Connection failed`

        const result = parseLogs(text)

        expect(result.totalLines).toBe(3)
        expect(result.entries).toHaveLength(3)
        expect(result.levelCounts.INFO).toBe(1)
        expect(result.levelCounts.WARN).toBe(1)
        expect(result.levelCounts.ERROR).toBe(1)
    })

    it("should parse JSON Lines format", () => {
        const text = `{"level":"INFO","message":"Line 1"}
{"level":"ERROR","message":"Line 2"}`

        const result = parseLogs(text)

        expect(result.totalLines).toBe(2)
        expect(result.parsedCount).toBe(2)
    })

    it("should count level distribution", () => {
        const text = `INFO: msg1
ERROR: msg2
ERROR: msg3
WARN: msg4`

        const result = parseLogs(text)

        expect(result.levelCounts.INFO).toBe(1)
        expect(result.levelCounts.ERROR).toBe(2)
        expect(result.levelCounts.WARN).toBe(1)
    })

    it("should preserve original line numbers when empty lines are skipped", () => {
        const text = `INFO: first

ERROR: third`

        const result = parseLogs(text)

        expect(result.totalLines).toBe(3)
        expect(result.entries).toHaveLength(2)
        expect(result.entries[0].lineNumber).toBe(1)
        expect(result.entries[1].lineNumber).toBe(3)
    })

    it("should handle malformed JSON-like lines and large log inputs", () => {
        const large = Array.from({ length: 1_000 }, (_, index) => (
            index % 10 === 0
                ? `{"timestamp":"2026-06-10T10:00:00Z","level":"ERROR","message":"failed ${index}"}`
                : `2026-06-10T10:00:00Z INFO request ${index}`
        )).join("\n")
        const result = parseLogs(`{not-json}\n${large}`)

        expect(result.totalLines).toBe(1_001)
        expect(result.entries).toHaveLength(1_001)
        expect(result.entries[0]).toMatchObject({
            lineNumber: 1,
            level: undefined,
            message: "{not-json}",
        })
        expect(result.levelCounts.ERROR).toBe(100)
        expect(result.levelCounts.INFO).toBe(900)
    })
})

describe("filterLogs", () => {
    const entries = [
        parseLogLine('{"level":"INFO","message":"Info message"}', 1),
        parseLogLine('{"level":"ERROR","message":"Error message"}', 2),
        parseLogLine('{"level":"WARN","message":"Warning message"}', 3),
    ]

    it("should filter by level", () => {
        const filtered = filterLogs(entries, { levels: ["ERROR"] })

        expect(filtered).toHaveLength(1)
        expect(filtered[0].level).toBe("ERROR")
    })

    it("should filter by multiple levels", () => {
        const filtered = filterLogs(entries, { levels: ["ERROR", "WARN"] })

        expect(filtered).toHaveLength(2)
    })

    it("should filter by keyword", () => {
        const filtered = filterLogs(entries, { keyword: "Error" })

        expect(filtered).toHaveLength(1)
        expect(filtered[0].message).toContain("Error")
    })

    it("should combine level and keyword filters", () => {
        const filtered = filterLogs(entries, { levels: ["ERROR", "WARN"], keyword: "Error" })

        expect(filtered).toHaveLength(1)
        expect(filtered[0].level).toBe("ERROR")
    })
})

describe("exportToCSV", () => {
    it("should generate CSV with headers", () => {
        const entries = [
            parseLogLine('{"level":"INFO","message":"Test message"}', 1),
        ]

        const csv = exportToCSV(entries)

        expect(csv).toContain("Line,Timestamp,Level,Message")
        expect(csv).toContain("INFO")
        expect(csv).toContain("Test message")
    })

    it("should escape quotes in messages", () => {
        const entries = [
            { lineNumber: 1, raw: 'Message with "quotes"', level: "INFO" as const, message: 'Message with "quotes"' },
        ]

        const csv = exportToCSV(entries)

        expect(csv).toContain('""quotes""')
    })
})

describe("exportToJSON", () => {
    it("should generate valid JSON", () => {
        const entries = [
            parseLogLine('{"level":"INFO","message":"Test"}', 1),
        ]

        const json = exportToJSON(entries)
        const parsed = JSON.parse(json)

        expect(Array.isArray(parsed)).toBe(true)
        expect(parsed).toHaveLength(1)
        expect(parsed[0].level).toBe("INFO")
    })

    it("should export the filtered sanitized subset exactly", () => {
        const entries = parseLogs(`INFO ok
ERROR token=[REDACTED]
WARN skipped`).entries
        const filtered = filterLogs(entries, { levels: ["ERROR"] })

        expect(exportToCSV(filtered)).toContain("token=[REDACTED]")
        expect(exportToCSV(filtered)).not.toContain("WARN skipped")
        expect(exportToJSON(filtered)).toContain("token=[REDACTED]")
        expect(exportToJSON(filtered)).not.toContain("WARN skipped")
    })
})
