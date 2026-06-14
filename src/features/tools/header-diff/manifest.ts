import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "header_diff",
    slug: "header-diff",
    category: "network-web",
    relatedTools: ["http_status_codes", "http_request_builder", "csp_parser", "text_diff_checker"],
    keywords: ["header diff", "http header compare", "request diff", "header comparison"],
} satisfies ToolMeta
