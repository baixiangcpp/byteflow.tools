import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "html_css_beautifier",
    slug: "html-css-beautifier",
    category: "formatters",
    relatedTools: ["html_formatter", "css_minifier", "svg_optimizer", "xml_formatter"],
    keywords: ["html beautifier", "css formatter", "html formatter online", "beautify html css"],
} satisfies ToolMeta
