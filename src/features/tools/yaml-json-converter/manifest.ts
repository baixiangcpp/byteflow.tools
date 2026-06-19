import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "yaml_json_converter",
    slug: "yaml-json-converter",
    category: "formatters",
    relatedTools: ["json_formatter", "json_to_typescript", "structured_data_visualizer", "xml_formatter"],
    keywords: ["yaml to json", "json to yaml", "toml to json", "json to toml", "yaml json toml converter"],
    searchKeywords: ["convert yaml", "convert toml", "toml parser", "json converter", "YAML转换", "TOML转换", "YAML変換", "TOML変換", "YAML 변환", "TOML 변환", "配置转换"],
} satisfies ToolMeta
