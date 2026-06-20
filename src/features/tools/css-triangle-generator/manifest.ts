import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_triangle_generator",
    slug: "css-triangle-generator",
    category: "generators",
    relatedTools: ["css_clip_path_generator", "css_switch_generator", "css_border_radius_generator", "css_minifier"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css triangle generator", "triangle arrow css", "tooltip arrow css", "directional triangle css"],
} satisfies ToolMeta
