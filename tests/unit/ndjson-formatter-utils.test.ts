import { describe, expect, it } from "vitest"
import { countNdjsonLines, runNdjsonTransform, type NdjsonMessages } from "@/features/tools/ndjson-formatter/utils"

const messages: NdjsonMessages = {
    error_label: "Error",
    invalid_json_line_label: "Invalid JSON line",
    input_must_be_array_label: "Input must be a JSON array",
    invalid_json_label: "Invalid JSON",
    error_parsing_line_label: "Error parsing line",
}

describe("ndjson formatter utils", () => {
    it("converts NDJSON records to a JSON array", () => {
        expect(runNdjsonTransform("{\"id\":1}\n{\"id\":2}", "to-array", messages)).toBe("[\n  {\n    \"id\": 1\n  },\n  {\n    \"id\": 2\n  }\n]")
    })

    it("converts JSON arrays to NDJSON records", () => {
        expect(runNdjsonTransform("[{\"id\":1},{\"id\":2}]", "to-ndjson", messages)).toBe("{\"id\":1}\n{\"id\":2}")
    })

    it("counts non-empty records", () => {
        expect(countNdjsonLines("{\"id\":1}\n\n{\"id\":2}")).toBe(2)
    })
})
