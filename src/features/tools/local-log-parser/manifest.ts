import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "local_log_parser",
    slug: "local-log-parser",
    category: "network-web",
    relatedTools: ["json_formatter", "ndjson_formatter", "regex_tester", "text_diff_checker"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["log parser", "log analyzer", "json lines", "ndjson logs", "log viewer"],
    searchKeywords: ["parse logs", "analyze logs", "log level", "error logs", "日志解析", "ログ解析", "로그 파서"],
    persistInput: false,
} satisfies ToolMeta
