import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "json_to_typescript",
    slug: "json-to-typescript",
    category: "formatters",
    relatedTools: ["json_formatter", "json_schema_workbench", "yaml_json_converter", "jsonpath_playground"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["json to typescript", "json to interface", "generate typescript types", "json to ts"],
    searchKeywords: ["generate types", "interface", "type definition", "生成类型", "インターフェース", "타입 생성", "型定義"],
} satisfies ToolMeta
