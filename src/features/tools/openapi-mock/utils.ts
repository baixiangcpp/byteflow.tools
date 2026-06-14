export interface OpenApiEndpoint {
    method: string
    path: string
    summary: string
    response: unknown
}

export interface OpenApiMockLimits {
    maxEndpoints?: number
    maxSchemaProperties?: number
}

interface MockContext {
    properties: number
    maxSchemaProperties: number
    truncated: boolean
}

export function generateMockFromSchema(
    schema: Record<string, unknown>,
    defs: Record<string, unknown> | undefined,
    sampleStringValue: string,
    depth = 0,
    context: MockContext = { properties: 0, maxSchemaProperties: Number.POSITIVE_INFINITY, truncated: false },
): unknown {
    if (depth > 8) return null
    if (!schema || typeof schema !== "object") return null
    if (schema.$ref && typeof schema.$ref === "string" && defs) {
        const refName = (schema.$ref as string).split("/").pop()!
        return generateMockFromSchema((defs[refName] as Record<string, unknown>) || {}, defs, sampleStringValue, depth + 1, context)
    }
    if (schema.example !== undefined) return schema.example
    const type = schema.type as string
    if (type === "string") {
        if (schema.enum) return (schema.enum as string[])[0]
        if (schema.format === "email") return "user@example.com"
        if (schema.format === "date-time") return new Date().toISOString()
        if (schema.format === "date") return "2026-01-15"
        if (schema.format === "uri" || schema.format === "url") return "https://example.com"
        if (schema.format === "uuid") return "550e8400-e29b-41d4-a716-446655440000"
        return sampleStringValue
    }
    if (type === "integer" || type === "number") return schema.minimum !== undefined ? Number(schema.minimum) : 0
    if (type === "boolean") return true
    if (type === "array") {
        const items = schema.items as Record<string, unknown> | undefined
        return items ? [generateMockFromSchema(items, defs, sampleStringValue, depth + 1, context)] : []
    }
    if (type === "object" || schema.properties) {
        const result: Record<string, unknown> = {}
        const props = schema.properties as Record<string, Record<string, unknown>> | undefined
        if (props) {
            for (const [k, v] of Object.entries(props)) {
                if (context.properties >= context.maxSchemaProperties) {
                    context.truncated = true
                    result.__truncated__ = true
                    break
                }
                context.properties += 1
                result[k] = generateMockFromSchema(v, defs, sampleStringValue, depth + 1, context)
            }
        }
        return result
    }
    return null
}

export function extractEndpoints(spec: Record<string, unknown>, sampleStringValue: string, limits: OpenApiMockLimits = {}): OpenApiEndpoint[] {
    const endpoints: OpenApiEndpoint[] = []
    const paths = spec.paths as Record<string, Record<string, unknown>> | undefined
    const defs = (spec.components as Record<string, unknown>)?.schemas as Record<string, unknown> || (spec.definitions as Record<string, unknown>) || {}
    const maxEndpoints = Math.max(1, Math.floor(limits.maxEndpoints ?? Number.POSITIVE_INFINITY))
    const mockContext: MockContext = {
        properties: 0,
        maxSchemaProperties: Math.max(1, Math.floor(limits.maxSchemaProperties ?? Number.POSITIVE_INFINITY)),
        truncated: false,
    }

    if (!paths) return endpoints
    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
            if (["get", "post", "put", "delete", "patch"].includes(method)) {
                if (endpoints.length >= maxEndpoints) return endpoints
                const d = details as Record<string, unknown>
                const responses = d.responses as Record<string, Record<string, unknown>> | undefined
                let responseSchema: unknown = null
                if (responses) {
                    const success = responses["200"] || responses["201"] || Object.values(responses)[0]
                    if (success) {
                        const content = success.content as Record<string, Record<string, unknown>> | undefined
                        if (content) {
                            const json = content["application/json"]
                            if (json?.schema) responseSchema = generateMockFromSchema(json.schema as Record<string, unknown>, defs, sampleStringValue, 0, mockContext)
                        } else if (success.schema) {
                            responseSchema = generateMockFromSchema(success.schema as Record<string, unknown>, defs, sampleStringValue, 0, mockContext)
                        }
                    }
                }
                endpoints.push({ method: method.toUpperCase(), path, summary: (d.summary as string) || (d.operationId as string) || "", response: responseSchema })
            }
        }
    }
    return endpoints
}
