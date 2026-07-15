export type CurlDiagnosticSeverity = "error" | "warning"

export type CurlDiagnosticCode =
    | "empty_command"
    | "expected_curl"
    | "unterminated_quote"
    | "dangling_escape"
    | "unsupported_operator"
    | "unsupported_option"
    | "missing_option_value"
    | "invalid_method"
    | "invalid_header"
    | "invalid_url"
    | "missing_url"
    | "multiple_urls"
    | "unexpected_argument"
    | "unsupported_data_file"
    | "duplicate_header"

export interface CurlDiagnostic {
    code: CurlDiagnosticCode
    severity: CurlDiagnosticSeverity
    position: number
    token?: string
}

export interface ParsedHeader {
    name: string
    value: string
}

export type CurlDataOption = "-d" | "--data" | "--data-raw" | "--data-binary"

export interface ParsedDataPart {
    option: CurlDataOption
    value: string
}

export interface ParsedRequest {
    method: string
    url: string
    // Existing emitters consume the last-wins projection; entries retain source order.
    headers: Record<string, string>
    headerEntries: ParsedHeader[]
    // Existing emitters consume the cURL-combined body; parts retain each source flag.
    data: string
    dataParts: ParsedDataPart[]
    dataType: "raw" | "json" | "form"
}

export type CurlParseResult =
    | { ok: true; request: ParsedRequest; diagnostics: CurlDiagnostic[] }
    | { ok: false; diagnostics: CurlDiagnostic[] }

interface CurlToken {
    value: string
    position: number
}

type TokenizeResult =
    | { ok: true; tokens: CurlToken[] }
    | { ok: false; diagnostic: CurlDiagnostic }

type QuoteMode = "single" | "double" | null

const HTTP_METHOD_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/
const HEADER_NAME_PATTERN = HTTP_METHOD_PATTERN
const SHELL_OPERATOR_CHARS = new Set([";", "|", "&", "<", ">", "(", ")", "`"])
const DATA_OPTIONS = new Set<CurlDataOption>(["-d", "--data", "--data-raw", "--data-binary"])

function diagnostic(
    code: CurlDiagnosticCode,
    position: number,
    token?: string,
    severity: CurlDiagnosticSeverity = "error",
): CurlDiagnostic {
    return { code, severity, position: position + 1, ...(token === undefined ? {} : { token }) }
}

function lineContinuationLength(input: string, slashIndex: number): number {
    if (input[slashIndex] !== "\\") return 0
    if (input[slashIndex + 1] === "\n") return 2
    if (input[slashIndex + 1] === "\r" && input[slashIndex + 2] === "\n") return 3
    return 0
}

function shellOperatorAt(input: string, index: number, tokenStarted: boolean): string | null {
    if (input.startsWith("&&", index) || input.startsWith("||", index)) {
        return input.slice(index, index + 2)
    }
    if (input.startsWith("$(", index)) return "$("
    const ch = input[index]
    if (SHELL_OPERATOR_CHARS.has(ch)) return ch
    if (ch === "#" && !tokenStarted) return ch
    if (ch === "\r" || ch === "\n") return "newline"
    return null
}

