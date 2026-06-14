import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "color_shades_generator",
    slug: "color-shades-generator",
    category: "generators",
    relatedTools: ["ai_color_palette_generator", "color_mixer", "color_converter", "css_gradient_generator"],
    keywords: ["color shades generator", "tailwind color scale", "color ramp generator", "generate color tokens"],
} satisfies ToolMeta
