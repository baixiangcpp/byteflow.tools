import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_background_pattern_generator",
    slug: "css-background-pattern-generator",
    category: "generators",
    relatedTools: ["css_border_radius_generator", "css_box_shadow_generator", "color_converter", "css_minifier"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css background pattern generator", "css texture generator", "css background maker", "pattern css online"],
} satisfies ToolMeta
