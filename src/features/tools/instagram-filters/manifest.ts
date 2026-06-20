import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "instagram_filters",
    slug: "instagram-filters",
    category: "generators",
    relatedTools: ["instagram_post_generator", "instagram_story_generator", "image_filters", "instagram_photo_downloader"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["instagram filters", "ig filters online", "instagram style photo editor", "photo preset filters"],
    deprecated: {
        alternatives: ["image_filters"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
