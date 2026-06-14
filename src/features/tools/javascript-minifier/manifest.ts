import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "javascript_minifier",
    slug: "javascript-minifier",
    category: "formatters",
    relatedTools: ["javascript_formatter", "css_minifier", "html_formatter", "json_formatter"],
    keywords: ["javascript minifier", "js minify", "minify javascript", "compress javascript online"],
} satisfies ToolMeta
