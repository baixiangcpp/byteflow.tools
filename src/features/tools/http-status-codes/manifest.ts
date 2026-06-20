import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "http_status_codes",
    slug: "http-status-codes",
    category: "network-web",
    relatedTools: ["user_agent_parser", "url_encode_decode", "url_parser", "http_request_builder"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["http status codes", "http response codes list", "status code reference"],
} satisfies ToolMeta
