import { csvToJson, jsonToCsv } from "./logic"
import type { Direction } from "./types"

export type CsvJsonTaskInput = {
    input: string
    direction: Direction
    delimiter: string
    hasHeader: boolean
    typeInference: boolean
}

export type CsvJsonTaskResult = {
    output: string
}

export function runCsvJsonTaskSync({
    input,
    direction,
    delimiter,
    hasHeader,
    typeInference,
}: CsvJsonTaskInput): CsvJsonTaskResult {
    return {
        output: direction === "csv-to-json"
            ? csvToJson(input, delimiter, hasHeader, typeInference)
            : jsonToCsv(input, delimiter, hasHeader),
    }
}
