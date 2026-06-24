import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "photo_censor",
    slug: "photo-censor",
    category: "generators",
    relatedTools: ["image_privacy_workbench", "image_filters", "image_cropper", "image_resizer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["photo censor", "blur image area", "pixelate image region", "hide sensitive info image"],
} satisfies ToolMeta
