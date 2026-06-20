import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "yq_playground",
    slug: "yq-playground",
    category: "network-web",
    relatedTools: ["yaml_json_converter", "json_formatter", "jq_playground", "jsonpath_playground"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["yq playground", "yaml query", "yaml filter", "yq online", "yaml transform"],
} satisfies ToolMeta
