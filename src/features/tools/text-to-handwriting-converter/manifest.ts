import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "text_to_handwriting_converter",
    slug: "text-to-handwriting-converter",
    category: "text-string",
    relatedTools: ["code_to_image_converter", "google_fonts_pair_finder", "image_caption_generator", "instagram_post_generator"],
    keywords: ["text to handwriting converter", "handwriting generator", "typed text to handwritten", "handwriting png"],
} satisfies ToolMeta
