import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_box_shadow_generator",
    slug: "css-box-shadow-generator",
    category: "generators",
    relatedTools: ["css_border_radius_generator", "css_background_pattern_generator", "color_converter", "css_minifier"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css box shadow generator", "shadow generator", "css shadow builder", "box shadow css online"],
} satisfies ToolMeta
