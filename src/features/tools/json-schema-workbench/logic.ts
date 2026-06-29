import type { JsonSchemaValidationIssue, JsonSchemaValidationReport, JsonSchemaValidationWarning, JsonSchemaValue } from "./types"

const SUPPORTED_SCHEMA_KEYWORDS = new Set([
    "$schema",
    "additionalProperties",
    "enum",
    "items",
    "maximum",
    "maxLength",
    "minimum",
    "minLength",
    "properties",
    "required",
    "type",
])

const NON_VALIDATION_CONTAINER_KEYWORDS = new Set([
    "$defs",
    "definitions",
    "description",
    "examples",
    "title",
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function inferType(value: unknown): string {
    if (value === null) return "null"
    if (Array.isArray(value)) return "array"
    if (Number.isInteger(value)) return "integer"
    if (typeof value === "number") return "number"
    return typeof value
}

function mergeSchemas(left: JsonSchemaValue, right: JsonSchemaValue): JsonSchemaValue {
    if (!left.type) return right
    if (!right.type) return left
    if (JSON.stringify(left) === JSON.stringify(right)) return left
    const leftTypes = Array.isArray(left.type) ? left.type : [left.type]
    const rightTypes = Array.isArray(right.type) ? right.type : [right.type]
    return { type: Array.from(new Set([...leftTypes, ...rightTypes])).sort() }
}

export function generateJsonSchemaFromSample(value: unknown): JsonSchemaValue {
    const type = inferType(value)
    if (type === "object" && isPlainObject(value)) {
        const properties = Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, generateJsonSchemaFromSample(entry)]),
        )
        return {
            type: "object",
            required: Object.keys(value),
            properties,
            additionalProperties: true,
        }
    }
    if (type === "array" && Array.isArray(value)) {
        const itemSchemas = value.map(generateJsonSchemaFromSample)
        const items = itemSchemas.reduce<JsonSchemaValue | undefined>((acc, schema) => (acc ? mergeSchemas(acc, schema) : schema), undefined)
        return { type: "array", items: items ?? {} }
    }
    return { type }
}

export function generateJsonSchema(input: string): string {
    const parsed = JSON.parse(input)
    return JSON.stringify(
        {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            ...generateJsonSchemaFromSample(parsed),
        },
        null,
        2,
    )
}

function pathJoin(path: string, segment: string): string {
    if (!path) return segment.startsWith("[") ? `$${segment}` : `$.${segment}`
    return segment.startsWith("[") ? `${path}${segment}` : `${path}.${segment}`
}

function acceptsType(schema: JsonSchemaValue, value: unknown): boolean {
    if (!schema.type) return true
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type]
    const actual = inferType(value)
    return allowed.includes(actual) || (actual === "integer" && allowed.includes("number"))
}

function addIssue(issues: JsonSchemaValidationIssue[], path: string, message: string, fix: string) {
    issues.push({ path: path || "$", message, fix })
}

function addWarning(warnings: JsonSchemaValidationWarning[], path: string, keyword: string) {
    if (warnings.some((warning) => warning.path === path && warning.keyword === keyword)) return
    warnings.push({
        path: path || "$",
        keyword,
        message: `Basic mode does not enforce "${keyword}" at ${path || "$"}.`,
    })
}

function discoverUnsupportedKeywords(schema: unknown, path: string, warnings: JsonSchemaValidationWarning[]) {
    if (!isPlainObject(schema)) return

    for (const [keyword, value] of Object.entries(schema)) {
        if (!SUPPORTED_SCHEMA_KEYWORDS.has(keyword) && !NON_VALIDATION_CONTAINER_KEYWORDS.has(keyword)) {
            addWarning(warnings, path, keyword)
        }

        if (keyword === "properties" && isPlainObject(value)) {
            for (const [propertyName, propertySchema] of Object.entries(value)) {
                discoverUnsupportedKeywords(propertySchema, pathJoin(path, propertyName), warnings)
            }
            continue
        }

        if (keyword === "items") {
            if (Array.isArray(value)) {
                value.forEach((itemSchema, index) => discoverUnsupportedKeywords(itemSchema, pathJoin(path, `[${index}]`), warnings))
            } else {
                discoverUnsupportedKeywords(value, pathJoin(path, "[]"), warnings)
            }
            continue
        }

        if ((keyword === "$defs" || keyword === "definitions") && isPlainObject(value)) {
            for (const [definitionName, definitionSchema] of Object.entries(value)) {
                discoverUnsupportedKeywords(definitionSchema, pathJoin(path, definitionName), warnings)
            }
        }
    }
}

