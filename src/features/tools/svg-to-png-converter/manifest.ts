import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "svg_to_png_converter",
    slug: "svg-to-png-converter",
    category: "generators",
    relatedTools: ["svg_optimizer", "svg_pattern_generator", "svg_blob_generator", "svg_stroke_to_fill_converter"],
    keywords: ["svg to png converter", "convert svg to png", "svg rasterizer", "export svg as png"],
} satisfies ToolMeta
