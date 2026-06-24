export type OpenApiMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head" | "trace"

export type OpenApiOperationSnapshot = {
    path: string
    method: OpenApiMethod
    operationId?: string
    summary?: string
    parameters: string[]
    responses: string[]
    security: string[]
}

export type OpenApiSpecSnapshot = {
    operations: Map<string, OpenApiOperationSnapshot>
    schemas: Map<string, string>
    securitySchemes: Map<string, string>
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
