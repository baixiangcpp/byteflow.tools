import { JSON_ARRAY_REQUIRED_ERROR } from "./constants"

function parseCSVLine(line: string, delimiter: string): string[] {
    const fields: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                current += ch
            }
        } else {
            if (ch === '"') {
                inQuotes = true
            } else if (ch === delimiter) {
                fields.push(current)
                current = ""
            } else {
                current += ch
            }
        }
    }
    fields.push(current)
    return fields
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

function inferType(value: string): string | number | boolean | null {
    if (value === "") return null
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== "") return num
    return value
}

export function csvToJson(csv: string, delimiter: string, hasHeader: boolean, typeInference: boolean): string {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== "")
    if (lines.length === 0) return "[]"

    const effectiveDelimiter = delimiter === "auto" ? detectDelimiter(csv) : delimiter

    if (hasHeader) {
        const headers = parseCSVLine(lines[0], effectiveDelimiter)
        const result = lines.slice(1).map((line) => {
            const values = parseCSVLine(line, effectiveDelimiter)
            const obj: Record<string, unknown> = {}
            headers.forEach((h, i) => {
                const raw = values[i] ?? ""
                obj[h.trim()] = typeInference ? inferType(raw) : raw
            })
            return obj
        })
        return JSON.stringify(result, null, 2)
    } else {
        const result = lines.map((line) => {
            const values = parseCSVLine(line, effectiveDelimiter)
            return values.map((v) => (typeInference ? inferType(v) : v))
        })
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
            result[fullKey] = value === null || value === undefined ? "" : String(value)
        }
    }
    return result
}

export function jsonToCsv(json: string, delimiter: string, includeHeader: boolean): string {
    const parsed = JSON.parse(json)
    const effectiveDelimiter = delimiter === "auto" ? "," : delimiter

    if (!Array.isArray(parsed)) {
        throw new Error(JSON_ARRAY_REQUIRED_ERROR)
    }

    if (parsed.length === 0) return ""

    if (typeof parsed[0] === "object" && !Array.isArray(parsed[0])) {
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
                row.map((v: unknown) => escapeCSVField(String(v ?? ""), effectiveDelimiter)).join(effectiveDelimiter)
            )
        } else {
            lines.push(escapeCSVField(String(row), effectiveDelimiter))
        }
    }
    return lines.join("\n")
}
