import { beforeEach, describe, expect, it } from "vitest"
import {
    readFavoriteToolKeys,
    readRecentToolKeys,
    recordRecentToolKey,
    toggleFavoriteToolKey,
    TOOL_DISCOVERY_UPDATED_EVENT,
} from "@/core/storage/tool-discovery-state"

function installMemoryStorage() {
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
}

describe("tool-discovery-state", () => {
    beforeEach(() => {
        installMemoryStorage()
    })

    it("toggles favorites", () => {
        expect(readFavoriteToolKeys()).toEqual([])

        toggleFavoriteToolKey("json_formatter")
        expect(readFavoriteToolKeys()).toEqual(["json_formatter"])

        toggleFavoriteToolKey("list_randomizer")
        expect(readFavoriteToolKeys()).toEqual(["list_randomizer", "json_formatter"])

        toggleFavoriteToolKey("json_formatter")
        expect(readFavoriteToolKeys()).toEqual(["list_randomizer"])
    })

    it("records recents with de-duplication and cap", () => {
        recordRecentToolKey("json_formatter")
        recordRecentToolKey("list_randomizer")
        recordRecentToolKey("json_formatter")

        expect(readRecentToolKeys().slice(0, 3)).toEqual(["json_formatter", "list_randomizer"])

        for (let index = 0; index < 12; index += 1) {
            recordRecentToolKey(`tool_${index}`)
        }

        expect(readRecentToolKeys()).toHaveLength(10)
        expect(readRecentToolKeys()[0]).toBe("tool_11")
    })

    it("emits discovery update event when state changes", () => {
        let eventCount = 0
        const handler = () => {
            eventCount += 1
        }

        window.addEventListener(TOOL_DISCOVERY_UPDATED_EVENT, handler)
        toggleFavoriteToolKey("json_formatter")
        recordRecentToolKey("json_formatter")
        window.removeEventListener(TOOL_DISCOVERY_UPDATED_EVENT, handler)

        expect(eventCount).toBe(2)
    })
})
