import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "javascript_formatter",
    slug: "javascript-formatter",
    category: "formatters",
    relatedTools: ["json_formatter", "html_css_beautifier", "sql_formatter", "markdown_preview"],
    keywords: ["javascript formatter", "js formatter", "beautify javascript", "format javascript online"],
    searchKeywords: ["beautify js", "format javascript", "js beautifier", "JS格式化", "JS整形", "자바스크립트 포맷", "美化代码"],
} satisfies ToolMeta
