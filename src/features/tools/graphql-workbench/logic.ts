import type { GraphqlDiagnostic, GraphqlInspection } from "./types"

function lineColumnFromIndex(input: string, index: number): { line: number; column: number } {
    const before = input.slice(0, index)
    const lines = before.split("\n")
    return { line: lines.length, column: lines[lines.length - 1].length + 1 }
}

function validateBalancedBraces(query: string): GraphqlDiagnostic[] {
    const stack: { char: string; index: number }[] = []
    const pairs: Record<string, string> = { "}": "{", ")": "(", "]": "[" }
    const diagnostics: GraphqlDiagnostic[] = []
    for (let index = 0; index < query.length; index += 1) {
        const char = query[index]
        if (["{", "(", "["].includes(char)) stack.push({ char, index })
        if (["}", ")", "]"].includes(char)) {
            const last = stack.pop()
            if (!last || last.char !== pairs[char]) {
                diagnostics.push({
                    ...lineColumnFromIndex(query, index),
                    message: `Unexpected ${char}.`,
                    fix: "Check matching GraphQL selection-set, argument, or list delimiters.",
                })
            }
        }
    }
    for (const entry of stack) {
        diagnostics.push({
            ...lineColumnFromIndex(query, entry.index),
            message: `Unclosed ${entry.char}.`,
            fix: "Close the delimiter before running the query.",
        })
    }
    return diagnostics
}

function compactQuery(query: string): string {
    return query
        .replace(/#[^\n]*/g, "")
        .replace(/\s+/g, " ")
        .replace(/\s*([{}():!,\[\]])\s*/g, "$1")
        .trim()
}

export function formatGraphqlQuery(query: string): string {
    const compact = compactQuery(query)
    let indent = 0
    let output = ""
    let token = ""
    const pushToken = () => {
        if (!token.trim()) {
            token = ""
            return
        }
        output += token.trim()
        token = ""
    }
    const newline = () => {
        output = output.trimEnd()
        output += `\n${"  ".repeat(Math.max(0, indent))}`
    }
    for (const char of compact) {
        if (char === "{") {
            pushToken()
            output += " {"
            indent += 1
            newline()
        } else if (char === "}") {
            pushToken()
            indent -= 1
            newline()
            output += "}"
        } else if (char === ",") {
            pushToken()
            output += ", "
        } else {
            token += char === " " ? " " : char
        }
    }
    pushToken()
    return output.trim()
}

function inspectOperation(query: string): Pick<GraphqlInspection, "operationType" | "operationName"> {
    const match = /\b(query|mutation|subscription|fragment)\s+([_A-Za-z][_0-9A-Za-z]*)?/.exec(query)
    if (!match) return query.trim().startsWith("{") ? { operationType: "anonymous" } : { operationType: "anonymous" }
    return { operationType: match[1] as GraphqlInspection["operationType"], operationName: match[2] }
}

function inspectVariables(variablesInput: string): Pick<GraphqlInspection, "variablesValid" | "variablesSummary"> & { diagnostic?: GraphqlDiagnostic } {
    if (!variablesInput.trim()) return { variablesValid: true, variablesSummary: "No variables JSON provided." }
    try {
        const parsed = JSON.parse(variablesInput)
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {
                variablesValid: false,
                variablesSummary: "Variables must be a JSON object.",
                diagnostic: { line: 1, column: 1, message: "Variables root is not an object.", fix: "Wrap variables in a JSON object." },
            }
        }
        return { variablesValid: true, variablesSummary: `${Object.keys(parsed).length} variable(s) parsed.` }
    } catch (error) {
        return {
            variablesValid: false,
            variablesSummary: "Variables JSON is invalid.",
            diagnostic: { line: 1, column: 1, message: error instanceof Error ? error.message : "Invalid JSON.", fix: "Fix the variables JSON before using it." },
        }
    }
}

function inspectIntrospection(input: string): string[] {
    if (!input.trim()) return []
    const parsed = JSON.parse(input)
    const types = parsed?.data?.__schema?.types
    if (!Array.isArray(types)) return []
    return types
        .map((type) => typeof type?.name === "string" ? `${type.name}${typeof type.kind === "string" ? ` (${type.kind})` : ""}` : "")
        .filter(Boolean)
        .slice(0, 50)
}

export function inspectGraphql(query: string, variablesInput = "", introspectionInput = ""): GraphqlInspection {
    const diagnostics = validateBalancedBraces(query)
    const variables = inspectVariables(variablesInput)
    if (variables.diagnostic) diagnostics.push(variables.diagnostic)
    let introspectionTypes: string[] = []
    try {
        introspectionTypes = inspectIntrospection(introspectionInput)
    } catch (error) {
        diagnostics.push({ line: 1, column: 1, message: error instanceof Error ? error.message : "Invalid introspection JSON.", fix: "Paste a valid GraphQL introspection JSON object." })
    }
    return {
        formattedQuery: diagnostics.some((diagnostic) => diagnostic.message.startsWith("Unexpected") || diagnostic.message.startsWith("Unclosed")) ? query : formatGraphqlQuery(query),
        ...inspectOperation(query),
        variablesValid: variables.variablesValid,
        variablesSummary: variables.variablesSummary,
        diagnostics,
        introspectionTypes,
    }
}

export function runTool(input: string): string {
    return inspectGraphql(input).formattedQuery
}

