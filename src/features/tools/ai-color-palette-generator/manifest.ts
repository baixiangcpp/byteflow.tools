import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "ai_color_palette_generator",
    slug: "ai-color-palette-generator",
    category: "generators",
    relatedTools: ["color_mixer", "color_shades_generator", "color_converter", "css_gradient_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["ai color palette generator", "brand palette generator", "color scheme creator", "palette maker online"],
} satisfies ToolMeta
