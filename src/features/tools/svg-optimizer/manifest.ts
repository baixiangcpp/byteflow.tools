import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "svg_optimizer",
    slug: "svg-optimizer",
    category: "formatters",
    relatedTools: ["css_minifier", "html_css_beautifier", "image_base64"],
    keywords: ["svg optimizer", "svgo online", "optimize svg", "compress svg"],
} satisfies ToolMeta
