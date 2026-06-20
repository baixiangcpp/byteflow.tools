import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "html_encoder_decoder",
    slug: "html-encoder-decoder",
    category: "formatters",
    relatedTools: ["html_formatter", "html_minifier", "url_encode_decode", "base64_encode_decode"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["html encoder", "html decoder", "html entities encode", "html entities decode"],
} satisfies ToolMeta
