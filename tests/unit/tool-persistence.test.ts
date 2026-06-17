import { beforeEach, describe, expect, it } from "vitest"
import {
    readStorageJson,
    readStorageString,
    removeStorageKey,
    writeStorageJson,
    writeStorageString,
} from "@/core/storage/tool-persistence"
import { enforceToolInputPersistencePolicy, shouldPersistToolInput } from "@/core/storage/tool-persistence-policy"

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

    it("enforces input persistence policy", () => {
        const key = "byteflow:test:policy"

        expect(shouldPersistToolInput({ persistInput: false })).toBe(false)
        expect(shouldPersistToolInput({ persistInput: "opt-in" })).toBe(false)
        expect(shouldPersistToolInput({ persistInput: true })).toBe(true)

        enforceToolInputPersistencePolicy({ persistInput: true, inputStorageKey: key, maxInputChars: 10 }, "payload")
        expect(readStorageString(key)).toBe("payload")

        enforceToolInputPersistencePolicy({ persistInput: true, inputStorageKey: key, maxInputChars: 3 }, "payload")
        expect(readStorageString(key)).toBeNull()

        writeStorageString(key, "old")
        enforceToolInputPersistencePolicy({ persistInput: false, inputStorageKey: key }, "payload")
        expect(readStorageString(key)).toBeNull()
    })
})
