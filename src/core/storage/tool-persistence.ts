export function readStorageString(key: string): string | null {
    if (typeof window === "undefined") return null
    try {
        return window.localStorage.getItem(key)
    } catch {
        return null
    }
}

export function writeStorageString(key: string, value: string): void {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(key, value)
    } catch {
        // Ignore quota/security errors for non-critical preference storage.
    }
}

export function removeStorageKey(key: string): void {
    if (typeof window === "undefined") return
    try {
        window.localStorage.removeItem(key)
    } catch {
        // Ignore quota/security errors for non-critical preference storage.
    }
}

export function readStorageJson<T>(key: string, fallback: T): T {
    const raw = readStorageString(key)
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

export function writeStorageJson<T>(key: string, value: T): void {
    writeStorageString(key, JSON.stringify(value))
}
