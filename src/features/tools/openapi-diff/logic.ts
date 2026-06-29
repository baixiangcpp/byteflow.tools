import YAML from "yaml"
import type {
    OpenApiDiffItem,
    OpenApiDiffReport,
    OpenApiMethod,
    OpenApiOperationSnapshot,
    OpenApiParameterSnapshot,
    OpenApiRequestBodySnapshot,
    OpenApiResponseContentSnapshot,
    OpenApiSchemaSnapshot,
    OpenApiSpecSnapshot,
} from "./types"

const METHODS = new Set<OpenApiMethod>(["get", "post", "put", "patch", "delete", "options", "head", "trace"])
type OpenApiDocument = Record<string, unknown>

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

function readJsonPointer(document: OpenApiDocument, ref: string): unknown {
    if (!ref.startsWith("#/")) return undefined
    return ref
        .slice(2)
        .split("/")
        .map((part) => decodeURIComponent(part).replace(/~1/g, "/").replace(/~0/g, "~"))
        .reduce<unknown>((current, key) => {
            if (!current || typeof current !== "object" || Array.isArray(current)) return undefined
            return (current as Record<string, unknown>)[key]
        }, document)
}

function resolveLocalRef(document: OpenApiDocument, value: unknown, seen = new Set<string>()): unknown {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value
    const ref = (value as Record<string, unknown>).$ref
    if (typeof ref !== "string") return value
    if (!ref.startsWith("#/") || seen.has(ref)) return value
    const resolved = readJsonPointer(document, ref)
    if (!resolved) return value
    return resolveLocalRef(document, resolved, new Set([...seen, ref]))
}

function snapshotParameter(parameter: unknown, spec: OpenApiDocument): OpenApiParameterSnapshot | undefined {
    const resolvedParameter = resolveLocalRef(spec, parameter)
    if (!resolvedParameter || typeof resolvedParameter !== "object" || Array.isArray(resolvedParameter)) return undefined
    const param = resolvedParameter as Record<string, unknown>
    const location = typeof param.in === "string" && param.in ? param.in : "query"
    const name = typeof param.name === "string" && param.name ? param.name : "(unnamed)"
    return {
        key: `${location}:${name}`,
        location,
        name,
        required: location === "path" || param.required === true,
    }
}

function listParameters(spec: OpenApiDocument, pathItem: Record<string, unknown>, operation: Record<string, unknown>): OpenApiParameterSnapshot[] {
    const parametersByKey = new Map<string, OpenApiParameterSnapshot>()
    const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : []
    const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : []
    for (const parameter of [...pathParameters, ...operationParameters]) {
        const snapshot = snapshotParameter(parameter, spec)
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

function schemaPathJoin(path: string, segment: string): string {
    if (!path || path === "$") return `$.${segment}`
    return `${path}.${segment}`
}

function snapshotNamedObjects(value: unknown): Map<string, string> {
    return new Map(objectEntries(value).map(([name, entry]) => [name, stableStringify(entry)]))
}

function normalizeType(type: unknown): string | undefined {
    if (typeof type === "string") return type
    if (Array.isArray(type) && type.every((entry) => typeof entry === "string")) return [...type].sort().join(" or ")
    return undefined
}

function snapshotSchema(schema: unknown, spec: OpenApiDocument, seen = new Set<string>()): OpenApiSchemaSnapshot {
    const unresolvedRef = schema && typeof schema === "object" && !Array.isArray(schema) && typeof (schema as Record<string, unknown>).$ref === "string"
        ? (schema as Record<string, unknown>).$ref as string
        : undefined
    const resolved = resolveLocalRef(spec, schema, seen)
    if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) {
        return { required: [], properties: {}, fingerprint: stableStringify(resolved), unresolvedRef }
    }

    const record = resolved as Record<string, unknown>
    const required = Array.isArray(record.required)
        ? record.required.filter((entry): entry is string => typeof entry === "string").sort()
        : []
    const properties = Object.fromEntries(
        objectEntries(record.properties).map(([name, propertySchema]) => [name, snapshotSchema(propertySchema, spec, seen)]),
    )
    return {
        type: normalizeType(record.type),
        enum: Array.isArray(record.enum) ? [...record.enum] : undefined,
        required,
        properties,
        fingerprint: stableStringify(resolved),
        unresolvedRef: resolved === schema ? unresolvedRef : undefined,
    }
}

function snapshotMediaSchemas(content: unknown, spec: OpenApiDocument): Record<string, OpenApiSchemaSnapshot> {
    return Object.fromEntries(
        objectEntries(content).map(([mediaType, mediaObject]) => [mediaType, snapshotSchema(mediaObject.schema, spec)]),
    )
}

function snapshotRequestBody(operation: Record<string, unknown>, spec: OpenApiDocument): OpenApiRequestBodySnapshot | undefined {
    const requestBody = resolveLocalRef(spec, operation.requestBody)
    if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) return undefined
    const record = requestBody as Record<string, unknown>
    return {
        required: record.required === true,
        mediaTypes: snapshotMediaSchemas(record.content, spec),
    }
}

