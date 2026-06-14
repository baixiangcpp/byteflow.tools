import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "json_to_typescript",
    slug: "json-to-typescript",
    category: "formatters",
    relatedTools: ["json_formatter", "yaml_json_converter", "jsonpath_playground"],
    keywords: ["json to typescript", "json to interface", "generate typescript types", "json to ts"],
    searchKeywords: ["generate types", "interface", "type definition", "生成类型", "インターフェース", "타입 생성", "型定義"],
} satisfies ToolMeta
