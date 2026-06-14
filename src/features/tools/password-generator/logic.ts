import type { SavedPasswordPreset } from "@/features/tools/password-generator/utils"
import type { SeparatorKey } from "./types"

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

export function getSeparatorKey(separator: string): SeparatorKey {
    if (separator === " ") return "space"
    if (separator === "_") return "underscore"
    if (separator === ".") return "dot"
    return "hyphen"
}

function asText(value: unknown): string {
    return typeof value === "string" ? value : ""
}

export function parsePreset(candidate: unknown): SavedPasswordPreset | null {
    if (!candidate || typeof candidate !== "object") return null
    const record = candidate as Record<string, unknown>
    const mode = record.mode === "passphrase" ? "passphrase" : record.mode === "random" ? "random" : null
    if (!mode) return null

    return {
        id: asText(record.id),
        name: asText(record.name),
        mode,
        random: {
            length: clamp(Number((record.random as Record<string, unknown>)?.length || 16), 4, 128),
            includeUppercase: Boolean((record.random as Record<string, unknown>)?.includeUppercase),
            includeLowercase: Boolean((record.random as Record<string, unknown>)?.includeLowercase),
            includeNumbers: Boolean((record.random as Record<string, unknown>)?.includeNumbers),
            includeSymbols: Boolean((record.random as Record<string, unknown>)?.includeSymbols),
            excludeSimilar: Boolean((record.random as Record<string, unknown>)?.excludeSimilar),
            customCharset: asText((record.random as Record<string, unknown>)?.customCharset),
        },
        passphrase: {
            wordCount: clamp(Number((record.passphrase as Record<string, unknown>)?.wordCount || 4), 2, 12),
            separator: asText((record.passphrase as Record<string, unknown>)?.separator) || "-",
            capitalizeWords: Boolean((record.passphrase as Record<string, unknown>)?.capitalizeWords),
            appendNumber: Boolean((record.passphrase as Record<string, unknown>)?.appendNumber),
            appendSymbol: Boolean((record.passphrase as Record<string, unknown>)?.appendSymbol),
        },
        batchCount: clamp(Number(record.batchCount || 1), 1, 100),
    }
}
