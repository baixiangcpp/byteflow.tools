import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_glassmorphism_generator",
    slug: "css-glassmorphism-generator",
    category: "generators",
    relatedTools: ["css_gradient_generator", "css_box_shadow_generator", "css_border_radius_generator", "color_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css glassmorphism generator", "glass effect css", "frosted glass ui", "backdrop filter generator"],
} satisfies ToolMeta
