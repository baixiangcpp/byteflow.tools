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
