import { describe, expect, it } from "vitest"
import { convertYamlJson } from "@/features/tools/yaml-json-converter/utils"

describe("yaml json converter utils", () => {
    it("converts YAML to pretty JSON", () => {
        expect(convertYamlJson("name: byteflow\nactive: true\n", "yaml-to-json")).toBe("{\n  \"name\": \"byteflow\",\n  \"active\": true\n}")
    })

    it("converts JSON to YAML", () => {
        expect(convertYamlJson("{\"name\":\"byteflow\"}", "json-to-yaml")).toBe("name: byteflow\n")
    })
})
