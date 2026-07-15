import {
    serializeSpreadsheetSafeCsv,
    type SpreadsheetSafeCsvCell,
} from "@/core/files/csv-export"
import { JSON_ARRAY_REQUIRED_ERROR } from "./constants"
import type { CsvJsonDiagnostic } from "./types"

type ParsedCsvRecord = {
    fields: string[]
    row: number
}

export type CsvToJsonResult = {
    output: string
    diagnostics: CsvJsonDiagnostic[]
    detectedDelimiter: string
}

const DELIMITER_CANDIDATES = [",", ";", "\t", "|"] as const
const DELIMITER_SAMPLE_RECORDS = 50
const MAX_CSV_DIAGNOSTICS = 100

class CsvSyntaxError extends Error {
    constructor(message: string, row: number, column: number) {
        super(`Malformed CSV at row ${row}, column ${column}: ${message}`)
        this.name = "CsvSyntaxError"
    }
}

function stripBom(csv: string): string {
    return csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv
}

function parseCSVRecords(csv: string, delimiter: string): ParsedCsvRecord[] {
    const records: ParsedCsvRecord[] = []
    let currentField = ""
    let currentRecord: string[] = []
    let inQuotes = false
    let afterClosingQuote = false
    let row = 1
    let column = 1
    let recordStartRow = 1
    let quoteStartRow = 1
    let quoteStartColumn = 1

    const finishRecord = () => {
        currentRecord.push(currentField)
        records.push({ fields: currentRecord, row: recordStartRow })
        currentField = ""
        currentRecord = []
    }

    for (let i = 0; i < csv.length; i++) {
        const ch = csv[i]

        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < csv.length && csv[i + 1] === '"') {
                    currentField += '"'
                    i++
                    column += 2
                } else {
                    inQuotes = false
                    afterClosingQuote = true
                    column++
                }
            } else if (ch === "\r" || ch === "\n") {
                currentField += ch
                if (ch === "\r" && csv[i + 1] === "\n") {
                    currentField += "\n"
                    i++
                }
                row++
                column = 1
            } else {
                currentField += ch
                column++
            }
            continue
        }

        if (afterClosingQuote) {
            if (ch === delimiter) {
                currentRecord.push(currentField)
                currentField = ""
                afterClosingQuote = false
                column++
                continue
            }
            if (ch === "\r" || ch === "\n") {
                finishRecord()
                afterClosingQuote = false
                if (ch === "\r" && csv[i + 1] === "\n") i++
                row++
                column = 1
                recordStartRow = row
                continue
            }
            throw new CsvSyntaxError(
                `unexpected ${JSON.stringify(ch)} after a closing quote; expected a delimiter or line break.`,
                row,
                column,
            )
        }

        if (ch === '"') {
            if (currentField.length > 0) {
                throw new CsvSyntaxError("a quote must begin at the start of a field.", row, column)
            }
            inQuotes = true
            quoteStartRow = row
            quoteStartColumn = column
            column++
        } else if (ch === delimiter) {
            currentRecord.push(currentField)
            currentField = ""
            column++
        } else if (ch === "\n" || ch === "\r") {
            finishRecord()
            if (ch === "\r" && csv[i + 1] === "\n") i++
            row++
            column = 1
            recordStartRow = row
        } else {
            currentField += ch
            column++
        }
    }

    if (inQuotes) {
        throw new CsvSyntaxError(
            `quoted field is not terminated before end of input (ended at row ${row}, column ${column}).`,
            quoteStartRow,
            quoteStartColumn,
        )
    }

    if (afterClosingQuote || currentField.length > 0 || currentRecord.length > 0) {
        finishRecord()
    }

    return records.filter((record) => record.fields.some((field) => field.trim() !== ""))
}

type DelimiterScore = {
    delimiter: string
    multiColumnRecords: number
    consistentRecords: number
    modalColumns: number
    totalSeparators: number
}

