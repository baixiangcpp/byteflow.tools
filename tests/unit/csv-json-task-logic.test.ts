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

    it("detects delimiters across quoted logical records without counting quoted delimiters", () => {
        const result = runCsvJsonTaskSync({
            input: '"name,alias";age\n"John,Doe";42\n"Jane,Roe";37',
            direction: "csv-to-json",
            delimiter: "auto",
            hasHeader: true,
            typeInference: true,
        })

        expect(result.detectedDelimiter).toBe(";")
        expect(JSON.parse(result.output)).toEqual([
            { "name,alias": "John,Doe", age: 42 },
            { "name,alias": "Jane,Roe", age: 37 },
        ])
        expect(result.diagnostics).toContainEqual(expect.objectContaining({
            code: "delimiter_detected",
            severity: "info",
            delimiter: ";",
        }))
    })

    it("prefers the delimiter that stays structurally consistent across multiple records", () => {
        const result = runCsvJsonTaskSync({
            input: "name,note;age\nAlice,Al;42\nBob;37",
            direction: "csv-to-json",
            delimiter: "auto",
            hasHeader: true,
            typeInference: false,
        })

        expect(result.detectedDelimiter).toBe(";")
        expect(JSON.parse(result.output)).toEqual([
            { "name,note": "Alice,Al", age: "42" },
            { "name,note": "Bob", age: "37" },
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

    it("removes a leading BOM and preserves CRLF records and trailing empty fields", () => {
        const result = runCsvJsonTaskSync({
            input: "\ufeffa,b,c\r\n1,2,\r\n3,4,5",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: false,
        })

        expect(JSON.parse(result.output)).toEqual([
            { a: "1", b: "2", c: "" },
            { a: "3", b: "4", c: "5" },
        ])
        expect(result.diagnostics).toEqual([])
    })

    it("ignores all-empty CSV records without creating empty JSON rows", () => {
        const result = runCsvJsonTaskSync({
            input: "a,b\n1,2\n\n  ,  \n3,4\n",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: false,
        })

        expect(JSON.parse(result.output)).toEqual([
            { a: "1", b: "2" },
            { a: "3", b: "4" },
        ])
        expect(result.diagnostics).toEqual([])
    })

    it("disambiguates duplicate and blank headers without overwriting fields", () => {
        const result = runCsvJsonTaskSync({
            input: "a,a,,column_3\n1,2,3,4",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })

        expect(JSON.parse(result.output)).toEqual([
            { a: 1, a_2: 2, column_3_2: 3, column_3: 4 },
        ])
        expect(result.diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: "duplicate_header", row: 1, column: 2 }),
            expect.objectContaining({ code: "blank_header", row: 1, column: 3 }),
        ]))
    })

    it("preserves prototype-named CSV headers instead of dropping their values", () => {
        const result = runCsvJsonTaskSync({
            input: "__proto__,constructor,safe\nattacker,constructor-value,ok",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: false,
        })

        expect(JSON.parse(result.output)).toEqual(JSON.parse('[{"__proto__":"attacker","constructor":"constructor-value","safe":"ok"}]'))
    })

    it("preserves extra columns and surfaces both extra and missing row widths", () => {
        const result = runCsvJsonTaskSync({
            input: "a,b\n1,2,3\n4",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: false,
        })

        expect(JSON.parse(result.output)).toEqual([
            { a: "1", b: "2", column_3: "3" },
            { a: "4", b: "", column_3: "" },
        ])
        expect(result.diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: "extra_columns", row: 2, column: 3 }),
            expect.objectContaining({ code: "missing_columns", row: 3, column: 2 }),
        ]))
    })

    it("surfaces width mismatches without changing variable-width array rows", () => {
        const result = runCsvJsonTaskSync({
            input: "1,2\n3,4,\n5",
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: false,
            typeInference: false,
        })

        expect(JSON.parse(result.output)).toEqual([
            ["1", "2"],
            ["3", "4", ""],
            ["5"],
        ])
        expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
            "extra_columns",
            "missing_columns",
        ])
    })

    it("rejects unterminated quoted fields with their opening row and column", () => {
        expect(() => runCsvJsonTaskSync({
            input: "name,note\r\nAlice,\"line 1\r\nline 2",
            direction: "csv-to-json",
            delimiter: "auto",
            hasHeader: true,
            typeInference: false,
        })).toThrow("Malformed CSV at row 2, column 7: quoted field is not terminated")
    })

    it("rejects invalid characters after a closing quote with row and column context", () => {
        expect(() => runCsvJsonTaskSync({
            input: 'a,b\n"x"oops,1',
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: false,
        })).toThrow('Malformed CSV at row 2, column 4: unexpected "o" after a closing quote')
    })

    it("rejects quotes that begin inside an unquoted field", () => {
        expect(() => runCsvJsonTaskSync({
            input: 'a,b\nab"c,1',
            direction: "csv-to-json",
            delimiter: ",",
            hasHeader: true,
            typeInference: false,
        })).toThrow("Malformed CSV at row 2, column 3: a quote must begin at the start of a field")
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

    it("keeps primitive and array rows on the non-object CSV path", () => {
        const primitiveResult = runCsvJsonTaskSync({
            input: "[null,2,\"x\",false]",
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })
        const arrayResult = runCsvJsonTaskSync({
            input: "[[1,\"Ada\"],[2,\"Grace\"]]",
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })

        expect(primitiveResult.output).toBe("null\n2\nx\nfalse")
        expect(arrayResult.output).toBe("1,Ada\n2,Grace")
    })

    it("rejects mixed object and non-object rows with actionable row details", () => {
        expect(() => runCsvJsonTaskSync({
            input: "[{\"id\":1}, null]",
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })).toThrow("JSON array rows must be objects when converting to header-based CSV. Row 2 is null.")

        expect(() => runCsvJsonTaskSync({
            input: "[null, {\"id\":1}]",
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })).toThrow("JSON array rows must be objects when converting to header-based CSV. Row 1 is null.")
    })

    it("serializes nested arrays and objects as JSON cells when converting to CSV", () => {
        const result = runCsvJsonTaskSync({
            input: JSON.stringify([
                {
                    id: 1,
                    tags: ["a", "b"],
                    events: [{ type: "login" }],
                    profile: { name: "Ada", roles: ["admin"] },
                },
            ]),
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })

        expect(result.output).toBe('id,tags,events,profile.name,profile.roles\n1,"[""a"",""b""]","[{""type"":""login""}]",Ada,"[""admin""]"')
    })

    it("rejects dotted keys that would collide with nested JSON paths", () => {
        expect(() => runCsvJsonTaskSync({
            input: '[{"a.b":"first","a":{"b":"second"}}]',
            direction: "json-to-csv",
            delimiter: ",",
            hasHeader: true,
            typeInference: true,
        })).toThrow('both map to CSV column "a.b"')
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
