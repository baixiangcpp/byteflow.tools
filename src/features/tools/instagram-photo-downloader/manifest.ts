import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "instagram_photo_downloader",
    slug: "instagram-photo-downloader",
    category: "generators",
    relatedTools: ["instagram_post_generator", "instagram_story_generator", "instagram_filters", "image_resizer"],
    keywords: ["instagram photo downloader", "download instagram image", "instagram media saver", "authorized ig image download"],
    networkAccess: "user_requested",
    networkHosts: ["instagram.com"],
    networkPurposeKey: "authorized_media_download",
    allowUserProvidedUrl: true,
    requiresExplicitUserAction: true,
    externalDataSent: "user_provided_url",
    deprecated: {
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
