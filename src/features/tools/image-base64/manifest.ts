import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_base64",
    slug: "image-base64",
    category: "text-string",
    relatedTools: ["base64_encode_decode", "svg_optimizer", "qr_code_generator"],
    keywords: ["image to base64", "base64 to image", "convert image base64 online"],
} satisfies ToolMeta
