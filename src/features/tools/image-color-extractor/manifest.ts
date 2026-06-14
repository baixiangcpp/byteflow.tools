import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_color_extractor",
    slug: "image-color-extractor",
    category: "generators",
    relatedTools: ["image_average_color_finder", "color_shades_generator", "ai_color_palette_generator", "color_mixer"],
    keywords: ["image color extractor", "extract color palette from image", "image palette generator", "dominant colors from photo"],
} satisfies ToolMeta