function shellExpansionAt(input: string, index: number): string | null {
    if (input[index] !== "$") return null

    const next = input[index + 1]
    if (next === "{") {
        const closingBrace = input.indexOf("}", index + 2)
        return closingBrace === -1 ? "${" : input.slice(index, closingBrace + 1)
    }
    if (next && /[A-Za-z_]/.test(next)) {
        let end = index + 2
        while (end < input.length && /[A-Za-z0-9_]/.test(input[end])) end++
        return input.slice(index, end)
    }
    if (next && /[0-9@*#?$!_-]/.test(next)) return input.slice(index, index + 2)
    return null
}

function tokenizeCurl(input: string): TokenizeResult {
    const tokens: CurlToken[] = []
    let value = ""
    let tokenStart = 0
    let tokenStarted = false
    let quoteMode: QuoteMode = null
    let quoteStart = 0

    const startToken = (position: number) => {
        if (tokenStarted) return
        tokenStarted = true
        tokenStart = position
    }

    const pushToken = () => {
        if (!tokenStarted) return
        tokens.push({ value, position: tokenStart })
        value = ""
        tokenStarted = false
    }

    for (let i = 0; i < input.length; i++) {
        const ch = input[i]

        if (quoteMode === "single") {
            if (ch === "'") {
                quoteMode = null
            } else {
                value += ch
            }
            continue
        }

        if (quoteMode === "double") {
            if (ch === '"') {
                quoteMode = null
                continue
            }
            if (ch === "\\") {
                const continuationLength = lineContinuationLength(input, i)
                if (continuationLength > 0) {
                    i += continuationLength - 1
                    continue
                }
                if (i + 1 >= input.length) {
                    return { ok: false, diagnostic: diagnostic("dangling_escape", i, "\\") }
                }
                const next = input[i + 1]
                if (next === '"' || next === "\\" || next === "$" || next === "`") {
                    value += next
                    i++
                } else {
                    value += "\\"
                }
                continue
            }
            const operator = shellOperatorAt(input, i, tokenStarted)
            if (operator === "`" || operator === "$(") {
                return { ok: false, diagnostic: diagnostic("unsupported_operator", i, operator) }
            }
            const expansion = shellExpansionAt(input, i)
            if (expansion) {
                return { ok: false, diagnostic: diagnostic("unsupported_operator", i, expansion) }
            }
            value += ch
            continue
        }

        if (ch === " " || ch === "\t") {
            pushToken()
            continue
        }

        if (ch === "\\") {
            const continuationLength = lineContinuationLength(input, i)
            if (continuationLength > 0) {
                i += continuationLength - 1
                continue
            }
            if (i + 1 >= input.length) {
                return { ok: false, diagnostic: diagnostic("dangling_escape", i, "\\") }
            }
            startToken(i)
            value += input[i + 1]
            i++
            continue
        }

        if (ch === "'" || ch === '"') {
            startToken(i)
            quoteMode = ch === "'" ? "single" : "double"
            quoteStart = i
            continue
        }

        const operator = shellOperatorAt(input, i, tokenStarted)
        if (operator) {
            return { ok: false, diagnostic: diagnostic("unsupported_operator", i, operator) }
        }
        const expansion = shellExpansionAt(input, i)
        if (expansion) {
            return { ok: false, diagnostic: diagnostic("unsupported_operator", i, expansion) }
        }

        startToken(i)
        value += ch
    }

    if (quoteMode) {
        return {
            ok: false,
            diagnostic: diagnostic("unterminated_quote", quoteStart, quoteMode === "single" ? "'" : '"'),
        }
    }

    pushToken()
    return { ok: true, tokens }
}

function parseHttpUrl(value: string): string | null {
    try {
        const parsed = new URL(value)
        return parsed.protocol === "http:" || parsed.protocol === "https:" ? value : null
    } catch {
        return null
    }
}

function splitLongOption(token: CurlToken): { option: string; inlineValue?: CurlToken } {
    if (!token.value.startsWith("--")) return { option: token.value }
    const equalsIndex = token.value.indexOf("=")
    if (equalsIndex === -1) return { option: token.value }
    return {
        option: token.value.slice(0, equalsIndex),
        inlineValue: {
            value: token.value.slice(equalsIndex + 1),
            position: token.position + equalsIndex + 1,
        },
    }
}

function inferDataType(headers: Record<string, string>, hasData: boolean): ParsedRequest["dataType"] {
    if (!hasData) return "raw"

    const contentType = Object.entries(headers)
        .find(([name]) => name.toLowerCase() === "content-type")?.[1]
    if (contentType === undefined) return "form"

    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase()
    if (mediaType === "application/json" || mediaType.endsWith("+json")) return "json"
    if (mediaType === "application/x-www-form-urlencoded") return "form"
    return "raw"
}

export function parseCurl(input: string): CurlParseResult {
    const tokenized = tokenizeCurl(input)
    if (!tokenized.ok) return { ok: false, diagnostics: [tokenized.diagnostic] }
    if (tokenized.tokens.length === 0) {
        return { ok: false, diagnostics: [diagnostic("empty_command", 0)] }
    }

    const command = tokenized.tokens[0]
    if (command.value !== "curl" && command.value !== "curl.exe") {
        return { ok: false, diagnostics: [diagnostic("expected_curl", command.position, command.value)] }
    }

    const diagnostics: CurlDiagnostic[] = []
    const headers: Record<string, string> = {}
    const headerEntries: ParsedHeader[] = []
    const headerNames = new Map<string, string>()
    const dataParts: ParsedDataPart[] = []
    let method = "GET"
    let explicitMethod = false
    let url = ""

    const fail = (error: CurlDiagnostic): CurlParseResult => ({
        ok: false,
        diagnostics: [...diagnostics, error],
    })

    for (let i = 1; i < tokenized.tokens.length; i++) {
        const token = tokenized.tokens[i]
        const { option, inlineValue } = splitLongOption(token)

        if (!option.startsWith("-")) {
            const parsedUrl = parseHttpUrl(token.value)
            if (url) {
                return fail(diagnostic(parsedUrl ? "multiple_urls" : "unexpected_argument", token.position, token.value))
            }
            if (!parsedUrl) return fail(diagnostic("invalid_url", token.position, token.value))
            url = parsedUrl
            continue
        }

        const needsValue = option === "-X" || option === "--request" ||
            option === "-H" || option === "--header" || option === "--url" ||
            DATA_OPTIONS.has(option as CurlDataOption)
        if (!needsValue) {
            return fail(diagnostic("unsupported_option", token.position, option))
        }

        let valueToken = inlineValue
        if (!valueToken) {
            valueToken = tokenized.tokens[i + 1]
            if (valueToken) i++
        }
        if (!valueToken || (valueToken.value === "" && !DATA_OPTIONS.has(option as CurlDataOption))) {
            return fail(diagnostic("missing_option_value", token.position, option))
        }

        if (option === "-X" || option === "--request") {
            if (!HTTP_METHOD_PATTERN.test(valueToken.value)) {
                return fail(diagnostic("invalid_method", valueToken.position, valueToken.value))
            }
            method = valueToken.value.toUpperCase()
            explicitMethod = true
            continue
        }

        if (option === "-H" || option === "--header") {
            const colonIndex = valueToken.value.indexOf(":")
            const name = colonIndex === -1 ? "" : valueToken.value.slice(0, colonIndex).trim()
            const value = colonIndex === -1 ? "" : valueToken.value.slice(colonIndex + 1).trim()
            if (!name || !HEADER_NAME_PATTERN.test(name) || /[\r\n]/.test(value)) {
                return fail(diagnostic("invalid_header", valueToken.position, valueToken.value))
            }

            const normalizedName = name.toLowerCase()
            const previousName = headerNames.get(normalizedName)
            if (previousName) {
                diagnostics.push(diagnostic("duplicate_header", valueToken.position, name, "warning"))
                delete headers[previousName]
            }
            headerNames.set(normalizedName, name)
            headers[name] = value
            headerEntries.push({ name, value })
            continue
        }

        if (option === "--url") {
            const parsedUrl = parseHttpUrl(valueToken.value)
            if (!parsedUrl) return fail(diagnostic("invalid_url", valueToken.position, valueToken.value))
            if (url) return fail(diagnostic("multiple_urls", valueToken.position, valueToken.value))
            url = parsedUrl
            continue
        }

        const dataOption = option as CurlDataOption
        if (dataOption !== "--data-raw" && valueToken.value.startsWith("@")) {
            return fail(diagnostic("unsupported_data_file", valueToken.position, valueToken.value))
        }
        dataParts.push({ option: dataOption, value: valueToken.value })
    }

    if (!url) {
        return fail(diagnostic("missing_url", input.length > 0 ? input.length - 1 : 0))
    }

    const data = dataParts.map((part) => part.value).join("&")
    if (dataParts.length > 0 && !explicitMethod) method = "POST"

    return {
        ok: true,
        request: {
            method,
            url,
            headers,
            headerEntries,
            data,
            dataParts,
            dataType: inferDataType(headers, dataParts.length > 0),
        },
        diagnostics,
    }
}
