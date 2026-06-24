import YAML from "yaml"
import type { OpenApiDiffItem, OpenApiDiffReport, OpenApiMethod, OpenApiOperationSnapshot, OpenApiSpecSnapshot } from "./types"

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

function listParameterIds(operation: Record<string, unknown>): string[] {
    const parameters = Array.isArray(operation.parameters) ? operation.parameters : []
    return parameters
        .map((parameter) => {
            if (!parameter || typeof parameter !== "object") return ""
            const param = parameter as Record<string, unknown>
            return `${String(param.in ?? "query")}:${String(param.name ?? "(unnamed)")}${param.required ? ":required" : ""}`
        })
        .filter(Boolean)
        .sort()
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
                parameters: listParameterIds(operation),
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
        items.push(...diffList(target, "parameter", beforeOperation.parameters, afterOperation.parameters))
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
