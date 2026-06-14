import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "google_fonts_pair_finder",
    slug: "google-fonts-pair-finder",
    category: "text-string",
    relatedTools: ["color_converter", "ai_color_palette_generator", "code_to_image_converter", "open_graph_meta_generator"],
    keywords: ["google fonts pair finder", "font pairing generator", "typography pairing", "font combination tool"],
} satisfies ToolMeta
