import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_resizer",
    slug: "image-resizer",
    category: "generators",
    relatedTools: ["image_cropper", "image_filters", "image_base64", "code_to_image_converter"],
    inputSizePolicy: {
        warnAtBytes: 6291456,
        hardLimitBytes: 12582912,
        streamingSupported: false,
    },
    keywords: ["image resizer", "resize image online", "change photo dimensions", "image resize tool"],
} satisfies ToolMeta