function scoreDelimiter(csv: string, delimiter: string): DelimiterScore | null {
    try {
        const records = parseCSVRecords(csv, delimiter).slice(0, DELIMITER_SAMPLE_RECORDS)
        if (records.length === 0) {
            return { delimiter, multiColumnRecords: 0, consistentRecords: 0, modalColumns: 1, totalSeparators: 0 }
        }

        const widthFrequency = new Map<number, number>()
        let multiColumnRecords = 0
        let totalSeparators = 0
        for (const record of records) {
            const width = record.fields.length
            widthFrequency.set(width, (widthFrequency.get(width) ?? 0) + 1)
            if (width > 1) multiColumnRecords++
            totalSeparators += width - 1
        }

        let modalColumns = 1
        let consistentRecords = 0
        for (const [width, frequency] of widthFrequency) {
            if (frequency > consistentRecords || (frequency === consistentRecords && width > modalColumns)) {
                modalColumns = width
                consistentRecords = frequency
            }
        }

        return { delimiter, multiColumnRecords, consistentRecords, modalColumns, totalSeparators }
    } catch {
        return null
    }
}

function isBetterDelimiterScore(candidate: DelimiterScore, best: DelimiterScore): boolean {
    if (candidate.multiColumnRecords !== best.multiColumnRecords) {
        return candidate.multiColumnRecords > best.multiColumnRecords
    }
    if (candidate.consistentRecords !== best.consistentRecords) {
        return candidate.consistentRecords > best.consistentRecords
    }
    if (candidate.modalColumns !== best.modalColumns) {
        return candidate.modalColumns > best.modalColumns
    }
    return candidate.totalSeparators > best.totalSeparators
}

function detectDelimiter(csv: string): string {
    let best: DelimiterScore | null = null
    for (const delimiter of DELIMITER_CANDIDATES) {
        const score = scoreDelimiter(csv, delimiter)
        if (score && (!best || isBetterDelimiterScore(score, best))) best = score
    }
    return best?.delimiter ?? ","
}

function describeDelimiter(delimiter: string): string {
    if (delimiter === ",") return "comma (,)"
    if (delimiter === ";") return "semicolon (;)"
    if (delimiter === "\t") return "tab (\\t)"
    if (delimiter === "|") return "pipe (|)"
    return JSON.stringify(delimiter)
}

type DiagnosticCollector = {
    diagnostics: CsvJsonDiagnostic[]
    omitted: number
}

function addDiagnostic(collector: DiagnosticCollector, diagnostic: CsvJsonDiagnostic) {
    if (collector.diagnostics.length < MAX_CSV_DIAGNOSTICS) {
        collector.diagnostics.push(diagnostic)
    } else {
        collector.omitted++
    }
}

function finishDiagnostics(collector: DiagnosticCollector): CsvJsonDiagnostic[] {
    if (collector.omitted > 0) {
        collector.diagnostics.push({
            code: "diagnostics_truncated",
            severity: "warning",
            message: `${collector.omitted} additional CSV structure warning(s) were omitted from this preview.`,
        })
    }
    return collector.diagnostics
}

function allocateGeneratedHeader(
    base: string,
    used: Set<string>,
    reserved: Set<string>,
    startingSuffix = 2,
): string {
    if (!used.has(base) && !reserved.has(base)) return base
    let suffix = startingSuffix
    while (used.has(`${base}_${suffix}`) || reserved.has(`${base}_${suffix}`)) suffix++
    return `${base}_${suffix}`
}

