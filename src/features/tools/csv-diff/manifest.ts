import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "csv_diff",
    slug: "csv-diff",
    category: "formatters",
    relatedTools: ["csv_json_converter", "text_diff_checker", "json_diff_viewer", "header_diff"],
    keywords: ["csv diff", "csv compare", "csv difference checker", "spreadsheet diff"],
} satisfies ToolMeta
