import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "youtube_thumbnail_grabber",
    slug: "youtube-thumbnail-grabber",
    category: "generators",
    relatedTools: ["vimeo_thumbnail_grabber", "tweet_to_image_converter", "open_graph_meta_generator", "image_resizer"],
    keywords: ["youtube thumbnail grabber", "youtube thumbnail downloader", "youtube video thumbnail", "get youtube thumbnail url"],
    networkAccess: "user_requested",
    deprecated: {
        alternatives: ["image_resizer"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
