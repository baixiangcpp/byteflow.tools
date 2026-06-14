import { beforeEach, describe, expect, it } from "vitest"
import {
    readStorageJson,
    readStorageString,
    removeStorageKey,
    writeStorageJson,
    writeStorageString,
} from "@/core/storage/tool-persistence"

describe("tool-persistence", () => {
    beforeEach(() => {
        const store = new Map<string, string>()
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
                setItem: (key: string, value: string) => {
                    store.set(key, value)
                },
                removeItem: (key: string) => {
                    store.delete(key)
                },
            },
        })
    })

    it("writes and reads string values", () => {
        const key = "byteflow:test:key"
        removeStorageKey(key)
        writeStorageString(key, "value")
        expect(readStorageString(key)).toBe("value")
        removeStorageKey(key)
    })

    it("reads json values and returns fallback on invalid payload", () => {
        const key = "byteflow:test:json"
        removeStorageKey(key)

        writeStorageJson(key, { ok: true, count: 2 })
        expect(readStorageJson(key, { ok: false, count: 0 })).toEqual({ ok: true, count: 2 })

        writeStorageString(key, "not-json")
        expect(readStorageJson(key, { ok: false, count: 0 })).toEqual({ ok: false, count: 0 })
        removeStorageKey(key)
    })

    it("removes stored values", () => {
        const key = "byteflow:test:remove"
        writeStorageString(key, "will-delete")
        removeStorageKey(key)
        expect(readStorageString(key)).toBeNull()
    })
})
