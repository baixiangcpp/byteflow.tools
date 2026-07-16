import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jsonpath_playground",
    slug: "jsonpath-playground",
    inputBehavior: "explicit-sample",
    category: "formatters",
    relatedTools: ["json_formatter", "json_diff_viewer", "json_to_typescript", "yaml_json_converter"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["jsonpath tester", "jsonpath playground", "jsonpath query", "json path online"],
} satisfies ToolMeta
