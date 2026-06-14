/**
 * Local log parser utilities for JSON Lines, plain text, and common log formats
 */

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "WARNING" | "ERROR" | "FATAL" | "UNKNOWN"

export interface ParsedLogEntry {
    lineNumber: number
    raw: string
    timestamp?: string
    level?: LogLevel
    message?: string
    fields?: Record<string, unknown>
}

export interface LogAnalysis {
    entries: ParsedLogEntry[]
    totalLines: number
    parsedCount: number
    unparsedCount: number
    levelCounts: Record<LogLevel, number>
}

const LEVEL_PATTERNS = /\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i

/**
 * Try to parse a line as JSON
 */
function tryParseJSON(line: string): Record<string, unknown> | null {
    try {
        const parsed = JSON.parse(line)
        if (typeof parsed === "object" && parsed !== null) {
            return parsed as Record<string, unknown>
        }
    } catch {
        // Not JSON
    }
    return null
}

/**
 * Extract log level from text
 */
function extractLevel(text: string): LogLevel | undefined {
    const match = text.match(LEVEL_PATTERNS)
    if (match) {
        const level = match[1].toUpperCase()
        if (level === "WARN" || level === "WARNING") return "WARN"
        return level as LogLevel
    }
    return undefined
}

/**
 * Extract timestamp from common formats
 */
function extractTimestamp(text: string): string | undefined {
    // ISO 8601
    const iso = text.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?/)
    if (iso) return iso[0]

    // Common log format: DD/Mon/YYYY:HH:MM:SS
    const common = text.match(/\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2}/)
    if (common) return common[0]

    // Unix timestamp (seconds or milliseconds)
    const unix = text.match(/\b(1[0-9]{9,12})\b/)
    if (unix) {
        const ts = parseInt(unix[1])
        // Convert to ISO
        const date = new Date(ts > 9999999999 ? ts : ts * 1000)
        return date.toISOString()
    }

    return undefined
}

/**
 * Parse a single log line
 */
export function parseLogLine(line: string, lineNumber: number): ParsedLogEntry {
    const entry: ParsedLogEntry = {
        lineNumber,
        raw: line,
    }

    // Try JSON first (NDJSON / JSON Lines)
    const json = tryParseJSON(line)
    if (json) {
        entry.fields = json

        // Extract common fields
        if (typeof json.timestamp === "string") entry.timestamp = json.timestamp
        if (typeof json.time === "string") entry.timestamp = json.time
        if (typeof json.level === "string") entry.level = extractLevel(json.level)
        if (typeof json.severity === "string") entry.level = extractLevel(json.severity)
        if (typeof json.message === "string") entry.message = json.message
        if (typeof json.msg === "string") entry.message = json.msg

        return entry
    }

    // Plain text parsing
    entry.timestamp = extractTimestamp(line)
    entry.level = extractLevel(line)
    entry.message = line

    return entry
}

/**
 * Parse multiple log lines
 */
export function parseLogs(text: string): LogAnalysis {
    const lines = text.split("\n")
    const entries = lines
        .map((line, idx) => ({ line, lineNumber: idx + 1 }))
        .filter(({ line }) => line.trim().length > 0)
        .map(({ line, lineNumber }) => parseLogLine(line, lineNumber))

    const levelCounts: Record<LogLevel, number> = {
        TRACE: 0,
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        WARNING: 0,
        ERROR: 0,
        FATAL: 0,
        UNKNOWN: 0,
    }

    let parsedCount = 0
    entries.forEach((entry) => {
        if (entry.level || entry.timestamp || entry.fields) {
            parsedCount++
        }
        if (entry.level) {
            levelCounts[entry.level]++
        } else {
            levelCounts.UNKNOWN++
        }
    })

    return {
        entries,
        totalLines: lines.length,
        parsedCount,
        unparsedCount: entries.length - parsedCount,
        levelCounts,
    }
}

/**
 * Filter log entries
 */
export function filterLogs(
    entries: ParsedLogEntry[],
    options: {
        levels?: LogLevel[]
        keyword?: string
    },
): ParsedLogEntry[] {
    let filtered = entries

    if (options.levels && options.levels.length > 0) {
        filtered = filtered.filter((e) => e.level && options.levels!.includes(e.level))
    }

    if (options.keyword && options.keyword.trim()) {
        const keyword = options.keyword.toLowerCase()
        filtered = filtered.filter((e) => e.raw.toLowerCase().includes(keyword))
    }

    return filtered
}

/**
 * Export logs to CSV
 */
export function exportToCSV(entries: ParsedLogEntry[]): string {
    const lines = ["Line,Timestamp,Level,Message"]

    entries.forEach((entry) => {
        const line = entry.lineNumber
        const timestamp = entry.timestamp || ""
        const level = entry.level || "UNKNOWN"
        const message = (entry.message || entry.raw).replace(/"/g, '""')
        lines.push(`${line},"${timestamp}","${level}","${message}"`)
    })

    return lines.join("\n")
}

/**
 * Export logs to JSON
 */
export function exportToJSON(entries: ParsedLogEntry[]): string {
    return JSON.stringify(entries, null, 2)
}
