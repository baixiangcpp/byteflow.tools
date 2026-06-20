import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "ndjson_formatter",
    slug: "ndjson-formatter",
    category: "formatters",
    relatedTools: ["json_formatter", "csv_json_converter", "json_diff_viewer", "jsonpath_playground"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["ndjson formatter", "newline json", "jsonl formatter", "ndjson to json array"],
} satisfies ToolMeta
