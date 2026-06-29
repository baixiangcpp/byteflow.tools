import { describe, expect, it } from "vitest"
import { formatValidationReport, generateJsonSchema, validateJsonWithSchema } from "./logic"

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

    it("warns when basic validation mode sees unsupported validation keywords", () => {
        const report = validateJsonWithSchema(
            '{"email":"not-an-email","slug":"INVALID SPACE","tags":[]}',
            JSON.stringify({
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    slug: { type: "string", pattern: "^[a-z0-9-]+$" },
                    tags: { type: "array", minItems: 1 },
                    owner: { $ref: "#/definitions/User" },
                },
                definitions: {
                    User: { type: "object" },
                },
            }),
        )

        expect(report.valid).toBe(true)
        expect(report.warnings.map((warning) => warning.keyword).sort()).toEqual(["$ref", "format", "minItems", "pattern"])
        expect(report.summary).toContain("supported schema checks")
        expect(report.summary).toContain("4 warning")
        expect(formatValidationReport(report)).toContain("Basic mode does not enforce")
    })
})
