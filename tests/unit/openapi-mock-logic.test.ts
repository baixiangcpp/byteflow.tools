import { describe, expect, it } from "vitest"
import { extractEndpoints } from "@/features/tools/openapi-mock/utils"

describe("openapi mock logic", () => {
    it("handles circular references without crashing", () => {
        const spec = {
            openapi: "3.0.0",
            paths: {
                "/user": {
                    get: {
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/User" }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    User: {
                        type: "object",
                        properties: {
                            id: { type: "integer" },
                            friends: {
                                type: "array",
                                items: { $ref: "#/components/schemas/User" }
                            }
                        }
                    }
                }
            }
        }

        const result = extractEndpoints(spec as Record<string, unknown>, "sample")
        expect(result).toBeDefined()
        expect(result[0].path).toBe("/user")
        // We expect it to NOT be an infinite loop, maybe return null or a truncated object for the circular part
        expect(result[0].response).toBeDefined()
    })

    it("handles direct self-reference", () => {
        const spec = {
            openapi: "3.0.0",
            paths: {
                "/recursive": {
                    get: {
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Node" }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    Node: {
                        type: "object",
                        properties: {
                            parent: { $ref: "#/components/schemas/Node" }
                        }
                    }
                }
            }
        }

        const result = extractEndpoints(spec as Record<string, unknown>, "sample")
        expect(result).toBeDefined()
    })

    it("limits generated endpoints for large OpenAPI specs", () => {
        const paths = Object.fromEntries(
            Array.from({ length: 10 }, (_, index) => [
                `/items/${index}`,
                {
                    get: {
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: { type: "object", properties: { id: { type: "integer" } } },
                                    },
                                },
                            },
                        },
                    },
                },
            ]),
        )
        const spec = { openapi: "3.0.0", paths }

        const result = extractEndpoints(spec as Record<string, unknown>, "sample", { maxEndpoints: 3 })

        expect(result).toHaveLength(3)
        expect(result.map((endpoint) => endpoint.path)).toEqual(["/items/0", "/items/1", "/items/2"])
    })

    it("limits generated mock object properties", () => {
        const properties = Object.fromEntries(
            Array.from({ length: 8 }, (_, index) => [`field${index}`, { type: "string" }]),
        )
        const spec = {
            openapi: "3.0.0",
            paths: {
                "/wide": {
                    get: {
                        responses: {
                            "200": {
                                content: {
                                    "application/json": {
                                        schema: { type: "object", properties },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }

        const result = extractEndpoints(spec as Record<string, unknown>, "sample", { maxSchemaProperties: 3 })
        const response = result[0].response as Record<string, unknown>

        expect(Object.keys(response).filter((key) => key.startsWith("field"))).toHaveLength(3)
        expect(response.__truncated__).toBe(true)
    })
})
