import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "photo_censor",
    slug: "photo-censor",
    category: "generators",
    relatedTools: ["image_filters", "image_cropper", "image_resizer", "scanned_pdf_converter"],
    keywords: ["photo censor", "blur image area", "pixelate image region", "hide sensitive info image"],
} satisfies ToolMeta
