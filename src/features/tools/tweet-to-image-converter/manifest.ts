import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "tweet_to_image_converter",
    slug: "tweet-to-image-converter",
    category: "generators",
    relatedTools: ["tweet_generator", "open_graph_meta_generator", "instagram_post_generator", "code_to_image_converter"],
    keywords: ["tweet to image converter", "convert tweet to png", "tweet image converter", "x post image maker"],
    deprecated: {
        alternatives: ["code_to_image_converter"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
