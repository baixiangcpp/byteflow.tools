import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_color_picker",
    slug: "image-color-picker",
    category: "generators",
    relatedTools: ["image_color_extractor", "image_average_color_finder", "color_converter", "color_mixer"],
    keywords: ["image color picker", "pick color from image", "image hex picker", "sample image color"],
} satisfies ToolMeta
