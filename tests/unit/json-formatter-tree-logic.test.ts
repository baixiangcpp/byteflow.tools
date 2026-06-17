import { describe, expect, it } from "vitest"
import {
    findMatchingPaths,
    getAllPaths,
    getValueAtPath,
    pathKey,
    removeValueAtPath,
    renameObjectKey,
    updateValueAtPath,
} from "@/features/tools/json-formatter/logic"
import type { JsonValue } from "@/features/tools/json-formatter/types"

const sample: JsonValue = {
    user: {
        name: "Alice",
        roles: ["admin", "editor"],
        profile: {
            active: true,
        },
    },
    count: 2,
}

describe("json formatter tree logic", () => {
    it("builds stable path keys for root and nested nodes", () => {
        expect(pathKey([])).toBe("$")
        expect(pathKey(["user", "roles", 1])).toBe("user__roles__1")
    })

    it("reads nested object and array values by path", () => {
        expect(getValueAtPath(sample, ["user", "name"])).toBe("Alice")
        expect(getValueAtPath(sample, ["user", "roles", 1])).toBe("editor")
    })

    it("returns the root value when a path cannot be traversed", () => {
        expect(getValueAtPath(sample, ["user", 0])).toBe(sample)
        expect(getValueAtPath(sample, ["count", "nested"])).toBe(sample)
    })

    it("updates nested values immutably", () => {
        const next = updateValueAtPath(sample, ["user", "roles", 0], "owner")

        expect(getValueAtPath(next, ["user", "roles", 0])).toBe("owner")
        expect(getValueAtPath(sample, ["user", "roles", 0])).toBe("admin")
        expect(next).not.toBe(sample)
    })

    it("removes object keys and array entries by path", () => {
        const withoutProfile = removeValueAtPath(sample, ["user", "profile"])
        const withoutRole = removeValueAtPath(sample, ["user", "roles", 0])

        expect(getValueAtPath(withoutProfile, ["user"])).toEqual({
            name: "Alice",
            roles: ["admin", "editor"],
        })
        expect(getValueAtPath(withoutRole, ["user", "roles"])).toEqual(["editor"])
    })

    it("renames object keys without overwriting existing keys", () => {
        const renamed = renameObjectKey(sample, ["user"], "name", "displayName")
        const blocked = renameObjectKey(sample, ["user"], "name", "roles")

        expect(getValueAtPath(renamed, ["user"])).toEqual({
            displayName: "Alice",
            roles: ["admin", "editor"],
            profile: {
                active: true,
            },
        })
        expect(blocked).toBe(sample)
    })

    it("collects all tree paths for expand-all behavior", () => {
        expect([...getAllPaths(sample)].sort()).toEqual([
            "$",
            "count",
            "user",
            "user__name",
            "user__profile",
            "user__profile__active",
            "user__roles",
            "user__roles__0",
            "user__roles__1",
        ])
    })

    it("finds matching value paths and includes parent paths for auto-expand", () => {
        const result = findMatchingPaths(sample, "editor")

        expect([...result.matched].sort()).toEqual(["user__roles", "user__roles__1"])
        expect([...result.parents].sort()).toEqual(["$", "user", "user__roles", "user__roles__1"])
    })

    it("finds matching key paths case-insensitively", () => {
        const result = findMatchingPaths(sample, "PROFILE")

        expect(result.matched.has("user__profile")).toBe(true)
        expect(result.parents.has("user")).toBe(true)
    })
})
