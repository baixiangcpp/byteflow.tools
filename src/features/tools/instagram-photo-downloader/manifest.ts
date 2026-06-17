import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "instagram_photo_downloader",
    slug: "instagram-photo-downloader",
    category: "generators",
    relatedTools: ["instagram_post_generator", "instagram_story_generator", "instagram_filters", "image_resizer"],
    keywords: ["instagram photo downloader", "download instagram image", "instagram media saver", "authorized ig image download"],
    networkAccess: "user_requested",
    deprecated: {
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
