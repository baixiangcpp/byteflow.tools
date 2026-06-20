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
