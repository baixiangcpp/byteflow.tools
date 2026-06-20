import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_filters",
    slug: "image-filters",
    category: "generators",
    relatedTools: ["instagram_filters", "image_cropper", "image_caption_generator", "image_color_extractor"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["image filters", "photo filter editor", "adjust brightness contrast image", "image effects online"],
} satisfies ToolMeta
