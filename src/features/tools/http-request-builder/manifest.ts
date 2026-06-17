import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "http_request_builder",
    slug: "http-request-builder",
    category: "network-web",
    relatedTools: ["url_parser", "http_status_codes", "url_encode_decode", "user_agent_parser"],
    keywords: ["http request builder", "curl generator", "api request builder", "rest client online"],
    persistInput: false,
} satisfies ToolMeta
