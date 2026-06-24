import { describe, expect, it } from "vitest"
import { generateJsonSchema, validateJsonWithSchema } from "./logic"

describe("json-schema-workbench logic", () => {
    it("generates a starter schema from nested JSON", () => {
        const schema = JSON.parse(generateJsonSchema('{"id":1,"tags":["api"],"meta":{"active":true}}'))
        expect(schema.type).toBe("object")
        expect(schema.required).toEqual(["id", "tags", "meta"])
        expect(schema.properties.id.type).toBe("integer")
        expect(schema.properties.tags.items.type).toBe("string")
    })

    it("validates payloads and reports actionable paths", () => {
        const report = validateJsonWithSchema('{"id":"wrong"}', '{"type":"object","required":["id","name"],"properties":{"id":{"type":"integer"}}}')
        expect(report.valid).toBe(false)
        expect(report.issues.map((issue) => issue.path).sort()).toEqual(["$.id", "$.name"])
        expect(report.issues.some((issue) => issue.fix.includes("Change the payload"))).toBe(true)
    })

    it("accepts valid payloads", () => {
        expect(validateJsonWithSchema('{"id":1}', '{"type":"object","required":["id"],"properties":{"id":{"type":"integer"}}}').valid).toBe(true)
    })
})
