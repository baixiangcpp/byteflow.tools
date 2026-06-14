import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "css_minifier",
    slug: "css-minifier",
    category: "formatters",
    relatedTools: ["html_css_beautifier", "svg_optimizer", "json_formatter"],
    keywords: ["css minifier", "minify css online", "css compressor", "css optimize"],
} satisfies ToolMeta
