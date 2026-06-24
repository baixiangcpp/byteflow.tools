export type GraphqlDiagnostic = {
    line: number
    column: number
    message: string
    fix: string
}

export type GraphqlInspection = {
    formattedQuery: string
    operationType: "query" | "mutation" | "subscription" | "fragment" | "anonymous"
    operationName?: string
    variablesValid: boolean
    variablesSummary: string
    diagnostics: GraphqlDiagnostic[]
    introspectionTypes: string[]
}

