import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "sql_formatter",
    slug: "sql-formatter",
    category: "formatters",
    relatedTools: ["json_formatter", "xml_formatter", "html_css_beautifier"],
    keywords: ["sql formatter", "sql beautifier", "format sql online", "sql pretty print"],
    searchKeywords: ["beautify sql", "format sql", "sql validator", "SQL格式化", "SQL整形", "SQL 포맷", "格式化查询"],
} satisfies ToolMeta
