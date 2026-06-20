import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_cropper",
    slug: "image-cropper",
    category: "generators",
    relatedTools: ["image_filters", "image_caption_generator", "code_to_image_converter", "image_base64"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["image cropper", "crop image online", "photo crop tool", "crop png jpg"],
} satisfies ToolMeta
