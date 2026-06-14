import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "openapi_mock",
    slug: "openapi-mock",
    category: "network-web",
    relatedTools: ["openapi_viewer", "http_request_builder", "json_formatter", "curl_to_code"],
    keywords: ["openapi mock", "swagger mock", "api mock generator", "mock response generator"],
} satisfies ToolMeta
