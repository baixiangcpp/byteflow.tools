import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "csv_json_converter",
    slug: "csv-json-converter",
    category: "formatters",
    relatedTools: ["json_formatter", "yaml_json_converter", "json_to_typescript", "text_diff_checker"],
    keywords: ["csv to json", "json to csv", "csv converter online", "csv json transform"],
} satisfies ToolMeta
