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
    let errorMessage = text("invalid_json_syntax")

    if (err instanceof SyntaxError) {
        const message = err.message

        // Try to extract position information
        const positionMatch = message.match(/position (\d+)/i)
        const lineMatch = message.match(/line (\d+)/i)
        const columnMatch = message.match(/column (\d+)/i)

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
            const line = lines.length
            const column = lines[lines.length - 1].length + 1
            errorMessage += ` (${text("json_error_at_position")}: ${line}:${column})`
        } else if (lineMatch && columnMatch) {
            errorMessage += ` (${text("json_error_at_position")}: ${lineMatch[1]}:${columnMatch[1]})`
        }

        // Fallback: show the original error message if we couldn't parse it
        if (errorMessage === text("invalid_json_syntax") && message) {
            errorMessage = `${text("invalid_json_syntax")}: ${message}`
        }
    }

    return errorMessage
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
