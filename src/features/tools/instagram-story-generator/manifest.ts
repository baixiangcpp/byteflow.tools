import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "instagram_story_generator",
    slug: "instagram-story-generator",
    category: "generators",
    relatedTools: ["instagram_post_generator", "tweet_generator", "instagram_filters", "open_graph_meta_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["instagram story generator", "instagram story template", "story mockup generator", "social story maker"],
    deprecated: {
        alternatives: ["code_to_image_converter", "image_filters"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