function listResponseContent(operation: Record<string, unknown>, spec: OpenApiDocument): OpenApiResponseContentSnapshot[] {
    return objectEntries(operation.responses).map(([statusCode, response]) => {
        const resolvedResponse = resolveLocalRef(spec, response)
        const responseRecord = resolvedResponse && typeof resolvedResponse === "object" && !Array.isArray(resolvedResponse)
            ? resolvedResponse as Record<string, unknown>
            : {}
        return {
            statusCode,
            mediaTypes: snapshotMediaSchemas(responseRecord.content, spec),
        }
    }).sort((left, right) => left.statusCode.localeCompare(right.statusCode))
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
                parameters: listParameters(spec, pathItem, operation),
                requestBody: snapshotRequestBody(operation, spec),
                responses: listResponseCodes(operation),
                responseContent: listResponseContent(operation, spec),
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

function diffMediaTypes(target: string, label: string, before: Record<string, OpenApiSchemaSnapshot>, after: Record<string, OpenApiSchemaSnapshot>): OpenApiDiffItem[] {
    const beforeTypes = Object.keys(before).sort()
    const afterTypes = Object.keys(after).sort()
    const afterSet = new Set(afterTypes)
    const beforeSet = new Set(beforeTypes)
    const items: OpenApiDiffItem[] = []

    for (const mediaType of beforeTypes) {
        if (!afterSet.has(mediaType)) {
            items.push({
                kind: "breaking",
                target,
                message: `${label} media type removed: ${mediaType}`,
                before: mediaType,
            })
        }
    }

    for (const mediaType of afterTypes) {
        if (!beforeSet.has(mediaType)) {
            items.push({
                kind: "changed",
                target,
                message: `${label} media type added: ${mediaType}`,
                after: mediaType,
            })
        }
    }

    return items
}

function enumNarrowed(beforeEnum: unknown[], afterEnum: unknown[]): boolean {
    if (afterEnum.length >= beforeEnum.length) return false
    const beforeValues = new Set(beforeEnum.map(stableStringify))
    return afterEnum.every((entry) => beforeValues.has(stableStringify(entry)))
}

function enumWidened(beforeEnum: unknown[], afterEnum: unknown[]): boolean {
    if (afterEnum.length <= beforeEnum.length) return false
    const afterValues = new Set(afterEnum.map(stableStringify))
    return beforeEnum.every((entry) => afterValues.has(stableStringify(entry)))
}

function diffSchemaCompatibility(
    target: string,
    before: OpenApiSchemaSnapshot,
    after: OpenApiSchemaSnapshot,
    context: "request" | "response",
    path = "$",
): OpenApiDiffItem[] {
    const items: OpenApiDiffItem[] = []

    if (before.unresolvedRef || after.unresolvedRef) {
        items.push({
            kind: "changed",
            target,
            message: `schema ref could not be fully resolved: ${before.unresolvedRef ?? after.unresolvedRef}`,
            before: before.unresolvedRef,
            after: after.unresolvedRef,
        })
        return items
    }

    if (before.type && after.type && before.type !== after.type) {
        items.push({
            kind: "breaking",
            target: `${target} ${path}`,
            message: `schema type changed: ${before.type} -> ${after.type}`,
            before: before.type,
            after: after.type,
        })
    }

    if (before.enum && after.enum) {
        if (enumNarrowed(before.enum, after.enum)) {
            items.push({
                kind: "breaking",
                target: `${target} ${path}`,
                message: "schema enum narrowed.",
                before: stableStringify(before.enum),
                after: stableStringify(after.enum),
            })
        } else if (enumWidened(before.enum, after.enum)) {
            items.push({
                kind: "changed",
                target: `${target} ${path}`,
                message: "schema enum widened.",
                before: stableStringify(before.enum),
                after: stableStringify(after.enum),
            })
        } else if (stableStringify(before.enum) !== stableStringify(after.enum)) {
            items.push({
                kind: "changed",
                target: `${target} ${path}`,
                message: "schema enum changed.",
                before: stableStringify(before.enum),
                after: stableStringify(after.enum),
            })
        }
    }

    const beforeRequired = new Set(before.required)
    const afterRequired = new Set(after.required)
    for (const requiredProperty of after.required) {
        if (!beforeRequired.has(requiredProperty)) {
            items.push({
                kind: context === "request" ? "breaking" : "changed",
                target: `${target} ${schemaPathJoin(path, requiredProperty)}`,
                message: `${context} schema added required property.`,
                after: requiredProperty,
            })
        }
    }
    for (const requiredProperty of before.required) {
        if (!afterRequired.has(requiredProperty)) {
            items.push({
                kind: "changed",
                target: `${target} ${schemaPathJoin(path, requiredProperty)}`,
                message: `${context} schema removed required property.`,
                before: requiredProperty,
            })
        }
    }

    const beforePropertyNames = Object.keys(before.properties).sort()
    const afterPropertyNames = Object.keys(after.properties).sort()
    const afterPropertySet = new Set(afterPropertyNames)
    const beforePropertySet = new Set(beforePropertyNames)

    for (const propertyName of beforePropertyNames) {
        if (!afterPropertySet.has(propertyName)) {
            items.push({
                kind: context === "response" ? "breaking" : "changed",
                target: `${target} ${schemaPathJoin(path, propertyName)}`,
                message: `${context} schema property removed.`,
                before: propertyName,
            })
            continue
        }
        items.push(...diffSchemaCompatibility(
            target,
            before.properties[propertyName],
            after.properties[propertyName],
            context,
            schemaPathJoin(path, propertyName),
        ))
    }

    for (const propertyName of afterPropertyNames) {
        if (!beforePropertySet.has(propertyName) && !afterRequired.has(propertyName)) {
            items.push({
                kind: "changed",
                target: `${target} ${schemaPathJoin(path, propertyName)}`,
                message: `${context} schema property added.`,
                after: propertyName,
            })
        }
    }

    if (items.length === 0 && before.fingerprint !== after.fingerprint) {
        items.push({
            kind: "changed",
            target,
            message: `${context} schema changed.`,
            before: before.fingerprint,
            after: after.fingerprint,
        })
    }

    return items
}

function diffRequestBody(target: string, before: OpenApiRequestBodySnapshot | undefined, after: OpenApiRequestBodySnapshot | undefined): OpenApiDiffItem[] {
    if (!before && !after) return []
    if (!before && after) {
        const items: OpenApiDiffItem[] = [{
            kind: after.required ? "breaking" : "changed",
            target,
            message: after.required ? "required requestBody added." : "optional requestBody added.",
            after: requiredLabel(after.required),
        }]
        return [
            ...items,
            ...Object.entries(after.mediaTypes).map(([mediaType]) => ({
                kind: "changed" as const,
                target,
                message: `request media type added: ${mediaType}`,
                after: mediaType,
            })),
        ]
    }
    if (before && !after) {
        return [{
            kind: "changed",
            target,
            message: "requestBody removed.",
            before: requiredLabel(before.required),
        }]
    }

    const beforeBody = before!
    const afterBody = after!
    const items: OpenApiDiffItem[] = []
    if (beforeBody.required !== afterBody.required) {
        items.push({
            kind: afterBody.required ? "breaking" : "changed",
            target,
            message: `requestBody requiredness changed: ${requiredLabel(beforeBody.required)} -> ${requiredLabel(afterBody.required)}`,
            before: requiredLabel(beforeBody.required),
            after: requiredLabel(afterBody.required),
        })
    }

    items.push(...diffMediaTypes(target, "request", beforeBody.mediaTypes, afterBody.mediaTypes))
    for (const mediaType of Object.keys(beforeBody.mediaTypes).sort()) {
        if (afterBody.mediaTypes[mediaType]) {
            items.push(...diffSchemaCompatibility(`${target} request ${mediaType}`, beforeBody.mediaTypes[mediaType], afterBody.mediaTypes[mediaType], "request"))
        }
    }
    return items
}

function diffResponseContent(target: string, before: OpenApiResponseContentSnapshot[], after: OpenApiResponseContentSnapshot[]): OpenApiDiffItem[] {
    const beforeByStatus = new Map(before.map((response) => [response.statusCode, response]))
    const afterByStatus = new Map(after.map((response) => [response.statusCode, response]))
    const items: OpenApiDiffItem[] = []

    for (const [statusCode, beforeResponse] of beforeByStatus) {
        const afterResponse = afterByStatus.get(statusCode)
        if (!afterResponse) continue
        const responseTarget = `${target} response ${statusCode}`
        items.push(...diffMediaTypes(responseTarget, "response", beforeResponse.mediaTypes, afterResponse.mediaTypes))
        for (const mediaType of Object.keys(beforeResponse.mediaTypes).sort()) {
            if (afterResponse.mediaTypes[mediaType]) {
                items.push(...diffSchemaCompatibility(`${responseTarget} ${mediaType}`, beforeResponse.mediaTypes[mediaType], afterResponse.mediaTypes[mediaType], "response"))
            }
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
        items.push(...diffRequestBody(target, beforeOperation.requestBody, afterOperation.requestBody))
        items.push(...diffList(target, "response", beforeOperation.responses, afterOperation.responses))
        items.push(...diffResponseContent(target, beforeOperation.responseContent, afterOperation.responseContent))
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
