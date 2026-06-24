import { describe, expect, it } from "vitest"
import { diffOpenApiSpecs } from "./logic"

describe("openapi-diff logic", () => {
    it("groups added operations and breaking removals", () => {
        const before = '{"openapi":"3.0.3","paths":{"/pets":{"get":{"responses":{"200":{}}}},"/pets/{id}":{"delete":{"responses":{"204":{}}}}}}'
        const after = '{"openapi":"3.0.3","paths":{"/pets":{"get":{"responses":{"200":{}}},"post":{"responses":{"201":{}}}}}}'
        const report = diffOpenApiSpecs(before, after)
        expect(report.summary.added).toBe(1)
        expect(report.summary.breaking).toBe(1)
        expect(report.items.some((item) => item.target === "DELETE /pets/{id}")).toBe(true)
    })

    it("flags removed response codes as breaking risks", () => {
        const before = '{"paths":{"/pets":{"get":{"responses":{"200":{},"404":{}}}}}}'
        const after = '{"paths":{"/pets":{"get":{"responses":{"200":{}}}}}}'
        const report = diffOpenApiSpecs(before, after)
        expect(report.items.find((item) => item.message.includes("404"))?.kind).toBe("breaking")
    })

    it("tracks schema and security scheme changes", () => {
        const before = JSON.stringify({
            paths: {},
            components: {
                schemas: {
                    Pet: { type: "object", required: ["id"], properties: { id: { type: "integer" } } },
                    Order: { type: "object" },
                },
                securitySchemes: {
                    bearerAuth: { type: "http", scheme: "bearer" },
                },
            },
        })
        const after = JSON.stringify({
            paths: {},
            components: {
                schemas: {
                    Pet: { type: "object", required: ["id", "name"], properties: { id: { type: "integer" }, name: { type: "string" } } },
                    Invoice: { type: "object" },
                },
                securitySchemes: {
                    oauth: { type: "oauth2", flows: {} },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: "changed", target: "Schema Pet" }),
            expect.objectContaining({ kind: "breaking", target: "Schema Order" }),
            expect.objectContaining({ kind: "added", target: "Schema Invoice" }),
            expect.objectContaining({ kind: "breaking", target: "Security scheme bearerAuth" }),
            expect.objectContaining({ kind: "added", target: "Security scheme oauth" }),
        ]))
    })
})
