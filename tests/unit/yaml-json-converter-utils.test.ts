import { describe, expect, it } from "vitest"
import { convertStructuredData, convertYamlJson } from "@/features/tools/yaml-json-converter/utils"

describe("yaml json converter utils", () => {
    it("converts YAML to pretty JSON", () => {
        expect(convertYamlJson("name: byteflow\nactive: true\n", "yaml-to-json")).toBe("{\n  \"name\": \"byteflow\",\n  \"active\": true\n}")
    })

    it("converts JSON to YAML", () => {
        expect(convertYamlJson("{\"name\":\"byteflow\"}", "json-to-yaml")).toBe("name: byteflow\n")
    })

    it("converts TOML to pretty JSON", () => {
        const input = "name = \"byteflow\"\nports = [80, 443]\n\n[owner]\nteam = \"tools\"\n"

        expect(convertStructuredData(input, { from: "toml", to: "json" })).toBe(
            "{\n  \"name\": \"byteflow\",\n  \"ports\": [\n    80,\n    443\n  ],\n  \"owner\": {\n    \"team\": \"tools\"\n  }\n}",
        )
    })

    it("converts JSON to TOML", () => {
        const input = "{\"name\":\"byteflow\",\"owner\":{\"team\":\"tools\"},\"ports\":[80,443]}"
        const output = convertStructuredData(input, { from: "json", to: "toml" })

        expect(output).toContain("[owner]\nteam = \"tools\"")
        expect(output).toMatch(/ports = \[\s*80,\s*443\s*\]/)
    })

    it("converts multi-document YAML into a JSON array", () => {
        const input = "---\nname: alpha\n---\nname: beta\n"

        expect(convertStructuredData(input, { from: "yaml", to: "json" })).toBe(
            "[\n  {\n    \"name\": \"alpha\"\n  },\n  {\n    \"name\": \"beta\"\n  }\n]",
        )
    })

    it("rejects identical input and output formats", () => {
        expect(() => convertStructuredData("{}", { from: "json", to: "json" })).toThrow("Choose two different formats.")
    })

    it("rejects malformed JSON, YAML, and TOML input", () => {
        expect(() => convertStructuredData("{", { from: "json", to: "yaml" })).toThrow()
        expect(() => convertStructuredData("name: [unterminated", { from: "yaml", to: "json" })).toThrow()
        expect(() => convertStructuredData("name = \"unterminated", { from: "toml", to: "json" })).toThrow()
    })
})