function validateAgainstSchema(value: unknown, schema: JsonSchemaValue, path: string, issues: JsonSchemaValidationIssue[]) {
    if (!acceptsType(schema, value)) {
        addIssue(issues, path, `Expected ${Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type}, received ${inferType(value)}.`, "Change the payload value or update the schema type.")
        return
    }

    if (schema.enum && !schema.enum.some((entry) => JSON.stringify(entry) === JSON.stringify(value))) {
        addIssue(issues, path, "Value is not included in the schema enum.", "Use one of the allowed enum values or update the enum list.")
    }

    if (typeof value === "number") {
        if (typeof schema.minimum === "number" && value < schema.minimum) {
            addIssue(issues, path, `Value is below minimum ${schema.minimum}.`, "Increase the value or lower the schema minimum.")
        }
        if (typeof schema.maximum === "number" && value > schema.maximum) {
            addIssue(issues, path, `Value is above maximum ${schema.maximum}.`, "Decrease the value or raise the schema maximum.")
        }
    }

    if (typeof value === "string") {
        if (typeof schema.minLength === "number" && value.length < schema.minLength) {
            addIssue(issues, path, `String is shorter than minLength ${schema.minLength}.`, "Add characters or lower minLength.")
        }
        if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
            addIssue(issues, path, `String is longer than maxLength ${schema.maxLength}.`, "Shorten the value or raise maxLength.")
        }
    }

    if (Array.isArray(value) && schema.items) {
        value.forEach((entry, index) => validateAgainstSchema(entry, schema.items!, pathJoin(path, `[${index}]`), issues))
    }

    if (isPlainObject(value)) {
        const properties = schema.properties ?? {}
        for (const requiredKey of schema.required ?? []) {
            if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) {
                addIssue(issues, pathJoin(path, requiredKey), "Required property is missing.", "Add the property to the payload or remove it from required.")
            }
        }
        for (const [key, entryValue] of Object.entries(value)) {
            const propertySchema = properties[key]
            if (!propertySchema) {
                if (schema.additionalProperties === false) {
                    addIssue(issues, pathJoin(path, key), "Additional property is not allowed.", "Remove the property or allow additionalProperties.")
                }
                continue
            }
            validateAgainstSchema(entryValue, propertySchema, pathJoin(path, key), issues)
        }
    }
}

export function validateJsonWithSchema(payloadInput: string, schemaInput: string): JsonSchemaValidationReport {
    const payload = JSON.parse(payloadInput)
    const schema = JSON.parse(schemaInput) as JsonSchemaValue
    const issues: JsonSchemaValidationIssue[] = []
    const warnings: JsonSchemaValidationWarning[] = []
    discoverUnsupportedKeywords(schema, "$", warnings)
    validateAgainstSchema(payload, schema, "$", issues)
    return {
        valid: issues.length === 0,
        issues,
        warnings,
        summary: issues.length === 0
            ? warnings.length === 0
                ? "Payload matches the supported schema checks."
                : `Payload matches the supported schema checks, with ${warnings.length} warning(s) for unsupported keyword(s).`
            : `${issues.length} schema issue(s) found${warnings.length > 0 ? `, with ${warnings.length} warning(s) for unsupported keyword(s)` : ""}.`,
    }
}

export function formatValidationReport(report: JsonSchemaValidationReport): string {
    const warningLines = report.warnings.map((warning) => `${warning.path}: ${warning.message}`)
    if (report.valid) return [report.summary, ...warningLines].join("\n")
    return [
        report.summary,
        ...report.issues.map((issue) => `${issue.path}: ${issue.message} Fix: ${issue.fix}`),
        ...warningLines,
    ].join("\n")
}

export function runTool(input: string): string {
    return generateJsonSchema(input)
}
