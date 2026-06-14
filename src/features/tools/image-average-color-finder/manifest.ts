import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_average_color_finder",
    slug: "image-average-color-finder",
    category: "generators",
    relatedTools: ["image_color_extractor", "ai_color_palette_generator", "color_shades_generator", "color_converter"],
    keywords: ["image average color finder", "average image color", "dominant average hex", "image color analyzer"],
} satisfies ToolMeta
