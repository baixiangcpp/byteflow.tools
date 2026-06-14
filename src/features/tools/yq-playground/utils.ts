import YAML from "yaml"

export type YqInputFormat = "auto" | "yaml" | "json"
export type YqOutputFormat = "yaml" | "json"

export interface YqQueryResult {
    output: string
    value: unknown
    documents: number
    format: YqOutputFormat
    warnings: string[]
    error?: string
}

type SelectorToken =
    | { type: "property"; key: string }
    | { type: "index"; index: number }
    | { type: "wildcard" }

function parseInput(input: string, format: YqInputFormat): unknown[] {
    if (format === "json") return [JSON.parse(input)]

    const docs = YAML.parseAllDocuments(input)
    const errors = docs.flatMap((document) => document.errors)
    if (errors.length > 0) throw new Error(errors[0].message)

    const values = docs.map((document) => document.toJSON())
    if (format === "yaml" || values.length > 1) return values

    try {
        return [JSON.parse(input)]
    } catch {
        return values
    }
}

function parseSelector(expression: string): SelectorToken[] {
    const selector = expression.trim()
    if (selector === ".") return []
    if (!selector.startsWith(".")) {
        throw new Error("Query steps must be a path selector like .services[0].name or a supported function.")
    }

    const tokens: SelectorToken[] = []
    let cursor = 1

    while (cursor < selector.length) {
        const char = selector[cursor]
        if (char === ".") {
            cursor += 1
            continue
        }

        if (char === "[") {
            const close = selector.indexOf("]", cursor)
            if (close === -1) throw new Error("Unclosed array selector.")
            const raw = selector.slice(cursor + 1, close).trim()
            if (raw === "*") {
                tokens.push({ type: "wildcard" })
            } else if (/^-?\d+$/.test(raw)) {
                tokens.push({ type: "index", index: Number(raw) })
            } else if ((raw.startsWith("\"") && raw.endsWith("\"")) || (raw.startsWith("'") && raw.endsWith("'"))) {
                tokens.push({ type: "property", key: raw.slice(1, -1) })
            } else {
                throw new Error(`Unsupported bracket selector [${raw}].`)
            }
            cursor = close + 1
            continue
        }

        const match = selector.slice(cursor).match(/^[A-Za-z_$][\w$-]*/)
        if (!match) throw new Error(`Unexpected selector token near "${selector.slice(cursor)}".`)
        tokens.push({ type: "property", key: match[0] })
        cursor += match[0].length
    }

    return tokens
}

function applyToken(values: unknown[], token: SelectorToken): unknown[] {
    const next: unknown[] = []

    for (const value of values) {
        if (token.type === "property") {
            if (value && typeof value === "object" && !Array.isArray(value) && token.key in value) {
                next.push((value as Record<string, unknown>)[token.key])
            }
            continue
        }

        if (token.type === "index") {
            if (Array.isArray(value)) {
                const index = token.index < 0 ? value.length + token.index : token.index
                if (index >= 0 && index < value.length) next.push(value[index])
            }
            continue
        }

        if (Array.isArray(value)) {
            next.push(...value)
        } else if (value && typeof value === "object") {
            next.push(...Object.values(value as Record<string, unknown>))
        }
    }

    return next
}

function applySelector(value: unknown, selector: string): unknown {
    const tokens = parseSelector(selector)
    let values = [value]
    for (const token of tokens) {
        values = applyToken(values, token)
    }
    return values.length === 1 ? values[0] : values
}

function applyFunction(value: unknown, fn: string): unknown {
    if (fn === "keys") {
        if (Array.isArray(value)) return value.map((_, index) => index)
        if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>)
        return []
    }

    if (fn === "length") {
        if (Array.isArray(value) || typeof value === "string") return value.length
        if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>).length
        return 0
    }

    throw new Error(`Unsupported function "${fn}".`)
}

function formatValue(value: unknown, format: YqOutputFormat): string {
    if (format === "json") return JSON.stringify(value, null, 2)
    return YAML.stringify(value)
}

export function runYqQuery(input: string, query: string, options: { inputFormat: YqInputFormat; outputFormat: YqOutputFormat }): YqQueryResult {
    try {
        const documents = parseInput(input, options.inputFormat)
        const warnings: string[] = []
        let value: unknown = documents.length === 1 ? documents[0] : documents
        let outputFormat = options.outputFormat

        const steps = query.trim() ? query.split("|").map((step) => step.trim()).filter(Boolean) : ["."]
        for (const step of steps) {
            if (step === "to_json") {
                outputFormat = "json"
            } else if (step === "to_yaml") {
                outputFormat = "yaml"
            } else if (step === "keys" || step === "length") {
                value = applyFunction(value, step)
            } else {
                value = applySelector(value, step)
            }
        }

        if (query.includes("select(") || query.includes("map(")) {
            warnings.push("This playground supports a practical yq-like subset, not the full yq expression language.")
        }

        return {
            output: formatValue(value, outputFormat),
            value,
            documents: documents.length,
            format: outputFormat,
            warnings,
        }
    } catch (error) {
        return {
            output: "",
            value: null,
            documents: 0,
            format: options.outputFormat,
            warnings: [],
            error: error instanceof Error ? error.message : "Unable to run query.",
        }
    }
}

