/**
 * jq-wasm wrapper utilities for jq Playground
 */

type JqRawResult = {
    stdout: string
    stderr: string
    exitCode: number
}

export type JqOutputMode = "empty" | "single-json" | "json-stream" | "raw-text"

export type JqExecutionResult =
    | {
        success: true
        stdout: string
        stderr: string
        exitCode: number
        parsed: unknown[] | null
        mode: JqOutputMode
    }
    | {
        success: false
        stdout: string
        stderr: string
        exitCode: number | null
        parsed: null
        mode: "error"
        error: string
        rawError: string
    }

let jqRawPromise: Promise<
    (json: string | object, query: string, flags?: string[]) => Promise<JqRawResult>
> | null = null

/**
 * Get jq raw function with lazy loading
 */
async function getJqRaw() {
    if (!jqRawPromise) {
        jqRawPromise = import("jq-wasm").then((mod) => mod.raw)
    }
    return jqRawPromise
}

/**
 * Execute a jq filter on JSON data
 */
export async function executeJqFilter(
    input: unknown,
    filter: string
): Promise<JqExecutionResult> {
    if (typeof window === "undefined") {
        throw new Error("jq-wasm can only run in the browser.")
    }

    if (!filter.trim()) {
        return buildJqErrorResult("jq filter is empty", "", "", null)
    }

    try {
        const raw = await getJqRaw()
        const jsonInput = typeof input === "string" ? input : input
        const result = await raw(jsonInput as string | object, filter)

        if (result.exitCode !== 0 || result.stderr.trim()) {
            return buildJqErrorResult(result.stderr || "jq execution failed", result.stdout, result.stderr, result.exitCode)
        }

        const parsedOutput = parseJqOutputStream(result.stdout)
        return {
            success: true,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            parsed: parsedOutput.parsed,
            mode: parsedOutput.mode,
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return buildJqErrorResult(errorMessage, "", errorMessage, null)
    }
}

function buildJqErrorResult(rawError: string, stdout: string, stderr: string, exitCode: number | null): JqExecutionResult {
    return {
        success: false,
        stdout,
        stderr,
        exitCode,
        parsed: null,
        mode: "error",
        error: parseJqError(rawError),
        rawError,
    }
}

/**
 * Parse jq stdout as a JSON value stream. jq commonly emits one JSON value per
 * result, so filters like `.[]` are valid even when the whole stdout is not one
 * JSON document.
 */
export function parseJqOutputStream(stdout: string): { parsed: unknown[] | null; mode: JqOutputMode } {
    const source = stdout.trim()
    if (!source) {
        return { parsed: [], mode: "empty" }
    }

    const values: unknown[] = []
    let index = 0

    while (index < source.length) {
        while (index < source.length && /\s/.test(source[index])) {
            index++
        }

        if (index >= source.length) {
            break
        }

        let found = false
        for (let end = index + 1; end <= source.length; end++) {
            const next = source[end]
            if (end < source.length && next && !/\s/.test(next)) {
                continue
            }

            try {
                values.push(JSON.parse(source.slice(index, end)))
                index = end
                found = true
                break
            } catch {
                // Keep scanning until the current JSON value is complete.
            }
        }

        if (!found) {
            return { parsed: null, mode: "raw-text" }
        }
    }

    return {
        parsed: values,
        mode: values.length === 1 ? "single-json" : "json-stream",
    }
}

export function formatJqParsedOutput(parsed: unknown[] | null, mode: JqOutputMode): string {
    if (!parsed || mode === "raw-text" || mode === "empty") {
        return ""
    }

    const value = mode === "single-json" ? parsed[0] : parsed
    return JSON.stringify(value, null, 2)
}

/**
 * Parse jq error messages into user-friendly format
 */
export function parseJqError(rawError: string): string {
    // Common jq error patterns
    const patterns: Array<{ regex: RegExp; message: (match: RegExpMatchArray) => string }> = [
        {
            regex: /Cannot iterate over (.*)/,
            message: (m) => `Cannot iterate over ${m[1]}. Make sure the value is an array or object. Try using the optional operator: ${m[1]}[]?`,
        },
        {
            regex: /Cannot index (.*) with (.*)/,
            message: (m) => `Cannot access ${m[2]} in ${m[1]}. Check if the field exists. Try using optional: ${m[1]}.${m[2]}?`,
        },
        {
            regex: /null (.*) and (.*) cannot be (.*)/,
            message: () => `Cannot perform operation on null value. Check if the value exists before using it.`,
        },
        {
            regex: /Unexpected token/,
            message: () => `Syntax error in jq filter. Check for missing quotes, brackets, or operators.`,
        },
        {
            regex: /parse error/i,
            message: () => `Syntax error in jq filter. Verify your filter syntax is correct.`,
        },
        {
            regex: /compile error/i,
            message: () => `Syntax error in jq filter. Verify your filter syntax is correct.`,
        },
    ]

    for (const { regex, message } of patterns) {
        const match = rawError.match(regex)
        if (match) {
            return message(match)
        }
    }

    // Return original error if no pattern matches
    return rawError
}

/**
 * Validate if input is valid JSON
 */
export function validateJSON(input: string): { valid: true } | { valid: false; error: string } {
    if (!input.trim()) {
        return { valid: false, error: "Input is empty" }
    }

    try {
        JSON.parse(input)
        return { valid: true }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { valid: false, error: `Invalid JSON: ${errorMessage}` }
    }
}

/**
 * Format JSON with indentation
 */
export function formatJSON(input: string, indent: number = 2): string {
    try {
        const parsed = JSON.parse(input)
        return JSON.stringify(parsed, null, indent)
    } catch {
        return input
    }
}

/**
 * Minify JSON (remove whitespace)
 */
export function minifyJSON(input: string): string {
    try {
        const parsed = JSON.parse(input)
        return JSON.stringify(parsed)
    } catch {
        return input
    }
}
