import { csvToJsonWithDiagnostics, jsonToCsv } from "./logic"
import type { CsvJsonDiagnostic, Direction } from "./types"

export type CsvJsonTaskInput = {
    input: string
    direction: Direction
    delimiter: string
    hasHeader: boolean
    typeInference: boolean
}

export type CsvJsonTaskResult = {
    output: string
    diagnostics: CsvJsonDiagnostic[]
    detectedDelimiter?: string
}

export function runCsvJsonTaskSync({
    input,
    direction,
    delimiter,
    hasHeader,
    typeInference,
}: CsvJsonTaskInput): CsvJsonTaskResult {
    if (direction === "csv-to-json") {
        return csvToJsonWithDiagnostics(input, delimiter, hasHeader, typeInference)
    }

    return {
        output: jsonToCsv(input, delimiter, hasHeader),
        diagnostics: [],
    }
}
