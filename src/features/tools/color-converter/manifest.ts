import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "color_converter",
    slug: "color-converter",
    category: "generators",
    relatedTools: ["css_minifier", "html_css_beautifier", "svg_optimizer"],
    keywords: ["color converter", "hex to rgb", "hsl converter", "color picker online"],
} satisfies ToolMeta
