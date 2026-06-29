import { removeStorageKey, writeStorageString } from "./tool-persistence"
import { getAnalyticsOptOutStorageKey } from "@/core/analytics/preferences"

export type ToolInputPersistenceMode = true | false | "opt-in"

export type ToolPersistencePolicy = {
    persistInput: ToolInputPersistenceMode
    inputStorageKey?: string
    maxInputChars?: number
}

export function shouldPersistToolInput(policy: ToolPersistencePolicy): boolean {
    return policy.persistInput === true
}

export function enforceToolInputPersistencePolicy(policy: ToolPersistencePolicy, input: string): void {
    if (!policy.inputStorageKey) return

    if (!shouldPersistToolInput(policy) || !input.trim()) {
        removeStorageKey(policy.inputStorageKey)
        return
    }

    if (typeof policy.maxInputChars === "number" && input.length > policy.maxInputChars) {
        removeStorageKey(policy.inputStorageKey)
        return
    }

    writeStorageString(policy.inputStorageKey, input)
}

export type ClearByteflowBrowserDataOptions = {
    preserveAnalyticsOptOut?: boolean
    includeSessionStorage?: boolean
}

function collectByteflowStorageKeys(
    storage: Storage,
    preservedKeys: ReadonlySet<string>,
): string[] {
    const keys: string[] = []
    for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index)
        if (key?.startsWith("byteflow:") && !preservedKeys.has(key)) keys.push(key)
    }
    return keys
}

export function clearByteflowBrowserData(options: ClearByteflowBrowserDataOptions = {}): number {
    if (typeof window === "undefined") return 0

    const preserveAnalyticsOptOut = options.preserveAnalyticsOptOut ?? true
    const preservedKeys = new Set<string>()
    if (preserveAnalyticsOptOut) preservedKeys.add(getAnalyticsOptOutStorageKey())

    let removed = 0
    try {
        collectByteflowStorageKeys(window.localStorage, preservedKeys).forEach((key) => {
            window.localStorage.removeItem(key)
            removed += 1
        })
        if (options.includeSessionStorage ?? true) {
            collectByteflowStorageKeys(window.sessionStorage, preservedKeys).forEach((key) => {
                window.sessionStorage.removeItem(key)
                removed += 1
            })
        }
    } catch {
        return removed
    }

    return removed
}

export function clearByteflowLocalData(): number {
    return clearByteflowBrowserData()
}
