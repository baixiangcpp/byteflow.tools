import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "open_graph_meta_generator",
    slug: "open-graph-meta-generator",
    category: "generators",
    relatedTools: ["tweet_generator", "tweet_to_image_converter", "instagram_post_generator", "instagram_story_generator"],
    keywords: ["open graph meta generator", "og tags generator", "twitter card meta tags", "social preview meta"],
} satisfies ToolMeta
