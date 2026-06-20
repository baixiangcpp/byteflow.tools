import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "tweet_generator",
    slug: "tweet-generator",
    category: "generators",
    relatedTools: ["tweet_to_image_converter", "open_graph_meta_generator", "twitter_ad_revenue_generator", "instagram_post_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["tweet generator", "twitter post generator", "tweet image maker", "social tweet mockup"],
    deprecated: {
        alternatives: ["code_to_image_converter", "open_graph_meta_generator"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
