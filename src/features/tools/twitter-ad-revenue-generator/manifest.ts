import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "twitter_ad_revenue_generator",
    slug: "twitter-ad-revenue-generator",
    category: "generators",
    relatedTools: ["tweet_generator", "tweet_to_image_converter", "open_graph_meta_generator", "id_generator"],
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
        platformName: "X (Twitter)",
        rightsGuidance: "Use forecast values as planning estimates; verify actual platform terms and analytics separately.",
        affiliationDisclaimer: "byteflow.tools is not affiliated with, endorsed by, or sponsored by X Corp. or Twitter.",
    },
    keywords: ["twitter ad revenue generator", "x ad revenue calculator", "social ad revenue forecast", "cpm ctr calculator"],
    deprecated: {
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
