import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "yaml_json_converter",
    slug: "yaml-json-converter",
    category: "formatters",
    relatedTools: ["json_formatter", "json_to_typescript", "jsonpath_playground", "xml_formatter"],
    keywords: ["yaml to json", "json to yaml", "yaml converter online", "yaml json transform"],
    searchKeywords: ["convert yaml", "yaml parser", "json converter", "YAML转换", "YAML変換", "YAML 변환", "配置转换"],
} satisfies ToolMeta
