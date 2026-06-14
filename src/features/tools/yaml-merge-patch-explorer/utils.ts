import YAML from "yaml"

export type YamlExplorerMode = "merge-documents" | "merge-patch"

export interface YamlChange {
    path: string
    type: "added" | "removed" | "changed"
    before?: unknown
    after?: unknown
}

export interface YamlExplorerResult {
    output: string
    documentCount: number
    changes: YamlChange[]
    error?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function parseYamlDocuments(input: string): unknown[] {
    const documents = YAML.parseAllDocuments(input)
    const errors = documents.flatMap((document) => document.errors)
    if (errors.length > 0) {
        throw new Error(errors[0].message)
    }
    return documents.map((document) => document.toJSON())
}

export function deepMergeYamlValues(values: unknown[]): unknown {
    return values.reduce((merged, value) => deepMerge(merged, value), {})
}

function deepMerge(base: unknown, next: unknown): unknown {
    if (Array.isArray(base) && Array.isArray(next)) {
        return [...base, ...next]
    }

    if (isRecord(base) && isRecord(next)) {
        const result: Record<string, unknown> = { ...base }
        for (const [key, value] of Object.entries(next)) {
            result[key] = key in result ? deepMerge(result[key], value) : value
        }
        return result
    }

    return next
}

export function applyJsonMergePatch(base: unknown, patch: unknown): unknown {
    if (!isRecord(patch)) {
        return patch
    }

    const result: Record<string, unknown> = isRecord(base) ? { ...base } : {}
    for (const [key, value] of Object.entries(patch)) {
        if (value === null) {
            delete result[key]
        } else {
            result[key] = applyJsonMergePatch(result[key], value)
        }
    }
    return result
}

export function diffYamlValues(before: unknown, after: unknown, basePath = "$"): YamlChange[] {
    if (Object.is(before, after)) return []

    if (isRecord(before) && isRecord(after)) {
        const keys = new Set([...Object.keys(before), ...Object.keys(after)])
        const changes: YamlChange[] = []
        for (const key of Array.from(keys).sort()) {
            const path = `${basePath}.${key}`
            if (!(key in after)) {
                changes.push({ path, type: "removed", before: before[key] })
            } else if (!(key in before)) {
                changes.push({ path, type: "added", after: after[key] })
            } else {
                changes.push(...diffYamlValues(before[key], after[key], path))
            }
        }
        return changes
    }

    if (Array.isArray(before) && Array.isArray(after)) {
        if (JSON.stringify(before) === JSON.stringify(after)) return []
        return [{ path: basePath, type: "changed", before, after }]
    }

    return [{ path: basePath, type: before === undefined ? "added" : after === undefined ? "removed" : "changed", before, after }]
}

export function runYamlExplorer(input: string, patchInput: string, mode: YamlExplorerMode): YamlExplorerResult {
    try {
        if (mode === "merge-documents") {
            const documents = parseYamlDocuments(input)
            const merged = deepMergeYamlValues(documents)
            return {
                output: YAML.stringify(merged),
                documentCount: documents.length,
                changes: documents.length > 0 ? diffYamlValues(documents[0], merged) : [],
            }
        }

        const base = YAML.parse(input)
        const patch = YAML.parse(patchInput)
        const patched = applyJsonMergePatch(base, patch)
        return {
            output: YAML.stringify(patched),
            documentCount: 2,
            changes: diffYamlValues(base, patched),
        }
    } catch (error) {
        return {
            output: "",
            documentCount: 0,
            changes: [],
            error: error instanceof Error ? error.message : "Unable to parse YAML input.",
        }
    }
}
