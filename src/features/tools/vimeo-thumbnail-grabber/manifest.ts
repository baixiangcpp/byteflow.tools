import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "vimeo_thumbnail_grabber",
    slug: "vimeo-thumbnail-grabber",
    category: "generators",
    relatedTools: ["youtube_thumbnail_grabber", "tweet_to_image_converter", "open_graph_meta_generator", "image_resizer"],
    keywords: ["vimeo thumbnail grabber", "vimeo thumbnail downloader", "vimeo cover image", "get vimeo video thumbnail"],
    deprecated: {
        alternatives: ["image_resizer"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
