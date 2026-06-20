import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "har_viewer_sanitizer",
    slug: "har-viewer-sanitizer",
    category: "network-web",
    relatedTools: ["local_log_parser", "log_scrubber", "http_status_codes", "security_header_analyzer"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["har viewer", "har sanitizer", "http archive", "network log sanitizer", "har redaction"],
    persistInput: false,
} satisfies ToolMeta
