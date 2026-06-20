import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jq_playground",
    slug: "jq-playground",
    category: "network-web",
    relatedTools: ["json_formatter", "jsonpath_playground", "json_to_typescript", "yaml_json_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["jq playground", "jq online", "json query language", "jq filter", "json transform"],
    searchKeywords: ["jq", "json query", "json filter", "json transform", "jq tutorial", "jq在线", "JSON查询", "jqプレイグラウンド"],
} satisfies ToolMeta
