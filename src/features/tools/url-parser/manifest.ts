import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "url_parser",
    slug: "url-parser",
    category: "network-web",
    relatedTools: ["url_encode_decode", "http_status_codes", "user_agent_parser", "http_request_builder"],
    keywords: ["url parser", "url decoder", "query string parser", "url components breakdown"],
} satisfies ToolMeta
