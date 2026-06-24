import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "open_graph_meta_generator",
    slug: "open-graph-meta-generator",
    category: "generators",
    relatedTools: ["tweet_generator", "tweet_to_image_converter", "instagram_post_generator", "instagram_story_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    compliance: {
        platformName: "Open Graph and social cards",
        rightsGuidance: "Generate metadata for pages, images, and descriptions you control or have rights to publish.",
        affiliationDisclaimer: "Open Graph, X (Twitter), Instagram, YouTube, and Vimeo names are used descriptively only.",
    },
    relatedWorkflows: [
        { toolKey: "tweet_generator", reasonKey: "draft_social_copy" },
        { toolKey: "tweet_to_image_converter", reasonKey: "turn_copy_into_preview" },
        { toolKey: "instagram_post_generator", reasonKey: "adapt_preview_for_instagram" },
    ],
    keywords: ["open graph meta generator", "og tags generator", "twitter card meta tags", "social preview meta"],
} satisfies ToolMeta
