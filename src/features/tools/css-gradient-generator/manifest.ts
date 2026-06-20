import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_gradient_generator",
    slug: "css-gradient-generator",
    category: "generators",
    relatedTools: ["css_glassmorphism_generator", "color_converter", "css_background_pattern_generator", "css_minifier"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["css gradient generator", "linear gradient css", "radial gradient generator", "gradient maker online"],
} satisfies ToolMeta
