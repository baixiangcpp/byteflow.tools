import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "header_diff",
    slug: "header-diff",
    category: "network-web",
    relatedTools: ["http_status_codes", "http_request_builder", "csp_parser", "text_diff_checker"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["header diff", "http header compare", "request diff", "header comparison"],
    persistInput: false,
} satisfies ToolMeta
