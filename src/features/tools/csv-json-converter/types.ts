export type Direction = "csv-to-json" | "json-to-csv"

export type CsvJsonDiagnosticCode =
    | "delimiter_detected"
    | "blank_header"
    | "duplicate_header"
    | "extra_columns"
    | "missing_columns"
    | "diagnostics_truncated"

export type CsvJsonDiagnostic = {
    code: CsvJsonDiagnosticCode
    severity: "info" | "warning"
    message: string
    row?: number
    column?: number
    delimiter?: string
}
