import { JSON_ARRAY_REQUIRED_ERROR } from "./constants"

function parseCSVRecords(csv: string, delimiter: string): string[][] {
    const records: string[][] = []
    let currentField = ""
    let currentRecord: string[] = []
    let inQuotes = false

    for (let i = 0; i < csv.length; i++) {
        const ch = csv[i]

        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < csv.length && csv[i + 1] === '"') {
                    currentField += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                currentField += ch
            }
            continue
        }

        if (ch === '"') {
            inQuotes = true
        } else if (ch === delimiter) {
            currentRecord.push(currentField)
            currentField = ""
        } else if (ch === "\n" || ch === "\r") {
            currentRecord.push(currentField)
            records.push(currentRecord)
            currentField = ""
            currentRecord = []
            if (ch === "\r" && csv[i + 1] === "\n") i++
        } else {
            currentField += ch
        }
    }

    if (currentField.length > 0 || currentRecord.length > 0) {
        currentRecord.push(currentField)
        records.push(currentRecord)
    }

    return records.filter((record) => record.some((field) => field.trim() !== ""))
}

function detectDelimiter(csv: string): string {
    const firstLine = csv.split(/\r?\n/)[0] || ""
    const candidates = [",", ";", "\t", "|"]
    let best = ","
    let bestCount = 0
    for (const d of candidates) {
        const count = firstLine.split(d).length - 1
        if (count > bestCount) {
            bestCount = count
            best = d
        }
    }
    return best
}

const STRICT_DECIMAL_NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/

function inferType(value: string): string | number | boolean | null {
    if (value === "") return null
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
    if (!STRICT_DECIMAL_NUMBER_PATTERN.test(value)) return value
    const num = Number(value)
    if (!Number.isFinite(num)) return value
    if (String(num) !== value) return value
    if (Number.isInteger(num) && !Number.isSafeInteger(num)) return value
    return num
}

export function csvToJson(csv: string, delimiter: string, hasHeader: boolean, typeInference: boolean): string {
    const effectiveDelimiter = delimiter === "auto" ? detectDelimiter(csv) : delimiter
    const records = parseCSVRecords(csv, effectiveDelimiter)
    if (records.length === 0) return "[]"

    if (hasHeader) {
        const headers = records[0]
        const result = records.slice(1).map((values) => {
            const obj: Record<string, unknown> = {}
            headers.forEach((h, i) => {
                const raw = values[i] ?? ""
                obj[h.trim()] = typeInference ? inferType(raw) : raw
            })
            return obj
        })
        return JSON.stringify(result, null, 2)
    } else {
        const result = records.map((values) => values.map((v) => (typeInference ? inferType(v) : v)))
        return JSON.stringify(result, null, 2)
    }
}

function escapeCSVField(value: string, delimiter: string): string {
    if (value.includes('"') || value.includes(delimiter) || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {}
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey))
        } else {
            result[fullKey] = value === null || value === undefined ? "" : serializeCsvCell(value)
        }
    }
    return result
}

function serializeCsvCell(value: unknown): string {
    if (Array.isArray(value) || (value !== null && typeof value === "object")) {
        return JSON.stringify(value)
    }
    return String(value)
}

function isPlainObjectRow(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value)
}

function describeJsonRowShape(value: unknown): string {
    if (value === null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value
}

export function jsonToCsv(json: string, delimiter: string, includeHeader: boolean): string {
    const parsed = JSON.parse(json)
    const effectiveDelimiter = delimiter === "auto" ? "," : delimiter

    if (!Array.isArray(parsed)) {
        throw new Error(JSON_ARRAY_REQUIRED_ERROR)
    }

    if (parsed.length === 0) return ""

    if (parsed.some(isPlainObjectRow)) {
        const invalidRowIndex = parsed.findIndex((item) => !isPlainObjectRow(item))
        if (invalidRowIndex !== -1) {
            throw new Error(`JSON array rows must be objects when converting to header-based CSV. Row ${invalidRowIndex + 1} is ${describeJsonRowShape(parsed[invalidRowIndex])}.`)
        }
        const flattened = parsed.map((item) => flattenObject(item as Record<string, unknown>))
        const allKeys = [...new Set(flattened.flatMap((obj) => Object.keys(obj)))]

        const lines: string[] = []
        if (includeHeader) {
            lines.push(allKeys.map((k) => escapeCSVField(k, effectiveDelimiter)).join(effectiveDelimiter))
        }
        for (const row of flattened) {
            lines.push(
                allKeys.map((k) => escapeCSVField(row[k] ?? "", effectiveDelimiter)).join(effectiveDelimiter)
            )
        }
        return lines.join("\n")
    }

    const lines: string[] = []
    for (const row of parsed) {
        if (Array.isArray(row)) {
            lines.push(
                row.map((v: unknown) => escapeCSVField(v === null || v === undefined ? "" : serializeCsvCell(v), effectiveDelimiter)).join(effectiveDelimiter)
            )
        } else {
            lines.push(escapeCSVField(String(row), effectiveDelimiter))
        }
    }
    return lines.join("\n")
}
