import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "log_scrubber",
    slug: "log-scrubber",
    category: "network-web",
    relatedTools: ["local_log_parser", "security_header_analyzer", "jwt_decoder", "text_diff_checker"],
    keywords: ["log scrubber", "log redaction", "secret redaction", "pii remover"],
    persistInput: false,
} satisfies ToolMeta
