import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "curl_to_code",
    slug: "curl-to-code",
    category: "network-web",
    relatedTools: ["http_request_builder", "url_parser", "http_status_codes", "jwt_decoder"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["curl to code", "curl to javascript", "curl to python", "curl converter online"],
} satisfies ToolMeta
