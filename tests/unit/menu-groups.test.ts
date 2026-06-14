import { describe, expect, it } from "vitest"
import { TOOL_REGISTRY } from "@/core/registry"
import { getMenuGroups } from "@/core/registry/menu-groups"

describe("menu groups", () => {
    it("covers every tool exactly once", () => {
        const groups = getMenuGroups()
        const groupedKeys = groups.flatMap((group) => group.items.map((tool) => tool.key))

        expect(groupedKeys.length).toBe(TOOL_REGISTRY.length)
        expect(new Set(groupedKeys).size).toBe(TOOL_REGISTRY.length)
    })

    it("keeps all user-facing menu groups available", () => {
        const groups = getMenuGroups()
        expect(groups.map((group) => group.slug)).toEqual([
            "format-validate",
            "convert-encode",
            "text-content",
            "web-api",
            "generators-ids",
            "design-media",
        ])
    })
})
