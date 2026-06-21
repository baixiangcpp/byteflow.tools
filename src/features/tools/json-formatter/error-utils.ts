export type JsonParseErrorDetails = {
    message: string
    line: number | null
    column: number | null
    snippet: string | null
}

export function buildJsonParseErrorDetails(
    source: string,
    err: unknown,
    text: (key: string) => string,
): JsonParseErrorDetails {
    let errorMessage = text("invalid_json_syntax")
    let line: number | null = null
    let column: number | null = null

    if (err instanceof SyntaxError) {
        const message = err.message

        // Try to extract position information
        const positionMatch = message.match(/position (\d+)/i)
        const lineColumnMatch = message.match(/line (\d+)\s+column (\d+)/i)
        const lineMatch = lineColumnMatch ? null : message.match(/line (\d+)/i)
        const columnMatch = lineColumnMatch ? null : message.match(/column (\d+)/i)

        const position = positionMatch ? parseInt(positionMatch[1], 10) : null
        const previousNonWhitespace = position === null
            ? ""
            : source.slice(0, position).trimEnd().at(-1) || ""

        const hasTrailingCommaBeforeClose = detectTrailingCommaBeforeClose(source, position)

        // Common error patterns
        if (message.includes("Unexpected token") || message.includes("Unexpected end")) {
            if (
                message.includes("Unexpected token ','")
                || ((message.includes("Unexpected token '}'") || message.includes("Unexpected token ']'")) && previousNonWhitespace === ",")
                || hasTrailingCommaBeforeClose
            ) {
                errorMessage = text("json_error_trailing_comma")
            } else if (message.includes("Unexpected token '['") || message.includes("Unexpected token '{'")) {
                errorMessage = text("json_error_unexpected_token")
            } else if (message.includes("Unexpected end")) {
                errorMessage = text("json_error_unexpected_end")
            } else {
                errorMessage = text("json_error_unexpected_token")
            }
        } else if (hasTrailingCommaBeforeClose) {
            errorMessage = text("json_error_trailing_comma")
        } else if (message.includes("Expected") || message.includes("expecting")) {
            errorMessage = text("json_error_expected_token")
        }

        // Append position if available
        if (positionMatch) {
            const position = positionMatch[1]
            // Calculate line and column from position
            const lines = source.substring(0, parseInt(position)).split('\n')
            line = lines.length
            column = lines[lines.length - 1].length + 1
            errorMessage += ` (${text("json_error_at_position")}: ${line}:${column})`
        } else if (lineColumnMatch) {
            line = parseInt(lineColumnMatch[1], 10)
            column = parseInt(lineColumnMatch[2], 10)
            errorMessage += ` (${text("json_error_at_position")}: ${line}:${column})`
        } else if (lineMatch && columnMatch) {
            line = parseInt(lineMatch[1], 10)
            column = parseInt(columnMatch[1], 10)
            errorMessage += ` (${text("json_error_at_position")}: ${lineMatch[1]}:${columnMatch[1]})`
        } else if (message.includes("Unexpected end") && source.length > 0) {
            const location = offsetToLineColumn(source, source.length)
            line = location.line
            column = location.column
            errorMessage += ` (${text("json_error_at_position")}: ${line}:${column})`
        }

        // Fallback: show the original error message if we couldn't parse it
        if (errorMessage === text("invalid_json_syntax") && message) {
            errorMessage = `${text("invalid_json_syntax")}: ${message}`
        }
    }

    return {
        message: errorMessage,
        line,
        column,
        snippet: line === null || column === null ? null : buildNearbySnippet(source, line, column),
    }
}

/**
 * Build a user-friendly error message from a JSON.parse failure.
 *
 * @param source - The original JSON string that failed to parse
 * @param err - The error thrown by JSON.parse
 * @param text - Translation function for error message keys
 * @returns A helpful error message with position information when available
 */
export function buildJsonParseErrorMessage(
    source: string,
    err: unknown,
    text: (key: string) => string,
): string {
    return buildJsonParseErrorDetails(source, err, text).message
}

function detectTrailingCommaBeforeClose(source: string, position: number | null): boolean {
    const searchStart = position ?? 0
    const closeIndex = source.slice(searchStart).search(/[}\]]/)
    if (closeIndex < 0) return false

    const absoluteCloseIndex = searchStart + closeIndex
    const beforeClose = source.slice(0, absoluteCloseIndex).trimEnd()
    if (!beforeClose.endsWith(",")) return false

    const beforeComma = beforeClose.slice(0, -1).trimEnd()
    const valueEnd = beforeComma.at(-1) || ""
    return /["}\]0-9eElL]/.test(valueEnd)
}

function offsetToLineColumn(source: string, offset: number): { line: number; column: number } {
    const safeOffset = Math.max(0, Math.min(offset, source.length))
    const lines = source.slice(0, safeOffset).split("\n")
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
    }
}

function buildNearbySnippet(source: string, line: number, column: number): string | null {
    const lines = source.split("\n")
    const targetLine = lines[line - 1]
    if (targetLine === undefined) return null

    const maxLineLength = 140
    const zeroBasedColumn = Math.max(0, column - 1)
    const start = Math.max(0, zeroBasedColumn - 60)
    const end = Math.min(targetLine.length, start + maxLineLength)
    const prefix = start > 0 ? "..." : ""
    const suffix = end < targetLine.length ? "..." : ""
    const visibleLine = `${prefix}${targetLine.slice(start, end)}${suffix}`
    const caretOffset = prefix.length + Math.max(0, zeroBasedColumn - start)
    const caretLine = `${" ".repeat(Math.min(caretOffset, visibleLine.length))}^`

    const previousLine = lines[line - 2]
    const nextLine = lines[line]
    return [
        previousLine === undefined ? null : previousLine.slice(0, maxLineLength),
        visibleLine,
        caretLine,
        nextLine === undefined ? null : nextLine.slice(0, maxLineLength),
    ].filter((part): part is string => part !== null).join("\n")
}
