import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "instagram_post_generator",
    slug: "instagram-post-generator",
    category: "generators",
    relatedTools: ["instagram_story_generator", "tweet_generator", "instagram_filters", "open_graph_meta_generator"],
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
        platformName: "Instagram",
        rightsGuidance: "Use generated mockups only with media, captions, and profile details you own or can reuse.",
        affiliationDisclaimer: "byteflow.tools is not affiliated with, endorsed by, or sponsored by Instagram or Meta.",
    },
    keywords: ["instagram post generator", "instagram mockup maker", "social post generator", "instagram post template"],
    deprecated: {
        alternatives: ["code_to_image_converter", "open_graph_meta_generator"],
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
