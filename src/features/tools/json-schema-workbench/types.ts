export type JsonSchemaValue = {
    $ref?: string
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
    [keyword: string]: unknown
}

export type JsonSchemaValidationIssue = {
    path: string
    message: string
    fix: string
}

export type JsonSchemaValidationReport = {
    valid: boolean
    issues: JsonSchemaValidationIssue[]
    warnings: JsonSchemaValidationWarning[]
    summary: string
}

export type JsonSchemaValidationWarning = {
    path: string
    keyword: string
    message: string
}
