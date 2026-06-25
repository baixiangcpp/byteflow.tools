import YAML from "yaml"
import type { OpenApiDiffItem, OpenApiDiffReport, OpenApiMethod, OpenApiOperationSnapshot, OpenApiParameterSnapshot, OpenApiSpecSnapshot } from "./types"

const METHODS = new Set<OpenApiMethod>(["get", "post", "put", "patch", "delete", "options", "head", "trace"])

function parseSpec(input: string): Record<string, unknown> {
    const trimmed = input.trim()
    if (!trimmed) throw new Error("OpenAPI spec is required.")
    const parsed = trimmed.startsWith("{") ? JSON.parse(trimmed) : YAML.parse(trimmed)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("OpenAPI spec must be an object.")
    }
    return parsed as Record<string, unknown>
}

function objectEntries(value: unknown): [string, Record<string, unknown>][] {
    if (!value || typeof value !== "object" || Array.isArray(value)) return []
    return Object.entries(value as Record<string, unknown>).filter(([, entry]) => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)) as [string, Record<string, unknown>][]
}

function snapshotParameter(parameter: unknown): OpenApiParameterSnapshot | undefined {
    if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) return undefined
    const param = parameter as Record<string, unknown>
    const location = typeof param.in === "string" && param.in ? param.in : "query"
    const name = typeof param.name === "string" && param.name ? param.name : "(unnamed)"
    return {
        key: `${location}:${name}`,
        location,
        name,
        required: location === "path" || param.required === true,
    }
}

function listParameters(pathItem: Record<string, unknown>, operation: Record<string, unknown>): OpenApiParameterSnapshot[] {
    const parametersByKey = new Map<string, OpenApiParameterSnapshot>()
    const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : []
    const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : []
    for (const parameter of [...pathParameters, ...operationParameters]) {
        const snapshot = snapshotParameter(parameter)
        if (snapshot) parametersByKey.set(snapshot.key, snapshot)
    }
    return [...parametersByKey.values()].sort((left, right) => left.key.localeCompare(right.key))
}

function listResponseCodes(operation: Record<string, unknown>): string[] {
    return Object.keys((operation.responses as Record<string, unknown> | undefined) ?? {}).sort()
}

function listSecurity(operation: Record<string, unknown>): string[] {
    const security = Array.isArray(operation.security) ? operation.security : []
    return security.flatMap((entry) => Object.keys((entry as Record<string, unknown> | undefined) ?? {})).sort()
}

function stableStringify(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
    if (!value || typeof value !== "object") return JSON.stringify(value)
    return `{${Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
        .join(",")}}`
}

function snapshotNamedObjects(value: unknown): Map<string, string> {
    return new Map(objectEntries(value).map(([name, entry]) => [name, stableStringify(entry)]))
}

function snapshotSpec(input: string): OpenApiSpecSnapshot {
    const spec = parseSpec(input)
    const operations = new Map<string, OpenApiOperationSnapshot>()
    for (const [path, pathItem] of objectEntries(spec.paths)) {
        for (const [method, operation] of objectEntries(pathItem)) {
            if (!METHODS.has(method as OpenApiMethod)) continue
            const snapshot: OpenApiOperationSnapshot = {
                path,
                method: method as OpenApiMethod,
                operationId: typeof operation.operationId === "string" ? operation.operationId : undefined,
                summary: typeof operation.summary === "string" ? operation.summary : undefined,
                parameters: listParameters(pathItem, operation),
                responses: listResponseCodes(operation),
                security: listSecurity(operation),
            }
            operations.set(`${method.toUpperCase()} ${path}`, snapshot)
        }
    }

    const components = spec.components as Record<string, unknown> | undefined
    return {
        operations,
        schemas: snapshotNamedObjects(components?.schemas),
        securitySchemes: snapshotNamedObjects(components?.securitySchemes),
    }
}

function diffList(target: string, label: string, before: string[], after: string[]): OpenApiDiffItem[] {
    const beforeSet = new Set(before)
    const afterSet = new Set(after)
    const items: OpenApiDiffItem[] = []
    for (const value of before) {
        if (!afterSet.has(value)) {
            items.push({
                kind: label === "response" || value.endsWith(":required") ? "breaking" : "changed",
                target,
                message: `${label} removed: ${value}`,
                before: value,
            })
        }
    }
    for (const value of after) {
        if (!beforeSet.has(value)) {
            items.push({ kind: "changed", target, message: `${label} added: ${value}`, after: value })
        }
    }
    return items
}

function requiredLabel(required: boolean): string {
    return required ? "required" : "optional"
}

function describeParameter(parameter: OpenApiParameterSnapshot): string {
    return `${parameter.location} parameter "${parameter.name}" (${requiredLabel(parameter.required)})`
}

