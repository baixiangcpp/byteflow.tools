import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "har_viewer_sanitizer",
    slug: "har-viewer-sanitizer",
    category: "network-web",
    relatedTools: ["local_log_parser", "log_scrubber", "http_status_codes", "security_header_analyzer"],
    keywords: ["har viewer", "har sanitizer", "http archive", "network log sanitizer", "har redaction"],
} satisfies ToolMeta