function resolveHeaders(record: ParsedCsvRecord, collector: DiagnosticCollector): {
    headers: string[]
    used: Set<string>
    reserved: Set<string>
} {
    const rawHeaders = record.fields.map((header) => header.trim())
    const reserved = new Set(rawHeaders.filter(Boolean))
    const used = new Set<string>()
    const occurrences = new Map<string, number>()
    const headers = rawHeaders.map((rawHeader, index) => {
        if (rawHeader === "") {
            const header = allocateGeneratedHeader(`column_${index + 1}`, used, reserved)
            used.add(header)
            addDiagnostic(collector, {
                code: "blank_header",
                severity: "warning",
                row: record.row,
                column: index + 1,
                message: `Blank header at row ${record.row}, column ${index + 1} was renamed to ${JSON.stringify(header)} to preserve the field.`,
            })
            return header
        }

        const occurrence = (occurrences.get(rawHeader) ?? 0) + 1
        occurrences.set(rawHeader, occurrence)
        if (occurrence === 1) {
            used.add(rawHeader)
            return rawHeader
        }

        const header = allocateGeneratedHeader(rawHeader, used, reserved, occurrence)
        used.add(header)
        addDiagnostic(collector, {
            code: "duplicate_header",
            severity: "warning",
            row: record.row,
            column: index + 1,
            message: `Duplicate header ${JSON.stringify(rawHeader)} at row ${record.row}, column ${index + 1} was renamed to ${JSON.stringify(header)} to prevent an overwrite.`,
        })
        return header
    })

    return { headers, used, reserved }
}

