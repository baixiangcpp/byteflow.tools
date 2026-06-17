import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "json_formatter",
    slug: "json-formatter",
    category: "formatters",
    relatedTools: ["jsonpath_playground", "json_diff_viewer", "json_to_typescript", "yaml_json_converter"],
    keywords: ["json formatter", "json beautifier", "json prettify", "format json online"],
    searchKeywords: ["beautify", "pretty print", "validate", "美化", "格式化", "验证", "格式化", "フォーマット", "검증", "포맷"],
    persistInput: false,
} satisfies ToolMeta
