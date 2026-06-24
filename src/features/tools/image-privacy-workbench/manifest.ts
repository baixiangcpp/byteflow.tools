import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_privacy_workbench",
    slug: "image-privacy-workbench",
    category: "generators",
    relatedTools: ["photo_censor", "image_resizer", "image_base64", "svg_optimizer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "PNG or JPEG image file",
    sampleMode: "strip-metadata",
    keywords: ["exif remover", "screenshot redaction", "image metadata remover", "privacy image tool"],
    searchKeywords: ["exif", "metadata", "redact", "screenshot", "privacy"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
