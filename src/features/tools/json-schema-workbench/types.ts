export type JsonSchemaValue = {
    type?: string | string[]
    properties?: Record<string, JsonSchemaValue>
    required?: string[]
    items?: JsonSchemaValue
    enum?: unknown[]
    additionalProperties?: boolean
    minimum?: number
    maximum?: number
    minLength?: number
    maxLength?: number
}

export type JsonSchemaValidationIssue = {
    path: string
    message: string
    fix: string
}

export type JsonSchemaValidationReport = {
    valid: boolean
    issues: JsonSchemaValidationIssue[]
    summary: string
}

