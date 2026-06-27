export type CronFieldKey = "seconds" | "minute" | "hour" | "day_month" | "month" | "day_week"

export type CronFieldDefinition = {
    key: CronFieldKey
    min: number
    max: number
}

export type CronValidationResult =
    | { ok: true; parts: string[]; hasSeconds: boolean; normalized: string }
    | { ok: false; error: string }

export const FIVE_FIELD_CRON_DEFINITIONS: CronFieldDefinition[] = [
    { key: "minute", min: 0, max: 59 },
    { key: "hour", min: 0, max: 23 },
    { key: "day_month", min: 1, max: 31 },
    { key: "month", min: 1, max: 12 },
    { key: "day_week", min: 0, max: 6 },
]

export const SIX_FIELD_CRON_DEFINITIONS: CronFieldDefinition[] = [
    { key: "seconds", min: 0, max: 59 },
    ...FIVE_FIELD_CRON_DEFINITIONS,
]

export function parseCronParts(expression: string): string[] {
    const trimmed = expression.trim()
    return trimmed ? trimmed.split(/\s+/) : []
}

export function normalizeCronExpression(expression: string): string {
    return parseCronParts(expression).join(" ")
}

export function getCronFieldDefinitions(partCount: number): CronFieldDefinition[] {
    return partCount === 6 ? SIX_FIELD_CRON_DEFINITIONS : FIVE_FIELD_CRON_DEFINITIONS
}

function getFieldErrorLabel(field: CronFieldDefinition): string {
    return field.key.replace("_", " ")
}

function validateNumericTokens(field: string, definition: CronFieldDefinition): string | null {
    const numericTokens = field.match(/\d+/g) ?? []
    for (const token of numericTokens) {
        const value = Number(token)
        if (!Number.isInteger(value) || value < definition.min || value > definition.max) {
            return `Invalid cron ${getFieldErrorLabel(definition)} field. Expected ${definition.min}-${definition.max}, got ${token}.`
        }
    }
    return null
}

export function validateCronExpression(expression: string, genericError: string): CronValidationResult {
    const parts = parseCronParts(expression)
    if (parts.length !== 5 && parts.length !== 6) {
        return { ok: false, error: genericError }
    }

    const definitions = getCronFieldDefinitions(parts.length)
    for (let index = 0; index < definitions.length; index += 1) {
        const fieldError = validateNumericTokens(parts[index] ?? "", definitions[index])
        if (fieldError) return { ok: false, error: fieldError }
    }

    return {
        ok: true,
        parts,
        hasSeconds: parts.length === 6,
        normalized: parts.join(" "),
    }
}

export function updateCronPart(expression: string, index: number, value: string): string {
    const parts = parseCronParts(expression)
    const targetLength = parts.length === 6 ? 6 : 5
    while (parts.length < targetLength) parts.push("*")
    parts[index] = value.trim() || "*"
    return parts.slice(0, targetLength).join(" ")
}
