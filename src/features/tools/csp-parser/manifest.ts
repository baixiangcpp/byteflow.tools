import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "csp_parser",
    slug: "csp-parser",
    category: "network-web",
    relatedTools: ["http_status_codes", "certificate_decoder", "header_diff", "robots_txt_tester"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["csp parser", "content security policy analyzer", "csp validator", "csp checker"],
    persistInput: false,
} satisfies ToolMeta
