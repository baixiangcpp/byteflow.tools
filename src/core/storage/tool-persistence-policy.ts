import { removeStorageKey, writeStorageString } from "./tool-persistence"

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

export function clearByteflowLocalData(): number {
    if (typeof window === "undefined") return 0

    let removed = 0
    const keys: string[] = []
    try {
        for (let index = 0; index < window.localStorage.length; index += 1) {
            const key = window.localStorage.key(index)
            if (key?.startsWith("byteflow:")) keys.push(key)
        }

        keys.forEach((key) => {
            window.localStorage.removeItem(key)
            removed += 1
        })
    } catch {
        return removed
    }

    return removed
}
