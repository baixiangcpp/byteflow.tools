import { describe, expect, it } from "vitest"
import { TOOL_REGISTRY } from "@/core/registry"
import { getMenuGroupByKey, getMenuGroups } from "@/core/registry/menu-groups"

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
            "data-code-formats",
            "encoding-crypto",
            "web-api-network",
            "devops-logs",
            "text-regex",
            "images-svg-css",
            "generators-calculators",
            "social-metadata",
        ])
    })

    it("keeps legacy hub keys resolvable while primary groups move to practical families", () => {
        expect(getMenuGroupByKey("format_validate")).toBeTruthy()
        expect(getMenuGroupByKey("convert_encode")).toBeTruthy()
        expect(getMenuGroupByKey("design_media")).toBeTruthy()

        expect(getMenuGroupByKey("data_code_formats" as never)?.items.map((tool) => tool.key)).toContain("json_formatter")
        expect(getMenuGroupByKey("encoding_crypto" as never)?.items.map((tool) => tool.key)).toEqual(
            expect.arrayContaining(["jwt_decoder", "certificate_decoder", "base64_encode_decode"]),
        )
        expect(getMenuGroupByKey("images_svg_css" as never)?.items.map((tool) => tool.key)).toEqual(
            expect.arrayContaining(["css_gradient_generator", "svg_optimizer", "image_resizer"]),
        )
        expect(getMenuGroupByKey("generators_calculators" as never)?.items.map((tool) => tool.key)).not.toContain(
            "css_gradient_generator",
        )
    })
})
