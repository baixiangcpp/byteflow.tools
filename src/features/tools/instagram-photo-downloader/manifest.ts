import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "instagram_photo_downloader",
    slug: "instagram-photo-downloader",
    category: "generators",
    relatedTools: ["instagram_post_generator", "instagram_story_generator", "instagram_filters", "image_resizer"],
    privacy: {
        executionMode: "external-request",
        offlineCapable: false,
        sensitiveInput: true,
        externalRequest: {
            required: true,
            endpointType: "user_provided_url",
            domains: ["instagram.com"],
            purposeKey: "authorized_media_download",
            userDataSent: "user_provided_url",
            disclosure: "Requests the Instagram URL you provide only after you confirm rights and click Download.",
            consentRequired: true,
        },
    },
    keywords: ["instagram photo downloader", "download instagram image", "instagram media saver", "authorized ig image download"],
    persistInput: false,
    deprecated: {
        reason: "strategic-refocus",
    },
} satisfies ToolMeta
