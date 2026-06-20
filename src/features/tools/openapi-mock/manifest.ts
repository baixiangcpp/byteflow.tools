import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "openapi_mock",
    slug: "openapi-mock",
    category: "network-web",
    relatedTools: ["openapi_viewer", "http_request_builder", "json_formatter", "curl_to_code"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["openapi mock", "swagger mock", "api mock generator", "mock response generator"],
} satisfies ToolMeta
