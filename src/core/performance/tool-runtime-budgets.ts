import { measureUtf8Bytes } from "@/core/utils/phase4-inspector-limits"

export const TOOL_RUNTIME_BUDGETS = {
    maxCsvJsonInputBytes: 1024 * 1024,
    maxCsvJsonRows: 5000,
    maxDiffInputBytes: 512 * 1024,
    maxDiffRows: 5000,
    maxJsonDiffFlattenedNodes: 10000,
    maxOpenApiSpecBytes: 1024 * 1024,
    maxOpenApiEndpoints: 500,
    maxOpenApiMockEndpoints: 300,
    maxOpenApiMockSchemaProperties: 2000,
} as const

export const LEGACY_INPUT_LIMITS = TOOL_RUNTIME_BUDGETS

export function formatByteLimit(bytes: number): string {
    if (bytes >= 1024 * 1024) {
        return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`
    }
    if (bytes >= 1024) {
        return `${Number((bytes / 1024).toFixed(1))} KB`
    }
    return `${bytes} bytes`
}

export function isOverUtf8Budget(value: string, maxBytes: number): boolean {
    return measureUtf8Bytes(value, maxBytes).exceeded
}

export function countNonEmptyLines(value: string, maxLines = Number.POSITIVE_INFINITY): { lines: number; exceeded: boolean } {
    let lines = 0
    for (const line of value.split(/\r?\n/)) {
        if (!line.trim()) continue
        lines += 1
        if (lines > maxLines) return { lines, exceeded: true }
    }
    return { lines, exceeded: false }
}

export function buildInputTooLargeMessage(template: string, maxBytes: number): string {
    return template.replace("{size}", formatByteLimit(maxBytes))
}
