import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "json_formatter",
    slug: "json-formatter",
    category: "formatters",
    relatedTools: ["jsonpath_playground", "json_diff_viewer", "json_to_typescript", "yaml_json_converter"],
    relatedWorkflows: [
        { toolKey: "json_to_typescript", reasonKey: "typed_model_from_formatted_json", handoffSupported: true },
        { toolKey: "jsonpath_playground", reasonKey: "query_formatted_json", handoffSupported: true },
        { toolKey: "json_diff_viewer", reasonKey: "compare_after_formatting", handoffSupported: true },
    ],
    sampleInput: "{\"user\":{\"id\":1001,\"name\":\"Alice Chen\",\"active\":true}}",
    sampleMode: "format",
    keywords: ["json formatter", "json beautifier", "json prettify", "format json online"],
    searchKeywords: ["beautify", "pretty print", "validate", "美化", "格式化", "验证", "格式化", "フォーマット", "검증", "포맷"],
    persistInput: false,
} satisfies ToolMeta
