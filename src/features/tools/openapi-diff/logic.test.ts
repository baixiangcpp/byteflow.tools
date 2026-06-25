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

    it("classifies parameter requiredness changes by direction", () => {
        const before = JSON.stringify({
            paths: {
                "/pets": {
                    get: {
                        parameters: [
                            { in: "query", name: "status" },
                            { in: "query", name: "page", required: true },
                        ],
                        responses: { "200": {} },
                    },
                },
            },
        })
        const after = JSON.stringify({
            paths: {
                "/pets": {
                    get: {
                        parameters: [
                            { in: "query", name: "status", required: true },
                            { in: "query", name: "page" },
                        ],
                        responses: { "200": {} },
                    },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: "breaking",
                message: 'parameter requiredness changed: query parameter "status" optional -> required',
            }),
            expect.objectContaining({
                kind: "changed",
                message: 'parameter requiredness changed: query parameter "page" required -> optional',
            }),
        ]))
    })

    it("classifies added parameters by requiredness", () => {
        const before = '{"paths":{"/pets":{"get":{"responses":{"200":{}}}}}}'
        const after = JSON.stringify({
            paths: {
                "/pets": {
                    get: {
                        parameters: [
                            { in: "query", name: "status" },
                            { in: "query", name: "limit", required: true },
                        ],
                        responses: { "200": {} },
                    },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: "changed",
                message: 'parameter added: query parameter "status" (optional)',
            }),
            expect.objectContaining({
                kind: "breaking",
                message: 'parameter added: query parameter "limit" (required)',
            }),
        ]))
    })

    it("treats path parameters as required when required is omitted", () => {
        const before = '{"paths":{"/pets/{id}":{"get":{"responses":{"200":{}}}}}}'
        const after = JSON.stringify({
            paths: {
                "/pets/{id}": {
                    get: {
                        parameters: [{ in: "path", name: "id" }],
                        responses: { "200": {} },
                    },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: "breaking",
                message: 'parameter added: path parameter "id" (required)',
            }),
        ]))
    })

    it("includes path-level parameters and lets operation-level parameters override the same key", () => {
        const before = JSON.stringify({
            paths: {
                "/pets": {
                    parameters: [{ in: "query", name: "version", required: true }],
                    get: {
                        responses: { "200": {} },
                    },
                },
            },
        })
        const after = JSON.stringify({
            paths: {
                "/pets": {
                    parameters: [{ in: "query", name: "version", required: true }],
                    get: {
                        parameters: [{ in: "query", name: "version" }],
                        responses: { "200": {} },
                    },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: "changed",
                message: 'parameter requiredness changed: query parameter "version" required -> optional',
            }),
        ]))
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
