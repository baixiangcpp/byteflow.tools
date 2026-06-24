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
    relatedWorkflows: [
        { toolKey: "log_scrubber", reasonKey: "scrub_followup_logs" },
        { toolKey: "http_status_codes", reasonKey: "explain_har_statuses" },
        { toolKey: "security_header_analyzer", reasonKey: "review_response_headers" },
    ],
    keywords: ["har viewer", "har sanitizer", "http archive", "network log sanitizer", "har redaction"],
    persistInput: false,
} satisfies ToolMeta
