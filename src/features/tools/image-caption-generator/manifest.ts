import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_caption_generator",
    slug: "image-caption-generator",
    category: "generators",
    relatedTools: ["image_color_extractor", "code_to_image_converter", "image_average_color_finder", "color_mixer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["image caption generator", "add text to image", "caption maker", "image quote generator"],
} satisfies ToolMeta
