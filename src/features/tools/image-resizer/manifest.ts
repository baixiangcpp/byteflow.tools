import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_resizer",
    slug: "image-resizer",
    category: "generators",
    relatedTools: ["image_cropper", "image_filters", "image_base64", "code_to_image_converter"],
    keywords: ["image resizer", "resize image online", "change photo dimensions", "image resize tool"],
} satisfies ToolMeta
