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

    it("flags request body requiredness and request media type removals", () => {
        const before = JSON.stringify({
            paths: {
                "/pets": {
                    post: {
                        requestBody: {
                            required: false,
                            content: {
                                "application/json": { schema: { type: "object" } },
                                "application/xml": { schema: { type: "object" } },
                            },
                        },
                        responses: { "201": {} },
                    },
                    put: {
                        responses: { "200": {} },
                    },
                },
            },
        })
        const after = JSON.stringify({
            paths: {
                "/pets": {
                    post: {
                        requestBody: {
                            required: true,
                            content: {
                                "application/json": { schema: { type: "object" } },
                            },
                        },
                        responses: { "201": {} },
                    },
                    put: {
                        requestBody: {
                            required: true,
                            content: {
                                "application/json": { schema: { type: "object" } },
                            },
                        },
                        responses: { "200": {} },
                    },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: "breaking",
                target: "POST /pets",
                message: "requestBody requiredness changed: optional -> required",
            }),
            expect.objectContaining({
                kind: "breaking",
                target: "POST /pets",
                message: "request media type removed: application/xml",
            }),
            expect.objectContaining({
                kind: "breaking",
                target: "PUT /pets",
                message: "required requestBody added.",
            }),
        ]))
    })

    it("flags response media type removals and schema compatibility risks", () => {
        const before = JSON.stringify({
            paths: {
                "/pets": {
                    get: {
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                id: { type: "integer" },
                                                status: { type: "string", enum: ["available", "sold"] },
                                                name: { type: "string" },
                                            },
                                            required: ["id"],
                                        },
                                    },
                                    "application/xml": { schema: { type: "object" } },
                                },
                            },
                        },
                    },
                },
            },
        })
        const after = JSON.stringify({
            paths: {
                "/pets": {
                    get: {
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                status: { type: "string", enum: ["available"] },
                                            },
                                            required: ["id", "name"],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: "breaking",
                target: "GET /pets response 200",
                message: "response media type removed: application/xml",
            }),
            expect.objectContaining({
                kind: "breaking",
                target: "GET /pets response 200 application/json $.name",
                message: "response schema property removed.",
            }),
            expect.objectContaining({
                kind: "breaking",
                target: "GET /pets response 200 application/json $.id",
                message: "schema type changed: integer -> string",
            }),
            expect.objectContaining({
                kind: "breaking",
                target: "GET /pets response 200 application/json $.status",
                message: "schema enum narrowed.",
            }),
        ]))
    })

    it("resolves local refs for parameters and request body schema compatibility", () => {
        const before = JSON.stringify({
            paths: {
                "/pets": {
                    get: {
                        parameters: [{ $ref: "#/components/parameters/TenantId" }],
                        responses: { "200": {} },
                    },
                    post: {
                        requestBody: {
                            required: true,
                            content: {
                                "application/json": { schema: { $ref: "#/components/schemas/PetInput" } },
                            },
                        },
                        responses: { "201": {} },
                    },
                },
            },
            components: {
                parameters: {
                    TenantId: { in: "header", name: "X-Tenant", required: false },
                },
                schemas: {
                    PetInput: {
                        type: "object",
                        properties: { name: { type: "string" } },
                    },
                },
            },
        })
        const after = JSON.stringify({
            paths: {
                "/pets": {
                    get: {
                        parameters: [{ $ref: "#/components/parameters/TenantId" }],
                        responses: { "200": {} },
                    },
                    post: {
                        requestBody: {
                            required: true,
                            content: {
                                "application/json": { schema: { $ref: "#/components/schemas/PetInput" } },
                            },
                        },
                        responses: { "201": {} },
                    },
                },
            },
            components: {
                parameters: {
                    TenantId: { in: "header", name: "X-Tenant", required: true },
                },
                schemas: {
                    PetInput: {
                        type: "object",
                        properties: { name: { type: "string" }, category: { type: "string" } },
                        required: ["category"],
                    },
                },
            },
        })

        const report = diffOpenApiSpecs(before, after)

        expect(report.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: "breaking",
                message: 'parameter requiredness changed: header parameter "X-Tenant" optional -> required',
            }),
            expect.objectContaining({
                kind: "breaking",
                target: "POST /pets request application/json $.category",
                message: "request schema added required property.",
            }),
        ]))
    })
})
