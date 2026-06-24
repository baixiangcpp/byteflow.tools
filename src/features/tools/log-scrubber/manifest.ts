import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "log_scrubber",
    slug: "log-scrubber",
    category: "network-web",
    relatedTools: ["local_log_parser", "security_header_analyzer", "jwt_decoder", "text_diff_checker"],
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
        { toolKey: "local_log_parser", reasonKey: "parse_after_redaction" },
        { toolKey: "jwt_decoder", reasonKey: "inspect_redacted_tokens" },
        { toolKey: "text_diff_checker", reasonKey: "compare_scrubbed_logs" },
    ],
    keywords: ["log scrubber", "log redaction", "secret redaction", "pii remover"],
    persistInput: false,
} satisfies ToolMeta
