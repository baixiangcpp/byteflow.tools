import { describe, expect, it } from "vitest"
import { runCsvJsonTaskSync } from "@/features/tools/csv-json-converter/csv-json-task-logic"
import { JSON_ARRAY_REQUIRED_ERROR } from "@/features/tools/csv-json-converter/constants"

describe("csv json task logic", () => {
    it("converts csv to json through the task boundary", () => {
        const result = runCsvJsonTaskSync({
            input: "id,name\n1,Ada",
            direction: "csv-to-json",
            delimiter: "auto",
            hasHeader: true,
            typeInference: true,
        })

        expect(result.output).toBe("[\n  {\n    \"id\": 1,\n    \"name\": \"Ada\"\n  }\n]")
    })

    it("preserves quoted multiline fields and keeps following rows aligned", () => {
        const result = runCsvJsonTaskSync({
            input: "name,note,id\n\"Alice\",\"line 1\nline 2\",1\n\"Bob\",\"after multiline\",2",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })

        expect(JSON.parse(result.output)).toEqual([
            { name: "Alice", note: "line 1\nline 2", id: 1 },
            { name: "Bob", note: "after multiline", id: 2 },
        ])
    })

    it("preserves CRLF inside quoted fields and escaped quotes", () => {
        const result = runCsvJsonTaskSync({
            input: "name,note\r\n\"Alice\",\"line 1\r\nline 2 with \"\"quotes\"\"\"",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: false,
        })

        expect(JSON.parse(result.output)).toEqual([
            { name: "Alice", note: "line 1\r\nline 2 with \"quotes\"" },
        ])
    })

    it("keeps lossy numeric-looking values as strings during type inference", () => {
        const result = runCsvJsonTaskSync({
            input: "zip,code,big,inf,nan,count,temp,zero\n02134,007,12345678901234567890,Infinity,NaN,42,-3.14,0",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })

        expect(JSON.parse(result.output)).toEqual([
            {
                zip: "02134",
                code: "007",
                big: "12345678901234567890",
                inf: "Infinity",
                nan: "NaN",
                count: 42,
                temp: -3.14,
                zero: 0,
            },
        ])
    })

    it("converts json arrays to csv through the task boundary", () => {
        const result = runCsvJsonTaskSync({
            input: "[{\"id\":1,\"name\":\"Ada\"}]",
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })

        expect(result.output).toBe("id,name\n1,Ada")
    })

    it("keeps json-to-csv validation errors stable", () => {
        expect(() => runCsvJsonTaskSync({
            input: "{\"id\":1}",
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })).toThrow(JSON_ARRAY_REQUIRED_ERROR)
    })
})