function diffParameters(target: string, before: OpenApiParameterSnapshot[], after: OpenApiParameterSnapshot[]): OpenApiDiffItem[] {
    const beforeByKey = new Map(before.map((parameter) => [parameter.key, parameter]))
    const afterByKey = new Map(after.map((parameter) => [parameter.key, parameter]))
    const items: OpenApiDiffItem[] = []

    for (const parameter of before) {
        const afterParameter = afterByKey.get(parameter.key)
        if (!afterParameter) {
            items.push({
                kind: parameter.required ? "breaking" : "changed",
                target,
                message: `parameter removed: ${describeParameter(parameter)}`,
                before: describeParameter(parameter),
            })
            continue
        }
        if (parameter.required !== afterParameter.required) {
            items.push({
                kind: afterParameter.required ? "breaking" : "changed",
                target,
                message: `parameter requiredness changed: ${parameter.location} parameter "${parameter.name}" ${requiredLabel(parameter.required)} -> ${requiredLabel(afterParameter.required)}`,
                before: describeParameter(parameter),
                after: describeParameter(afterParameter),
            })
        }
    }

    for (const parameter of after) {
        if (!beforeByKey.has(parameter.key)) {
            items.push({
                kind: parameter.required ? "breaking" : "changed",
                target,
                message: `parameter added: ${describeParameter(parameter)}`,
                after: describeParameter(parameter),
            })
        }
    }

    return items
}

function diffNamedObjects(targetPrefix: string, before: Map<string, string>, after: Map<string, string>, breakingOnRemove: boolean): OpenApiDiffItem[] {
    const items: OpenApiDiffItem[] = []
    for (const [name, beforeValue] of before) {
        const target = `${targetPrefix} ${name}`
        const afterValue = after.get(name)
        if (!after.has(name)) {
            items.push({
                kind: breakingOnRemove ? "breaking" : "removed",
                target,
                message: `${targetPrefix} was removed.`,
                before: name,
            })
            continue
        }
        if (beforeValue !== afterValue) {
            items.push({
                kind: "changed",
                target,
                message: `${targetPrefix} changed.`,
                before: beforeValue,
                after: afterValue,
            })
        }
    }
    for (const [name] of after) {
        if (!before.has(name)) {
            items.push({
                kind: "added",
                target: `${targetPrefix} ${name}`,
                message: `${targetPrefix} was added.`,
                after: name,
            })
        }
    }
    return items
}

export function diffOpenApiSpecs(beforeInput: string, afterInput: string): OpenApiDiffReport {
    const before = snapshotSpec(beforeInput)
    const after = snapshotSpec(afterInput)
    const items: OpenApiDiffItem[] = []

    for (const [target, beforeOperation] of before.operations) {
        const afterOperation = after.operations.get(target)
        if (!afterOperation) {
            items.push({ kind: "breaking", target, message: "Operation was removed.", before: target })
            continue
        }
        if (beforeOperation.operationId !== afterOperation.operationId) {
            items.push({
                kind: "changed",
                target,
                message: "operationId changed.",
                before: beforeOperation.operationId,
                after: afterOperation.operationId,
            })
        }
        items.push(...diffParameters(target, beforeOperation.parameters, afterOperation.parameters))
        items.push(...diffList(target, "response", beforeOperation.responses, afterOperation.responses))
        items.push(...diffList(target, "security", beforeOperation.security, afterOperation.security))
    }

    for (const [target] of after.operations) {
        if (!before.operations.has(target)) {
            items.push({ kind: "added", target, message: "Operation was added.", after: target })
        }
    }

    items.push(...diffNamedObjects("Schema", before.schemas, after.schemas, true))
    items.push(...diffNamedObjects("Security scheme", before.securitySchemes, after.securitySchemes, true))

    return {
        summary: {
            added: items.filter((item) => item.kind === "added").length,
            removed: items.filter((item) => item.kind === "removed").length,
            changed: items.filter((item) => item.kind === "changed").length,
            breaking: items.filter((item) => item.kind === "breaking").length,
        },
        items,
    }
}

export function formatOpenApiDiffReport(report: OpenApiDiffReport): string {
    return [
        `Added: ${report.summary.added}`,
        `Changed: ${report.summary.changed}`,
        `Breaking risks: ${report.summary.breaking}`,
        "",
        ...report.items.map((item) => `[${item.kind}] ${item.target} - ${item.message}`),
    ].join("\n")
}

export function runTool(input: string): string {
    const parsed = JSON.parse(input) as { before: unknown; after: unknown }
    return formatOpenApiDiffReport(diffOpenApiSpecs(JSON.stringify(parsed.before), JSON.stringify(parsed.after)))
}
