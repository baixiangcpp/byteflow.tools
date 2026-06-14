import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "instagram_post_generator",
    slug: "instagram-post-generator",
    category: "generators",
    relatedTools: ["instagram_story_generator", "tweet_generator", "instagram_filters", "open_graph_meta_generator"],
    keywords: ["instagram post generator", "instagram mockup maker", "social post generator", "instagram post template"],
    deprecated: {
        alternatives: ["code_to_image_converter", "open_graph_meta_generator"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
