import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "security_header_analyzer",
    slug: "security-header-analyzer",
    category: "network-web",
    relatedTools: ["csp_parser", "header_diff", "http_status_codes", "certificate_decoder"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["security header analyzer", "http security headers", "csp hsts checker", "header security audit"],
    persistInput: false,
} satisfies ToolMeta
