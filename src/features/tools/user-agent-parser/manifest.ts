import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "user_agent_parser",
    slug: "user-agent-parser",
    category: "network-web",
    relatedTools: ["url_encode_decode", "http_status_codes", "url_parser", "chmod_calculator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["user agent parser", "parse user agent", "ua string analyzer online"],
} satisfies ToolMeta
