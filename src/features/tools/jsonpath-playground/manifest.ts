import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "jsonpath_playground",
    slug: "jsonpath-playground",
    category: "formatters",
    relatedTools: ["json_formatter", "json_diff_viewer", "json_to_typescript", "yaml_json_converter"],
    keywords: ["jsonpath tester", "jsonpath playground", "jsonpath query", "json path online"],
} satisfies ToolMeta
