import { readStorageJson, writeStorageJson } from "@/core/storage/tool-persistence"

const FAVORITE_TOOL_KEYS_STORAGE_KEY = "byteflow:tools:favorites"
const RECENT_TOOL_KEYS_STORAGE_KEY = "byteflow:tools:recent"
const MAX_RECENT_TOOLS = 10

export const TOOL_DISCOVERY_UPDATED_EVENT = "byteflow:tool-discovery-updated"

export type StoredToolDiscoveryRecord = {
    toolKey: string
    updatedAt: string
}

function isoNow(): string {
    return new Date().toISOString()
}

function normalizeStoredRecords(value: unknown): StoredToolDiscoveryRecord[] {
    if (!Array.isArray(value)) return []

    const normalized: StoredToolDiscoveryRecord[] = []
    const seen = new Set<string>()
    for (const item of value) {
        const key = typeof item === "string"
            ? item.trim()
            : typeof item === "object" && item !== null && "toolKey" in item && typeof item.toolKey === "string"
                ? item.toolKey.trim()
                : ""
        if (!key || seen.has(key)) continue

        const updatedAt = typeof item === "object" && item !== null && "updatedAt" in item && typeof item.updatedAt === "string"
            ? item.updatedAt
            : isoNow()
        seen.add(key)
        normalized.push({ toolKey: key, updatedAt })
    }
    return normalized
}

function normalizeToolKeys(value: unknown): string[] {
    return normalizeStoredRecords(value).map((record) => record.toolKey)
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

export function readFavoriteToolRecords(): StoredToolDiscoveryRecord[] {
    return normalizeStoredRecords(readStorageJson<unknown>(FAVORITE_TOOL_KEYS_STORAGE_KEY, []))
}

export function readRecentToolRecords(): StoredToolDiscoveryRecord[] {
    return normalizeStoredRecords(readStorageJson<unknown>(RECENT_TOOL_KEYS_STORAGE_KEY, []))
}

export function setFavoriteToolKeys(toolKeys: string[]): string[] {
    const currentByKey = new Map(readFavoriteToolRecords().map((record) => [record.toolKey, record.updatedAt]))
    const next = normalizeStoredRecords(toolKeys).map((record) => ({
        toolKey: record.toolKey,
        updatedAt: currentByKey.get(record.toolKey) ?? record.updatedAt,
    }))
    writeStorageJson(FAVORITE_TOOL_KEYS_STORAGE_KEY, next)
    emitUpdateEvent()
    return next.map((record) => record.toolKey)
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
    const currentByKey = new Map(readRecentToolRecords().map((record) => [record.toolKey, record.updatedAt]))
    const nextKeys = [key, ...current.filter((item) => item !== key)].slice(0, MAX_RECENT_TOOLS)
    const next = nextKeys.map((toolKey) => ({
        toolKey,
        updatedAt: toolKey === key ? isoNow() : currentByKey.get(toolKey) ?? isoNow(),
    }))

    if (nextKeys.length === current.length && nextKeys.every((item, index) => item === current[index])) {
        return current
    }

    writeStorageJson(RECENT_TOOL_KEYS_STORAGE_KEY, next)
    emitUpdateEvent()
    return nextKeys
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
