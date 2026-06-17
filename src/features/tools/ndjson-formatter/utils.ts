export type NdjsonMessages = {
    error_label: string
    invalid_json_line_label: string
    input_must_be_array_label: string
    invalid_json_label: string
    error_parsing_line_label: string
}

export type NdjsonMode = "format" | "to-ndjson" | "to-array"

export function formatNdjson(input: string, messages: NdjsonMessages): string {
    const lines = input.split("\n").filter((line) => line.trim())
    return lines
        .map((line) => {
            try {
                return JSON.stringify(JSON.parse(line), null, 2)
            } catch {
                return `// ${messages.error_label}: ${messages.invalid_json_line_label}\n${line}`
            }
        })
        .join("\n\n---\n\n")
}

export function jsonArrayToNdjson(input: string, messages: NdjsonMessages): string {
    try {
        const arr = JSON.parse(input)
        if (!Array.isArray(arr)) return `// ${messages.error_label}: ${messages.input_must_be_array_label}`
        return arr.map((item) => JSON.stringify(item)).join("\n")
    } catch (error) {
        return `// ${messages.error_label}: ${error instanceof Error ? error.message : messages.invalid_json_label}`
    }
}

export function ndjsonToArray(input: string, messages: NdjsonMessages): string {
    const lines = input.split("\n").filter((line) => line.trim())
    const items: unknown[] = []
    for (const line of lines) {
        try {
            items.push(JSON.parse(line))
        } catch {
            return `// ${messages.error_parsing_line_label}: ${line}`
        }
    }
    return JSON.stringify(items, null, 2)
}

export function runNdjsonTransform(input: string, mode: NdjsonMode, messages: NdjsonMessages): string {
    switch (mode) {
        case "format":
            return formatNdjson(input, messages)
        case "to-ndjson":
            return jsonArrayToNdjson(input, messages)
        case "to-array":
            return ndjsonToArray(input, messages)
        default:
            return input
    }
}

export function countNdjsonLines(input: string): number {
    return input.split("\n").filter((line) => line.trim()).length
}
