import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "color_mixer",
    slug: "color-mixer",
    category: "generators",
    relatedTools: ["color_shades_generator", "color_converter", "ai_color_palette_generator", "css_gradient_generator"],
    keywords: ["color mixer", "mix two colors", "rgb color blend", "hsl color blend"],
} satisfies ToolMeta
