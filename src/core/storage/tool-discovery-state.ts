import { readStorageJson, writeStorageJson } from "@/core/storage/tool-persistence"

const FAVORITE_TOOL_KEYS_STORAGE_KEY = "byteflow:tools:favorites"
const RECENT_TOOL_KEYS_STORAGE_KEY = "byteflow:tools:recent"
const MAX_RECENT_TOOLS = 10

export const TOOL_DISCOVERY_UPDATED_EVENT = "byteflow:tool-discovery-updated"

function normalizeToolKeys(value: unknown): string[] {
    if (!Array.isArray(value)) return []

    const normalized: string[] = []
    const seen = new Set<string>()
    for (const item of value) {
        if (typeof item !== "string") continue
        const key = item.trim()
        if (!key || seen.has(key)) continue
        seen.add(key)
        normalized.push(key)
    }
    return normalized
}

function emitUpdateEvent() {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(TOOL_DISCOVERY_UPDATED_EVENT))
}

export function readFavoriteToolKeys(): string[] {
    return normalizeToolKeys(readStorageJson<unknown>(FAVORITE_TOOL_KEYS_STORAGE_KEY, []))
}

export function readRecentToolKeys(): string[] {
    return normalizeToolKeys(readStorageJson<unknown>(RECENT_TOOL_KEYS_STORAGE_KEY, []))
}

export function setFavoriteToolKeys(toolKeys: string[]): string[] {
    const next = normalizeToolKeys(toolKeys)
    writeStorageJson(FAVORITE_TOOL_KEYS_STORAGE_KEY, next)
    emitUpdateEvent()
    return next
}

export function toggleFavoriteToolKey(toolKey: string): string[] {
    const key = toolKey.trim()
    if (!key) return readFavoriteToolKeys()

    const current = readFavoriteToolKeys()
    const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [key, ...current]

    return setFavoriteToolKeys(next)
}

export function recordRecentToolKey(toolKey: string): string[] {
    const key = toolKey.trim()
    if (!key) return readRecentToolKeys()

    const current = readRecentToolKeys()
    const next = [key, ...current.filter((item) => item !== key)].slice(0, MAX_RECENT_TOOLS)

    if (next.length === current.length && next.every((item, index) => item === current[index])) {
        return current
    }

    writeStorageJson(RECENT_TOOL_KEYS_STORAGE_KEY, next)
    emitUpdateEvent()
    return next
}

export function clearRecentToolKeys(): string[] {
    writeStorageJson(RECENT_TOOL_KEYS_STORAGE_KEY, [])
    emitUpdateEvent()
    return []
}

export function clearFavoriteToolKeys(): string[] {
    writeStorageJson(FAVORITE_TOOL_KEYS_STORAGE_KEY, [])
    emitUpdateEvent()
    return []
}

export function clearHistory() {
    writeStorageJson(FAVORITE_TOOL_KEYS_STORAGE_KEY, [])
    writeStorageJson(RECENT_TOOL_KEYS_STORAGE_KEY, [])
    emitUpdateEvent()
}