function formatHeaderList(headers: string[]): string {
    const visibleHeaders = headers.slice(0, 5).map((header) => JSON.stringify(header)).join(", ")
    return headers.length > 5 ? `${visibleHeaders}, and ${headers.length - 5} more` : visibleHeaders
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

export function csvToJsonWithDiagnostics(
    csv: string,
    delimiter: string,
    hasHeader: boolean,
    typeInference: boolean,
): CsvToJsonResult {
    const normalizedCsv = stripBom(csv)
    const effectiveDelimiter = delimiter === "auto" ? detectDelimiter(normalizedCsv) : delimiter
    const records = parseCSVRecords(normalizedCsv, effectiveDelimiter)
    if (records.length === 0) {
        return { output: "[]", diagnostics: [], detectedDelimiter: effectiveDelimiter }
    }

    const collector: DiagnosticCollector = { diagnostics: [], omitted: 0 }
    if (delimiter === "auto") {
        addDiagnostic(collector, {
            code: "delimiter_detected",
            severity: "info",
            delimiter: effectiveDelimiter,
            message: `Auto-detected ${describeDelimiter(effectiveDelimiter)} as the delimiter after comparing ${Math.min(records.length, DELIMITER_SAMPLE_RECORDS)} record(s).`,
        })
    }

    if (hasHeader) {
        const headerRecord = records[0]
        const originalHeaderWidth = headerRecord.fields.length
        const { headers, used, reserved } = resolveHeaders(headerRecord, collector)
        const dataRecords = records.slice(1)
        const resolvedWidth = dataRecords.reduce(
            (maximum, record) => Math.max(maximum, record.fields.length),
            originalHeaderWidth,
        )
        for (let index = originalHeaderWidth; index < resolvedWidth; index++) {
            const header = allocateGeneratedHeader(`column_${index + 1}`, used, reserved)
            headers.push(header)
            used.add(header)
        }

        const result = dataRecords.map((record) => {
            const values = record.fields
            if (values.length > originalHeaderWidth) {
                const generatedHeaders = headers.slice(originalHeaderWidth, values.length)
                addDiagnostic(collector, {
                    code: "extra_columns",
                    severity: "warning",
                    row: record.row,
                    column: originalHeaderWidth + 1,
                    message: `Row ${record.row} has ${values.length} fields but the header has ${originalHeaderWidth}. Extra fields were preserved as ${formatHeaderList(generatedHeaders)}.`,
                })
            }
            if (values.length < resolvedWidth) {
                addDiagnostic(collector, {
                    code: "missing_columns",
                    severity: "warning",
                    row: record.row,
                    column: values.length + 1,
                    message: `Row ${record.row} has ${values.length} fields but the resolved header has ${resolvedWidth}. ${resolvedWidth - values.length} missing field(s) were padded with empty values.`,
                })
            }

            const obj: Record<string, unknown> = Object.create(null) as Record<string, unknown>
            headers.forEach((h, i) => {
                const raw = values[i] ?? ""
                obj[h] = typeInference ? inferType(raw) : raw
            })
            return obj
        })
        return {
            output: JSON.stringify(result, null, 2),
            diagnostics: finishDiagnostics(collector),
            detectedDelimiter: effectiveDelimiter,
        }
    } else {
        const expectedWidth = records[0].fields.length
        const result = records.map((record, index) => {
            if (index > 0 && record.fields.length > expectedWidth) {
                addDiagnostic(collector, {
                    code: "extra_columns",
                    severity: "warning",
                    row: record.row,
                    column: expectedWidth + 1,
                    message: `Row ${record.row} has ${record.fields.length} fields; the first record has ${expectedWidth}. All extra fields were preserved.`,
                })
            } else if (index > 0 && record.fields.length < expectedWidth) {
                addDiagnostic(collector, {
                    code: "missing_columns",
                    severity: "warning",
                    row: record.row,
                    column: record.fields.length + 1,
                    message: `Row ${record.row} has ${record.fields.length} fields; the first record has ${expectedWidth}. The shorter row was preserved without synthesizing fields.`,
                })
            }
            return record.fields.map((value) => (typeInference ? inferType(value) : value))
        })
        return {
            output: JSON.stringify(result, null, 2),
            diagnostics: finishDiagnostics(collector),
            detectedDelimiter: effectiveDelimiter,
        }
    }
}

export function csvToJson(csv: string, delimiter: string, hasHeader: boolean, typeInference: boolean): string {
    return csvToJsonWithDiagnostics(csv, delimiter, hasHeader, typeInference).output
}

function flattenObject(
    obj: Record<string, unknown>,
    prefix = "",
    result: Record<string, SpreadsheetSafeCsvCell> = Object.create(null) as Record<string, SpreadsheetSafeCsvCell>,
    paths = new Map<string, string>(),
): Record<string, SpreadsheetSafeCsvCell> {
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            flattenObject(value as Record<string, unknown>, fullKey, result, paths)
        } else {
            const sourcePath = JSON.stringify([...prefix.split(".").filter(Boolean), key])
            const existingPath = paths.get(fullKey)
            if (existingPath) {
                throw new Error(`JSON paths ${existingPath} and ${sourcePath} both map to CSV column ${JSON.stringify(fullKey)}. Rename a key before converting.`)
            }
            result[fullKey] = value === null || value === undefined ? "" : serializeJsonCsvCell(value)
            paths.set(fullKey, sourcePath)
        }
    }
    return result
}

function serializeJsonCsvCell(value: unknown): SpreadsheetSafeCsvCell {
    if (Array.isArray(value) || (value !== null && typeof value === "object")) {
        return JSON.stringify(value)
    }
    if (
        typeof value === "string"
        || typeof value === "number"
        || typeof value === "boolean"
        || typeof value === "bigint"
    ) {
        return value
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

        const rows: SpreadsheetSafeCsvCell[][] = []
        if (includeHeader) {
            rows.push(allKeys)
        }
        for (const row of flattened) {
            rows.push(allKeys.map((key) => row[key] ?? ""))
        }
        return serializeSpreadsheetSafeCsv(rows, { delimiter: effectiveDelimiter })
    }

    const rows: SpreadsheetSafeCsvCell[][] = []
    for (const row of parsed) {
        if (Array.isArray(row)) {
            rows.push(row.map((value: unknown) => (
                value === null || value === undefined ? "" : serializeJsonCsvCell(value)
            )))
        } else {
            rows.push([row === null ? "null" : serializeJsonCsvCell(row)])
        }
    }
    return serializeSpreadsheetSafeCsv(rows, { delimiter: effectiveDelimiter })
}
