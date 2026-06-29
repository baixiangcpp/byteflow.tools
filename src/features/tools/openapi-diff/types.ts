export type OpenApiMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head" | "trace"

export type OpenApiOperationSnapshot = {
    path: string
    method: OpenApiMethod
    operationId?: string
    summary?: string
    parameters: OpenApiParameterSnapshot[]
    requestBody?: OpenApiRequestBodySnapshot
    responses: string[]
    responseContent: OpenApiResponseContentSnapshot[]
    security: string[]
}

export type OpenApiParameterSnapshot = {
    key: string
    location: string
    name: string
    required: boolean
}

export type OpenApiSpecSnapshot = {
    operations: Map<string, OpenApiOperationSnapshot>
    schemas: Map<string, string>
    securitySchemes: Map<string, string>
}

export type OpenApiRequestBodySnapshot = {
    required: boolean
    mediaTypes: Record<string, OpenApiSchemaSnapshot>
}

export type OpenApiResponseContentSnapshot = {
    statusCode: string
    mediaTypes: Record<string, OpenApiSchemaSnapshot>
}

export type OpenApiSchemaSnapshot = {
    type?: string
    enum?: unknown[]
    required: string[]
    properties: Record<string, OpenApiSchemaSnapshot>
    fingerprint: string
    unresolvedRef?: string
}

export type OpenApiDiffItem = {
    kind: "added" | "removed" | "changed" | "breaking"
    target: string
    message: string
    before?: string
    after?: string
}

export type OpenApiDiffReport = {
    summary: {
        added: number
        removed: number
        changed: number
        breaking: number
    }
    items: OpenApiDiffItem[]
}
